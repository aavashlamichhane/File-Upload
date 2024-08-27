const path = require('path');
const fs = require('fs');

class specialError extends Error{
    constructor(message, status){
        super(message);
        this.status = status;
        Error.captureStackTrace(this, this.constructor);
    }
}

const {
    UPLOAD_DIR,
    MAX_SIZE,
    MAX_SINGLE,
    MAX_NUM,
    MAX_REQ_SIZE
} = require('../constants/constants.js');

async function getDirStat(dirPath){  //Returns size and number of files in a directory
    let size = 0;
    let num = 0;
    const files = await fs.promises.readdir(dirPath);

    for(const file of files){
        const filePath = path.join(dirPath,file);
        const stats = await fs.promises.stat(filePath);

        if(stats.isFile()){
            size+=stats.size;
            num+=1;
        } else if(stats.isDirectory()){
            const {size:s, num:n} = await getDirStat(filePath);
            size+=s;
            num+=n;
        }
    }
    return {size, num};
}

async function checkTotalSize(req, res, next) {
    try{
        const {size,num} = await getDirStat(UPLOAD_DIR);

        if (!Array.isArray(req.files)) {
            throw new specialError('No files found in the request.',400);
        }

        const {reqSize,reqNum} = req.files.reduce((total, file) => {
            total.reqSize += file.size;
            total.reqNum +=1;
            return total;
            }, {reqSize:0,reqNum:0});
        if(size>=MAX_SIZE){
            throw new specialError('Upload directory full. Cannot upload until space is freed.',403);
        } else if (size+reqSize>=MAX_SIZE){
            throw new specialError(`Processing request exceeds upload directory size limit. Can upload ${(MAX_SIZE-size)/(1024*1024)}MB only.`,403);
        } else if (reqSize > MAX_SIZE) {
            throw new specialError(`Request size exceeds ${(MAX_SIZE/(1024*1024*1024))}GB.`,403);
        } else if (num==MAX_NUM){
            throw new specialError('Upload directory has too many files. Cannot upload until number of files reduced.',402);
        } else if (num+reqNum>MAX_NUM){
            throw new specialError(`Processing request exceeds number of files limit. Can upload ${MAX_NUM-num} files only.`,402);
        }else{
            req.filesToSave = req.files;
            next();
        }
    } catch(err) {
        console.log(`Error Status ${err.status?err.status:500}: ${err.message}`);
        console.log(err.stack);
        return res.status(err.status?err.status:500).send({message:`${err.message}`});
    }
}

module.exports= {
    checkTotalSize: checkTotalSize,
};