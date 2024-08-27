const crypto = require('crypto');

// Generate a secure random string of 64 bytes and convert it to a hexadecimal string
const secretKey = crypto.randomBytes(64).toString('hex');
console.log('Secret Key:', secretKey);
