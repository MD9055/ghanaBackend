const express = require("express");
const ObjectId = require("mongoose").ObjectID;
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const moment = require("moment");
require("dotenv").config();
const app = express();
const cors = require("cors");
const config = require("./config/config").get(process.env.NODE_ENV);
const DB = require("./db/db");
const port = process.env.PORT || 4001;
const host = process.env.HOST;
const logger = require("morgan");
const path = require("path");
const _dirname = path.resolve();
const Blob = require("blob");
const fs = require("fs");
const mongoose = require("mongoose");
const chat = require("./model/chatModel");
const socket = require("socket.io");
const mailerData = require("./middlewares/sendEmail");
var deeplink = require("node-deeplink");
const Message = require("./model/messageModel");
const firebase = require("firebase-admin");
process.env.NODE_ENV = process.env.NODE_ENV || "local"; //local
const { PORTS, SOCKETURL, TWILLIO_ACCOUNT, SERVERKEY } = config;
const responses = require("./constant");
var FCM = require("fcm-node");
var serverKey = process.env.SERVERKEY; //put your server key here
var fcm = new FCM(serverKey);
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const { async } = require("regenerator-runtime");
const { fstat } = require("fs");
const notification = require("./model/notification");
const { sendFaxApi } = require("./middlewares/westfaxAPI_functions");
const { apnServiceiOS } = require('./middlewares/apnService')
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;


app.use(cors({ origin: "*" }));
app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  next(err);
});

app.use(express.static(_dirname));

app.use(userRoutes);
app.use(authRoutes);

DB();

app.get("/", (req, res) => {
  res.send("Welcome ! Server is working fine - go ahead....");
});

const server = app.listen(PORTS.API_PORT, () => {
  console.log("Server is listening on the port " + PORTS.API_PORT);
});

var io = require("socket.io")(server, {
  maxHttpBufferSize: 1e12,
  pingTimeout: 6000,
  cors: {
    origin: "*",
  },
});



app.set("io", io);
require("./middlewares/socketEvents")(io);
