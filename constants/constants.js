const path = require('path');

const UPLOAD_DIR = path.join(__dirname,'../uploads');
const MAX_SIZE = 3*1024*1024*1024; //GB in bytes, represents the limit of the uploads directory.
const MAX_SINGLE = 512*1024*1024;
const MAX_NUM = 200; //Max number of files possible in upload directory.
const MAX_REQ_SIZE = 1*1024*1024*1024;

module.exports = {
    UPLOAD_DIR,
    MAX_SIZE,
    MAX_SINGLE,
    MAX_NUM,
    MAX_REQ_SIZE,
}