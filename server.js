const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const app = express();

require('dotenv').config();

const {middlewarekey, hashedPassword} = require('./security');
const pool = require('./apps/db.js');

app.use(express.static(path.join(__dirname,'src')));
app.use(express.static(path.join(__dirname, 'public')));

const fileMan = require('./apps/fileManagement.js');
const dirStat = require('./apps/dirStats.js');
const { specialError } = require('./apps/dirStats.js');
const auth = require('./apps/auth.js');

app.use(session({
    secret: middlewarekey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(bodyParser.json());

// Endpoint to handle file uploads
app.post('/upload', auth.checkAuthentication,fileMan.memUpload.array('files'),dirStat.checkTotalSize,fileMan.saveFiles, (req, res) => {
    console.log('File Upload Successful. Uploaded: ', req.files);
    res.status(200).send({message: 'Upload Successful.'});
});

app.post('/register', auth.registerUser);

app.post('/logout',auth.checkAuthentication,auth.logout);

app.post('/authenticate',auth.loginUser);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
