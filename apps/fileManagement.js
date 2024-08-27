const multer = require('multer');
const fs = require('fs');
const path = require('path');

const {
    UPLOAD_DIR,
    MAX_SIZE,
    MAX_SINGLE,
    MAX_NUM,
    MAX_REQ_SIZE
} = require('../constants/constants.js');

const memStorage = multer.memoryStorage();

const memUpload = multer({
    storage: memStorage,
    limits: {
        fileSize: MAX_SINGLE
    }
});

function saveFiles(req,res,next){
    if (!req.filesToSave){
        return next();
    }

    const savePromises = req.filesToSave.map(file => {
        const filePath = path.join(UPLOAD_DIR, Date.now()+'-'+file.originalname);
        return fs.promises.writeFile(filePath,file.buffer);
    });

    Promise.all(savePromises).then(() => {
        next();
    }).catch( err => {
        console.error('Error saving files: ',err);
        res.status(500).send({message: `${err.message}`});
    });
}

module.exports = {
    memUpload,
    saveFiles,
}





