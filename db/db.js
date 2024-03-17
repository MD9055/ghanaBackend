const mongoose = require("mongoose");
require("dotenv");
/* const excelToJson = require('convert-excel-to-json'); */

process.env.NODE_ENV = process.env.NODE_ENV || "local"; //local
//process.env.NODE_ENV = process.env.NODE_ENV || 'staging'; //staging

const config = require("../config/config.js").get(
  process.env.NODE_ENV || "local"
);

const { DB } = config;
var options = {
  user: DB.UserName,
  pass: DB.Password,
};
const MONGOURI = `mongodb://${DB.HOST}:${DB.PORT}/${DB.DATABASE}`;

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI, options);
    console.log("Connected to DB !!");
  } catch (e) {
    throw e;
  }
};

module.exports = InitiateMongoServer;
