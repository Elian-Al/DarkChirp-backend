const multer = require("multer");
const path = require("path");

// const storage = multer.diskStorage({
//     // destination: (req, file, callback) => {
//     //     callback(null, path.join(__dirname, "../public/images"));
//     // },
//     filename: (req, file, callback) => {
//         callback(null, Date.now() + "-" + file.originalname);
//     },
// });

const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).single("image");

module.exports = upload;
