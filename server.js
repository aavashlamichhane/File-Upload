const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const app = express();

// Set up storage destination and filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');  // Directory where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null,  Date.now() + '-' + file.originalname ); // Filename to save
    }
});

const {middlewarekey, hashedPassword} = require('./security');

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

function checkTotalSize(req, res, next) {
    let totalSize = req.files.reduce((total, file) => total + file.size, 0);
    if (totalSize > 2048 * 1024 * 1024) {  // Check total size (2GB)
        return res.status(400).send({ message: 'Total upload size exceeds 2GB.' });
    }
    next();
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
app.post('/upload', checkAuthentication, (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).send({ message: `${err.message}` });
        }
        checkTotalSize(req, res, () => {
            console.log('Files uploaded:', req.files);
            res.send('Files uploaded successfully');
        });
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
