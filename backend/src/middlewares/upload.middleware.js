const multer = require('multer');
const path = require('path');

const upload = multer({ dest: path.join(__dirname, '../../tmp') });

module.exports = upload;