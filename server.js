const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const app = express();

const {middlewarekey, hashedPassword} = require('./security');

app.use(express.static(path.join(__dirname,'src')));
app.use(express.static(path.join(__dirname, 'public')));

const fileMan = require('./apps/fileManagement.js');
const dirStat = require('./apps/dirStats.js');
const auth = require('./apps/auth.js');

app.use(session({
    secret: middlewarekey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

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

// Endpoint to handle file uploads
app.post('/upload', auth.checkAuthentication,fileMan.memUpload.array('files'),dirStat.checkTotalSize,fileMan.saveFiles, (req, res) => {
    console.log('File Upload Successful. Uploaded: ', req.files);
    res.status(200).send({message: 'Upload Successful.'});
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
