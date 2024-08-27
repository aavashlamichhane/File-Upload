const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const app = express();

const UPLOAD_DIR = path.join(__dirname,'uploads');
const MAX_SIZE = 3*1024*1024*1024; //GB in bytes, represents the limit of the uploads directory.
const MAX_SINGLE = 512*1024*1024;
const MAX_NUM = 200; //Max number of files possible in upload directory.
const MAX_REQ_SIZE = 1*1024*1024*1024;

const {middlewarekey, hashedPassword} = require('./security');

app.use(express.static(path.join(__dirname,'src')));
app.use(express.static(path.join(__dirname, 'public')));


// Set up storage destination and filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);  // Directory where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null,  Date.now() + '-' + file.originalname ); // Filename to save
    }
});

async function getDirStat(dirPath){
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

app.use(session({
    secret: middlewarekey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_SINGLE  // Maximum single file size (512MB)
    },
    fileFilter: async (req, file, cb) => {
        try{
            const {size,num} = await getDirStat(UPLOAD_DIR);
            const {reqSize,reqNum} = req.files.reduce((total, file) => {
                total.reqSize += file.size;
                total.reqNum +=1;
                return total;
                }, {reqSize:0,reqNum:0});
            if(size>=MAX_SIZE){
                return cb(new Error('Upload directory full. Cannot upload until space is freed.'));
            } else if (size+reqSize>=MAX_SIZE){
                return cb(new Error(`Processing request exceeds upload directory size limit. Can upload ${(MAX_SIZE - size) / (1024 * 1024)}MB only.`));
            } else if (reqSize > MAX_REQ_SIZE) {
                return cb(new Error(`Request size exceeds ${(MAX_REQ_SIZE / (1024 * 1024 * 1024))}GB.`));
            } else if (num>MAX_NUM){
                return cb(new Error('Upload directory has too many files. Cannot upload until number of files reduced.'));
            } else if (num+reqNum>MAX_NUM){
                return cb(new Error(`Processing request exceeds number of files limit. Can upload ${(MAX_NUM - num)} files only.`));
            }else{
                cb(null, true);
            }
        } catch(err) {
            console.error('Error processing upload: ',err);
            // return res.status(500).send({message:`${err}`});
            cb(err);
        }
        ;
    }
}).array('files');

async function checkTotalSize(req, res, next) {
    try{
        const {size,num} = await getDirStat(UPLOAD_DIR);
        const {reqSize,reqNum} = req.files.reduce((total, file) => {
            total.reqSize += file.size;
            total.reqNum +=1;
            return total;
            }, {reqSize:0,reqNum:0});
        if(size>=MAX_SIZE){
            return res.status(403).send({message:'Upload directory full. Cannot upload until space is freed.'});
        } else if (size+reqSize>=MAX_SIZE){
            return res.status(403).send({message:`Processing request exceeds upload directory size limit. Can upload ${(MAX_SIZE-size)/(1024*1024)}MB only.`});
        } else if (reqSize > MAX_SIZE) {
            return res.status(400).send({ message: `Request size exceeds ${(MAX_SIZE/(1024*1024*1024))}GB.` });
        } else if (num>MAX_NUM){
            return res.status(403).send({message:'Upload directory has too many files. Cannot upload until number of files reduced.'});
        } else if (num+reqNum>MAX_NUM){
            return res.status(403).send({message:`Processing request exceeds number of files limit. Can upload ${MAX_NUM-num} files only.`});
        }else{
        next();
        }
    } catch(err) {
        console.error('Error processing upload: ',err);
        return res.status(500).send({message:`${err}`});
    }
}

// Serve static files from the "public" directory
app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/authenticate', async (req, res) => {
    const { password } = req.body;

    // Check if the provided password matches the stored hashed password
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (isMatch) {
        req.session.authenticated = true;
        res.status(200).json({ success: true });
        console.log('Login Successful.');
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
        console.log(`Attemped Login. Password used: "${password}"`);
    }
});

function checkAuthentication(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized access, reload and authenticate.' });
    }
}

// Endpoint to handle file uploads
app.post('/upload', checkAuthentication, async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send({ message: `${err.message}` });
        }
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
