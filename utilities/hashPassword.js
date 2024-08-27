const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask the user for their password
rl.question('Please enter your password: ', function(password) {
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            console.error('Error hashing password:', err);
        } else {
            console.log('Hashed password:', hash);
        }
        rl.close(); // Close the readline interface
    });
});
