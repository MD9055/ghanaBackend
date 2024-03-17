const express = require("express");
const userRoute = express.Router();
const responses = require("../constant");
const mongoose = require("mongoose");
const faxSchema = require("../model/westFax");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Chat = require("../model/chatModel");
const users = require("../model/users");

const {
  sendFaxApi,
  sendFaxApiReturn,
} = require("../middlewares/westfaxAPI_functions");
const {
  Security_Authenticate,
  Profile_GetAccountInfoAPI,
  Profile_GetProductList,
  Profile_GetF2EProductList,
  Profile_GetF2EProductDetail,
  sendWestFax,
  Security_Authenticate_ProductID,
  Fax_GetFaxIdentifiers,
  Fax_GetFaxDescriptions,
} = require("../middlewares/westfax");
const {
  register,
  profileUpdate,
  setupProfileUpdate,
  getAllUsers,
  getUser,
  deleteUserById,
  authenticateUser,
  getAllNurses,
  getAllPhysician,
  getAllSubadmin,
  allPhysciansAndNurses,
  count,
  currentUser,
  allSubadmin,
  updateSubadmin,
  verifyTokenData,
  getUserProfile,
  getStatus,
  accountUpdate,
  updateStatus,
  dashboardPhysicianNurses,
  getProfile,
  logout,
  nurseLoginLogs,
  fireBaseToken,
  dashboardCount,
  graphCount,
  staffAvailibility,
  assignPhysicianToNursingHome,
  removePhysician,
  nursingLatLong,
  removeAllTokens,
  resendProfilelink
} = require("../controllers/admin/users");

const {
  geoLocationUpdate,
  getAllAssisstedLiving,
  physicianAndNursesForAssistedLiving,
  updateAssistedLiving,
  assistedLivings,
  associatedAssistedLivingWeb,
} = require("../controllers/assisted_livings/controller");

const {
  allNursingHomes,
  physicianAndNursesForNursingHome,
  updateNursingHome,
  nurshingHomeList,
  associatedPhysician,
  associatedNurses,
  addNurses,
  associatedNursingHomes,
  updateNursePasswrord,
  getNurseByShift,
  updateLocationStatus,
  getByIdNursingHome
} = require("../controllers/nursing_home/controller");

const {
  allPhysicians,
  updatePhysician,
  associatedNursingHome,
  physicianAssociantedOthers,
  sendMail,
  getEmail,
  getInbox,
  addSignature,
  getSignatureById,
  deleteSignature,
  getEmailInfo,
  getDraftEmail,
  replyInboxmail,
  forwardMail,
  authenticateOutlook,
  getPhysicianDetail,
  saveCredOutlook,
  sendDraftMail
} = require("../controllers/physicians/controller");

const { saveLiveLocation } = require("../middlewares/geoFencing");

const {
  allNurses,
  updateNurse,
  physicianList,
  nursesList,
  associantedNurses,
  associatedPhysicians,
  associantedNursesWeb,
  associatedNursingHomesWeb,
  dashboardNursinghome,
  dashboardNurses,
  associantedAllData,
  associantedAllDataSelected,
  allNursesAssociatedNursinghome,
} = require("../controllers/Nurses/index");

const upload = require("../middlewares/multer");

const {
  accessChat,
  fetchChats,
  addToGroup,
  createGroupChat,
  removeFromGroup,
  renameGroup,
  rejoinStatus,
  sendMessage,
  allMessages,
  allMessagesWeb,
  allMessagesMobile,
  fetchChatsMobileTest,
  messageThreds,
  joinRoom,
  fetchRoomForCall,
  fetchRoomForCallAgora,
  globalSearch,
  participantInfo, getNotification, updateNotificationById, getAllNotification, markAllRead, unreadCount,chatFilter,allchatExport
} = require("../middlewares/chat");

const { verifyToken } = require("../middlewares/verifyToken");

const { othersList } = require("../controllers/others/controller");

const { verify } = require("jsonwebtoken");

userRoute.get("/dashboard-graph", verifyToken, dashboardCount);

userRoute.get("/graph-by-id", verifyToken, graphCount);

userRoute.post("/join-room", verifyToken, joinRoom);

userRoute.post("/current-user", verifyToken, currentUser);

userRoute.post("/register", verifyToken, upload.single("image"), register);

userRoute.post("/profileUpdate", upload.single("image"), profileUpdate);
userRoute.post("/setupProfileUpdate", upload.single("image"), setupProfileUpdate);


userRoute.get("/getAllUsers", verifyToken, getAllUsers);

userRoute.post("/getUser/:_id", verifyToken, getUser);

userRoute.post("/delete-user", verifyToken, deleteUserById);

userRoute.get("/authenticate", verifyToken, authenticateUser);

userRoute.get("/all-nursinghomes", verifyToken, allNursingHomes);

userRoute.get("/all-physicians", verifyToken, allPhysicians);

userRoute.get("/list-assistlive", verifyToken, assistedLivings);

userRoute.get("/list-nursinghome", verifyToken, nurshingHomeList);

userRoute.put("/update-nurse-password", verifyToken, updateNursePasswrord);

// userRoute.get("/all-nurses", verifyToken, getAllNurses);
// userRoute.get("/all-physician", verifyToken, getAllPhysician);
userRoute.get("/all-assistedliving", verifyToken, getAllAssisstedLiving);

userRoute.put("/update-geolocation", verifyToken, geoLocationUpdate);

userRoute.get("/all-subadmins", verifyToken, getAllSubadmin);

// userRoute.post("/attachment-upload", verifyToken, attachImage);
userRoute.post(
  "/nursinghome-physicians-nurses",
  verifyToken,
  physicianAndNursesForNursingHome
);
userRoute.get(
  "/getById",
  verifyToken,
  getByIdNursingHome
);


userRoute.post(
  "/assistedliving-physicians-nurses",
  verifyToken,
  physicianAndNursesForAssistedLiving
);

userRoute.post("/all-physician-nurses", verifyToken, allPhysciansAndNurses);

userRoute.get("/count", verifyToken, count);

userRoute.post(
  "/update-nursinghome",
  verifyToken,
  upload.single("image"),
  updateNursingHome
);

userRoute.post(
  "/update-physician",
  verifyToken,
  upload.single("image"),
  updatePhysician
);

userRoute.post(
  "/update-assisted-living",
  verifyToken,
  upload.single("image"),
  updateAssistedLiving
);

userRoute.post(
  "/update-nurse",
  verifyToken,
  upload.single("image"),
  updateNurse
);

userRoute.post(
  "/update-subadmin",
  verifyToken,
  upload.single("image"),
  updateSubadmin
);

userRoute.get("/all-nurses", verifyToken, allNurses);

userRoute.get("/all-subadmin", verifyToken, allSubadmin);

userRoute.get("/associated-physician", verifyToken, associatedPhysician);

userRoute.get("/associated-nurses", verifyToken, associatedNurses);

userRoute.post("/verify-token", verifyTokenData);

userRoute.post("/setup-profile-user", getUserProfile);

userRoute.post("/get-status", verifyToken, getStatus);

userRoute.post("/get-rejoinStatus", verifyToken, rejoinStatus);
userRoute.post("/assign-physician", verifyToken, assignPhysicianToNursingHome);
userRoute.post("/remove-physician", verifyToken, removePhysician);
userRoute.post("/get-latlang", nursingLatLong);
userRoute.post("/update-location-status", verifyToken, updateLocationStatus);

userRoute.post(
  "/update-account",
  verifyToken,
  upload.single("image"),
  accountUpdate
);

userRoute.post(
  "/send-message",
  verifyToken,
  upload.single("attachedFile"),
  sendMessage
);

userRoute.get("/other-listing", verifyToken, othersList);

userRoute.get("/get-messages-mobile", verifyToken, allMessagesMobile);

userRoute.get("/getChatlist", verifyToken, fetchChatsMobileTest);

userRoute.get("/get-messages", verifyToken, allMessages);
userRoute.get("/get-messages-web", verifyToken, allMessagesWeb);

userRoute.get("/dashboard-list", verifyToken, dashboardPhysicianNurses);

// userRoute.post('/upload-message-image', verifyToken,upload.single("image"))

userRoute.get("/get-profile", verifyToken, getProfile);

userRoute.post("/logout", verifyToken, logout);

userRoute.post("/remove-tokens", verifyToken, removeAllTokens);

userRoute.get("/associated-nurses-list", verifyToken, associantedNursesWeb);

userRoute.get("/associantedAllData", verifyToken, associantedAllData);

userRoute.post(
  "/selected-associated-users",
  verifyToken,
  associantedAllDataSelected
);

userRoute.get(
  "/associated-others-list",
  verifyToken,
  physicianAssociantedOthers
);

userRoute.post("/fetch-room-call", verifyToken, fetchRoomForCall);

userRoute.post("/fetch-room-call-agora", verifyToken, fetchRoomForCallAgora);

userRoute.get("/nurse-loginlogs", verifyToken, nurseLoginLogs);

userRoute.get("/get-notifications", verifyToken, getNotification);

userRoute.put("/update-notification", verifyToken, updateNotificationById);

userRoute.get("/all-notifications", verifyToken, getAllNotification);

userRoute.post("/mark-all-read", verifyToken, markAllRead);

userRoute.post("/staff-availibility", verifyToken, staffAvailibility);

userRoute.get("/nurse-by-shift", verifyToken, getNurseByShift);

userRoute.get('/get-unreadcount', verifyToken, unreadCount)

userRoute.get('/getChat', chatFilter)

userRoute.get('/allchatExport',allchatExport)
// userRoute.post("/connect-user-room", verifyToken, joinRoom)

associantedAllData;
userRoute.get(
  "/associated-nursing-homes-list",
  verifyToken,
  associatedNursingHomesWeb
);

userRoute.get(
  "/associated-assisted-living-list",
  verifyToken,
  associatedAssistedLivingWeb
);

userRoute.put("/updateStatus", verifyToken, updateStatus);

// Mobile APIs

userRoute.get("/dashboard-nursinghome", verifyToken, dashboardNursinghome);

userRoute.get("/dashboard-nurses", verifyToken, dashboardNurses);

userRoute.get(
  "/nursing-home-nurses",
  verifyToken,
  allNursesAssociatedNursinghome
);

userRoute.get("/associated-nurses-list-data", verifyToken, associantedNurses); // get nurse list for physicians

userRoute.get("/associated-nursing-homes", verifyToken, associatedNursingHomes); // get nursing home list for physicians

// api for the nurse to retreive associated data

userRoute.get("/associated-physicians-list", verifyToken, associatedPhysicians);

// userRoute.get("/message-threads", verifyToken, messageThreds);

let upload1 = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, "./public/upload");
    },

    filename: (req, file, callback) => {
      req.originalName = Date.now() + "-" + file.originalname;

      callback(null, req.originalName);
    },
  }),

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|mp3|wav|mp4|mov|m4a|mpeg)$/)) {
      return cb(new Error("Please Upload Image Only"));
    }

    cb(null, true);
  },
});

let uploadAudio = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, "./public/upload");
    },

    filename: (req, file, callback) => {
      req.originalName = Date.now() + "-" + file.originalname + ".mp3";

      callback(null, req.originalName);
    },
  }),
});

userRoute.post(
  "/upload-message-image",
  upload1.single("file"),
  async (req, res) => {
    // res.send(req.file.path)
    let data = await req.file;
    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: data,
    });
  },
  (error, req, res, next) => {
    res.status(200).send({ error: error.message });
  }
);

userRoute.post(
  "/upload-message-audio",
  uploadAudio.single("file"),
  async (req, res) => {
    let data = await req.file;
    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: data,
    });
  },
  (error, req, res, next) => {
    res.status(200).send({ error: error.message });
  }
);

let upload3 = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, "./public/upload");
    },

    filename: (req, file, callback) => {
      req.originalName = Date.now() + "-" + file.originalname;

      callback(null, req.originalName);
    },
  }),

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|pdf|jpeg)$/)) {
      return cb(new Error("Please Upload pdf Only"));
    }

    cb(null, true);
  },
});

userRoute.post("/sendBackPDF", verifyToken, async (req, res) => {
  file = req.body.file;
  const base64String = process.argv[2];

  const resolvedPath = path.resolve(
    __dirname,
    `../public/upload/${req.body.fileName}`
  );

  const decodedData = Buffer.from(file, "base64");

  fs.writeFileSync(resolvedPath, decodedData, (err) => {
    if (err) throw err;
  });
  let getUserData = await Chat.findById(req.body.chatId);
  let receiverId;
  await getUserData.users.forEach((el) => {
    if (el._id.toString() != req.user._id) {
      receiverId = el._id.toString();
    }
  });
  let userName = process.env.FAXUSERNAME;
  let password = process.env.PASSWORD;
  findUserData = await users.findOne({ _id: receiverId });
  if (
    findUserData.fax == null ||
    findUserData.fax == undefined ||
    findUserData.fax == ""
  ) {
    return res.json({
      status: "ERROR",
      messageID: 400,
      message: "Fax Number is not available",
    });
  }

  const url = resolvedPath;

  const parts = url.split("/public");
  const result = "/public" + parts[1];

  let sendFax = await sendFaxApiReturn(
    userName,
    password,
    "false",
    "test",
    "hello",
    "12346",
    findUserData.fax,
    findUserData.fax,

    resolvedPath,
    req.user.email
  );
  let freshResponse = {
    filePath: result,
    faxResult: sendFax.data,
  };
  if (freshResponse) {
    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: freshResponse,
    });
  } else {
    return res.json({
      status: "ERROR",
      messageID: 400,
      message: "failed",
    });
  }
});

userRoute.post(
  "/upload-fax-file",
  upload3.single("file"),
  verifyToken,
  async (req, res) => {
    let getUserData = await Chat.findById(req.body.chatId);
    let receiverId;
    await getUserData.users.forEach((el) => {
      if (el._id.toString() != req.user._id) {
        receiverId = el._id.toString();
      }
    });
    let userName = process.env.FAXUSERNAME;
    let password = process.env.PASSWORD;
    findUserData = await users.findOne({ _id: receiverId });
    if (
      findUserData.fax == null ||
      findUserData.fax == undefined ||
      findUserData.fax == ""
    ) {
      return res.json({
        status: "ERROR",
        messageID: 400,
        message: "Fax Number is not available",
      });
    }

    let data = await req.file;
    let sendFax = await sendFaxApi(
      userName,
      password,
      "false",
      "test",
      "hello",
      "12346",
      findUserData.fax,
      findUserData.fax,

      data,
      req.user.email
    );
    let freshResponse = {
      filePath: req.file.path,
      faxResult: sendFax.data,
    };
    if (freshResponse) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: freshResponse,
      });
    } else {
      return res.json({
        status: "ERROR",
        messageID: 400,
        message: "failed",
      });
    }
  },
  (error, req, res, next) => {
    // res.status(200).send({ error: error.message });
    return res.json({
      status: "ERROR",
      messageID: 400,
      message: "Upload appropriate format",
      error: error.message,
    });
  }
);

let upload2 = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, "./public/upload");
    },

    filename: (req, file, callback) => {
      req.originalName = Date.now() + "-" + file.originalname;

      callback(null, req.originalName);
    },
  }),

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|mp3|wav|mp4|mov|m4a|mpeg)$/)) {
      return cb(new Error("Please Upload Image Only"));
    }

    cb(null, true);
  },
});

userRoute.post("/checkFireBase", fireBaseToken);
userRoute.get("/global-search", verifyToken, globalSearch);
userRoute.get("/get-participant-details", participantInfo);

// westFax api implementation

userRoute.post("/security-authenticate", Security_Authenticate);
userRoute.post(
  "/security-authenticate-productid",
  Security_Authenticate_ProductID
);

userRoute.post("/account-info", Profile_GetAccountInfoAPI);
userRoute.post("/product-list", Profile_GetProductList);
userRoute.post("/profile-f2e-product-list", Profile_GetF2EProductList);
userRoute.post("/fax-email-product-details/", Profile_GetF2EProductDetail);
userRoute.post("/send-fax", upload2.single("Files0"), sendWestFax);
userRoute.post("/fax-identifiers", Fax_GetFaxIdentifiers);
userRoute.post("/fax-identifiers-description", Fax_GetFaxDescriptions);

/* CSV Reading */

// geo Location Save Api

// geo Location Save Api 

userRoute.post('/save-location', verifyToken, saveLiveLocation)



let upload6 = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, "./public/upload");
    },

    filename: (req, file, callback) => {
      req.originalName = Date.now() + "-" + file.originalname;


      callback(null, req.originalName);
    },
  }),

  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|mp3|wav|mp4|mov|m4a|mpeg|pdf)$/)) {
      return cb(new Error("Please Upload Image Only"));
    }

    cb(null, true);
  },
});


//Mail
userRoute.post("/send-email", upload6.single("file"),sendMail);
userRoute.get("/get-email",getEmail);
userRoute.get("/getDraftEmail",getDraftEmail);
userRoute.post("/get-mail",verifyToken, getInbox);

userRoute.post("/store-signature-data",addSignature);
userRoute.get("/get-signature-id/:Id",getSignatureById);
userRoute.delete("/delete-signature/:id",deleteSignature);
userRoute.get("/getEmailInfo/:id",getEmailInfo);

userRoute.post("/reply-email",upload6.single("file"),replyInboxmail);
userRoute.post("/forward-email",upload6.single("file"),forwardMail);

userRoute.post("/check-outlook",verifyToken,authenticateOutlook);
userRoute.get("/get-users-data",verifyToken ,getPhysicianDetail);
userRoute.post("/save-creds",verifyToken ,saveCredOutlook);

userRoute.post("/sendDraftMail", upload6.single("file"),sendDraftMail);

userRoute.post('/resendProfilelink', verifyToken, resendProfilelink)

module.exports = userRoute;
