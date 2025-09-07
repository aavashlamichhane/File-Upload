const pool = require('./db');
const {specialError} = require('./dirStats');
const bcrypt = require('bcrypt');

function checkAuthentication(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized access, reload and authenticate.' });
    }
}

async function registerUser(req,res) {
    const {username, password} = req.body;

    try {
        const client = await pool.connect();

        const userResult = await client.query('SELECT * FROM users WHERE username = $1',[username]);
        if (userResult.rows.length>0){
            throw new specialError('User Already Exists',401);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await client.query('INSERT INTO USERS (username, password) VALUES ($1,$2)',[username,hashedPassword]);

        console.log('User Registered: ',username);
        client.release();

        return res.status(201).send({success: true, message: 'User Successfully Registered.'});

    } catch (error) {
        console.error('Error registering user: ',error);
        return res.status(error.status?error.status:500).send({success: false, message: `${error.message}`});
    }
}

async function loginUser(req,res){
    const {username,password} = req.body;

    try {
        const client = await pool.connect();
        const userResult = await client.query('SELECT * FROM users WHERE username = $1',[username]);
        if (userResult.rows.length === 0){
            throw new specialError('User not found',401);
        }
        
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password,user.password);
        if(isMatch) {
            req.session.authenticated = true;
            req.session.username = username;
            console.log('Login Successful: ',username);
            return res.status(200).send({success:true, message:'Login Successful.'});
        } else {
            throw new specialError('Incorrect Password.',401);
        }

    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(error.status?error.status:500).send({ success: false, message: `${error.message}` });
    }
}

function logout(req,res){
    req.session.destroy(err=>{
        if (err){
            return res.status(500).send({success: false,message:`Logout Failed. ${err.message}`});
        }
        res.clearCookie('connect.sid');
        res.status(200).send({success:true, message:'Logged Out.'});
        console.log('User Logged Out.');
    });
}

module.exports={
    checkAuthentication,
    registerUser,
    loginUser,
    logout
}