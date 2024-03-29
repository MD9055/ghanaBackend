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
  user: "pradeepmeandev",
  pass: "K8CqVJkiYC4iL3U9",
};


// const MONGOURI = `mongodb://${DB.HOST}:${DB.PORT}/${DB.DATABASE}`;

// console.log(MONGOURI, "MONGOURI")

// const MONGOURI = "mongodb+srv://pradeepmeandev:K8CqVJkiYC4iL3U9@ghanadoc.sfat4gr.mongodb.net/?retryWrites=true&w=majority&appName=ghanaDoc";


const MONGOURI = "mongodb+srv://pradeepmeandev:85wJdPBPkUywJS3Q@cluster0.qhfvfea.mongodb.net/ghanaDb?retryWrites=true&w=majority";
// MONGOURI = mongodb+srv://medtoolsystems:QFoyWLCUsdKlpIYr@cluster0.nbx7mor.mongodb.net/medtoolDB?retryWrites=true&w=majority

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI);
    console.log("Connected to DB !!");
  } catch (e) {
    throw e;
  }
};

module.exports = InitiateMongoServer;
