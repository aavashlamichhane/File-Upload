const multer = require('multer');

const {
    UPLOAD_DIR,
    MAX_SIZE,
    MAX_SINGLE,
    MAX_NUM,
    MAX_REQ_SIZE
} = require('../constants/constants.js');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);  // Directory where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null,  Date.now() + '-' + file.originalname ); //File name generation
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_SINGLE
    },
    fileFilter: async (req, file, cb) => {
        cb(null, true);
    }
});

module.exports = {
    upload,
}





