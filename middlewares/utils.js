const { validationResult } = require("express-validator");
const fs = require("fs-extra");
const path = require("path");
// const * as crypto from "crypto";
const config = require("../config/config.js").get(process.env.NODE_ENV);

async function uploadImage(file, fileName, folder) {
  if (!fs.existsSync(path.join(__dirname, `../public/${folder}/`))) {
    // creating durectory if not exists in public directory
    fs.mkdirSync(path.join(__dirname, `../public/${folder}/`));
  }

  let filePath = path.join(__dirname, `../public/${folder}/${fileName}`);
  await file.mv(filePath);
}

// file unlinking

//   async function unlinkFile (folderFile) {
//     let folder = folderFile.split("/")[0];
//     let fileName = folderFile.split("/")[1];

//     let filePath = path.join(__dirname, `../public/${folder}/${fileName}`);

//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   };

module.exports = {
  // unlinkFile:unlinkFile,
  uploadImage: uploadImage,
};
