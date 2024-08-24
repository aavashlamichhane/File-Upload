const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const app = express();

const UPLOAD_DIR = path.join(__dirname,'uploads');
const MAX_SIZE = 3*1024*1024*1024; //GB in bytes, represents the limit of the uploads folder.

const {middlewarekey, hashedPassword} = require('./security');

// Set up storage destination and filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);  // Directory where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null,  Date.now() + '-' + file.originalname ); // Filename to save
    }
});

async function getDirSize(dirPath){
    let size = 0;

    const files = await fs.promises.readdir(dirPath);

    for(const file of files){
        const filePath = path.join(dirPath,file);
        const stats = await fs.promises.stat(filePath);

        if(stats.isFile()){
            size+=stats.size;
        } else if(stats.isDirectory()){
            size += await getDirSize(filePath);
        }
    }
    return size;
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
        fileSize: 512 * 1024 * 1024  // Maximum single file size (512MB)
    },
    fileFilter: (req, file, cb) => {
        cb(null, true);
    }
}).array('files');

async function checkTotalSize(req, res, next) {
    try{
        const size = await getDirSize(UPLOAD_DIR);
        let reqSize = req.files.reduce((total, file) => total + file.size, 0);
        if(size>=MAX_SIZE){
            return res.status(403).send({message:'Upload directory full. Cannot upload until space is freed.'});
        } else if (size+reqSize>=MAX_SIZE){
            return res.status(403).send({message:'Processing request exceeds upload directory size limit. Reduce the size of the request, or free space in upload directory.'});
        } else if (reqSize > 2048 * 1024 * 1024) {
            return res.status(400).send({ message: 'Request size exceeds 2GB.' });
        }
        next();
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
        await checkTotalSize(req, res, () => {
            console.log('Files uploaded:', req.files);
            res.status(200).send('Files uploaded successfully');
        });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
