const userModel = require("../../model/users");
const logsModel = require("../../model/loginLogs");
const sendSMS = require('../../middlewares/twilioMSG')
const moment = require("moment");
const mongoose = require("mongoose");
const responses = require("../../constant");
const sendEmail = require("../../middlewares/sendEmail");
const { uploadImage, unlinkFile } = require("../../middlewares/utils");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const config = require("../../config/config").get(
  process.env.NODE_ENV || "local"
);
const bcrypt = require("bcrypt");
const constant = require("../../constant");
const commonQuery = require("../../middlewares/commonQuery");
const { async } = require("regenerator-runtime");
const { SECRETKEY, APP, PORTS, TWILIONUMBER } = config;
const deeplink = require("node-deeplink");
const physicanImage = "public/users-image/doctor.png";
const nursingHomeImage = "public/users-image/nursing-room.png";
const nurseImage = "public/users-image/nurselogo.png";
const AssistedLiveImage = "public/users-image/assistedLiving.png";
const OtherUserImage = "public/users-image/otheruserImage.png";
const SubAdminUserImage = "public/users-image/subadminAccount.png";
const messageModel = require("../../model/messageModel");
var FCM = require("fcm-node");
const notification = require("../../model/notification");
const Message = require("../../model/messageModel");
var serverKey = process.env.SERVERKEY; //put your server key here
var fcm = new FCM(serverKey);
const emailTemplate = require("../../email/template");
const {
  signUpEmail,
  physicianAssigMail,
  physicianRemoveMail,createDynamicLinkSetupProfile,
  generateMessageSignup
} = require("../../middlewares/emailTemplate");

async function removePhysician(req, res) {
  try {
    let nursingHomeName = await userModel.findOne({ _id: req.user._id });
    let findNursingHome = await userModel.findOneAndUpdate(
      { _id: req.body._id },
      { $pull: { nursing_home_id: { _id: req.user._id } } },
      { new: true }
    );

    let physician = await userModel.findOne({ _id: req.body._id });

    if (findNursingHome) {
      let signUpEmailContent = await physicianRemoveMail(
        APP,
        PORTS,
        physician.name,
        nursingHomeName.name
      );

      let subject = "Nursing Home Removal Notification";
      let text = signUpEmailContent;
      let response = sendEmail(physician.email, subject, text);
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "De-Assigned Successfully",
        data: findNursingHome,
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "failed to de-assign",
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function assignPhysicianToNursingHome(req, res) {
  try {
    let nursingHomeName = await userModel.findOne({ _id: req.user._id });
    let physician = await userModel.findOne({ _id: req.body.physicianId });
    let data;
    physician.nursing_home_id.filter((ele) => {
      data = ele._id == nursingHomeName._id;
    });
    if (data) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Physician already assigned in this nursing home ",
        // data: findNursingHome,
      });
    } else {
      let findNursingHome = await userModel.findOneAndUpdate(
        { _id: req.body.physicianId },
        {
          $push: {
            nursing_home_id: { name: nursingHomeName.name, _id: req.user._id },
          },
        },
        { new: true }
      );

      if (findNursingHome) {
        let signUpEmailContent = await physicianAssigMail(APP, PORTS,physician.name,nursingHomeName.name);

        let subject = "Nursing Home Assigned Notification";

        let text = signUpEmailContent;
        let response = sendEmail(
          physician.email,
          subject,
          text,
          physician.name,
          nursingHomeName.name
        );

        return res.json({
          status: responses.SUCCESS,
          messageID: responses.SUCCESS_CODE,
          message: "Assigned Successfully",
          data: findNursingHome,
        });
      } else {
        res.json({
          status: responses.FAILURE,
          messageID: responses.ERROR_CODE,
          message: "failed to assign",
        });
      }
    }
    // return false
  } catch (err) {}
}

/* 
Nurse Login Logs  Api
*/
async function nurseLoginLogs(req, res) {
  try {
    let nurseLoginLogs = await logsModel.find({ user_id: req.query.user_id });

    let userData = await userModel.findOne({ _id: req.query.user_id });
    let newResponse = {
      userDatas: userData,
      logs: nurseLoginLogs,
    };
    if (nurseLoginLogs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Nurse Logs Fetched Successfully",
        data: newResponse,
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "No Record Found",
      });
    }
  } catch (e) {
    res.json({
      status: responses.FAILURE,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
Api to retreive the Profile of user
*/

async function getProfile(req, res) {
  try {
    let Id = req.user._id;

    let findUser = await userModel.findOne({ _id: Id });
    if (findUser) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Profile Fetched Successfully",
        data: findUser,
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED,
      });
    }
  } catch (error) {
    res.json({
      status: responses.FAILURE,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
Logout Api
*/
async function logout(req, res) {
  try {
    let id = req.user._id;

    logoutUser = await userModel.findOneAndUpdate(
      { _id: id },
      { $set: { token: null, pushNotificationToken: "" } },
      { new: true }
    );
    if (logoutUser) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Logged Out Successfully",
      });
    }
  } catch (error) {
    res.json({
      status: responses.FAILURE,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
      data: error,
    });
  }
}

/* Api to update the status */

async function updateStatus(req, res) {
  try {
    let id = req.body._id;
    let checkUser = await userModel.findOne({ _id: id });

    if (checkUser.password == "" || checkUser.password == null) {
      return res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Please setup the profile first",
      });
    }

    let updateStatus = await userModel.findOneAndUpdate(
      { _id: id },
      { $set: { status: req.body.status } },
      { new: true }
    );
    if (updateStatus) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.UPDATE_SUCCESS,
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED,
      });
    }
  } catch (error) {
    res.json({
      status: responses.FAILURE,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* Api to get the current user */

async function currentUser(req, res) {
  try {
    let user = await userModel.findOne({ _id: req.body._id });
    if (user) {
      res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Fetched",
        data: user,
      });
    }
  } catch (error) {}
}

/* 
Register Api - 
Defined Role - 
 1 - subadmin
 2 - others
 3 - physician
 4 - nursing_home
 5 - nurse
 6 - assisted_living

 These role will be registerd by using this API
*/

async function register(req, res) {
  try {
    let newLiveLocation;
    if (req.body.liveLocation == "undefined" || req.body.liveLocation == null) {
      newLiveLocation = "";
    }
    if (req.body.liveLocation) {
      newLiveLocation = JSON.parse(req.body.liveLocation);
    }
    let shiftName;

    if (
      req.body.shiftData == "" ||
      req.body.shiftData == null ||
      req.body.shiftData == "undefined"
    ) {
      shiftName = "";
    } else {
      shiftName = JSON.parse(req.body.shiftData);
    }

    let assistedLivingIDData;
    let nusingHomeData;
    if (req.user.role === "assissted_living_id") {
      assistedLivingIDData = req.user._id;
    }
    if (req.user.role === "nursing_home") {
      nusingHomeData = req.user._id;
      let getBothCount = await userModel.findOne({ _id: nusingHomeData });
      
        let findCount = await userModel
          .find({ "nursing_home_id._id": nusingHomeData, status:1})
          .count();
        if (findCount >= getBothCount.usersLimit) {
          return res.json({
            status: responses.SUCCESS,
            messageID: responses.ERROR_CODE,
            message: responses.EXCEEDMSG,
          });
        }
      
      
    }
    const {
     
      role,
      name,
      contact,
      nursing_company,
      location,
      description,
      geo_location,
      status,
      nursing_home_id,
      assissted_living_id,
      token,
      shift,
      agency_nurse,
      usersLimit
      
    } = req.body;

    let email = req.body.email.toLowerCase();
    let checkEmail = await userModel.findOne({
      email: email,
      status: { $ne: 2 },
    });

    if (checkEmail) {
      if (req.file !== undefined) {
        fs.unlink(req.file.path, (err) => {
          if (err) throw err;
        });
      }

      return res.json({
        status: "Error",
        messageID: responses.ERROR_CODE,
        message: responses.USER_ALREADY_EXIST,
        data: checkEmail,
      });
    }

    let imageData;
    let assistLiving = [];
    let assisteData = assissted_living_id;

    if (assisteData) {
      let data = JSON.parse(assisteData);
      if (data.length > 0) {
        data.map((el) => {
          assistLiving.push(el);
        });
      } else {
        if (data._id) assistLiving.push(data);
      }
    }

    let shiftData1 = [];
    let shiftItem = shift;
    if (shiftItem) {
      let data = JSON.parse(shiftItem);
      if (data.length > 0) {
        data.map((el) => {
          shiftData1.push(el);
        });
      }
    }

    let nursingHome = [];
    let nursingData = nursing_home_id;
    if (nursingData) {
      let data = JSON.parse(nursingData);

      if (data.length > 0) {
        data.map((el) => {
          nursingHome.push(el);
        });
      } else {
        if (data._id) nursingHome.push(data);
      }
    }

    if (req.file == undefined && req.body.role === "subadmin")
      imageData = SubAdminUserImage;
    if (req.file == undefined && req.body.role === "others")
      imageData = OtherUserImage;
    if (req.file == undefined && req.body.role === "physician")
      imageData = physicanImage;
    if (req.file == undefined && req.body.role === "nursing_home")
      imageData = nursingHomeImage;
    if (req.file == undefined && req.body.role === "nurse")
      imageData = nurseImage;
    if (req.file == undefined && req.body.role === "assisted_living")
      imageData = AssistedLiveImage;

    if (req.file !== undefined) imageData = req.file.path;
    if (
      req.body.role === "admin" ||
      req.body.role === "nursing_home" ||
      req.body.role === "assisted_living" ||
      req.body.role === "physician" ||
      req.body.role === "nurse" ||
      req.body.role === "subadmin" ||
      req.body.role === "others"
    ) {
      let userData = new userModel({
        _id: new mongoose.Types.ObjectId(),
        name: name,
        role: role,
        email: email,
        contact: contact,
        nursing_company: nursing_company,
        location: location,
        description: description,
        image: imageData,
        geo_location: geo_location,
        status: status,
        nursing_home_id: nursingHome ? nursingHome : nusingHomeData,
        assissted_living_id: assistLiving ? assistLiving : assistedLivingIDData,
        token: token,
        shift: shiftData1,
        creatorID: req.user._id,
        agency_nurse: agency_nurse,
        liveLocation: newLiveLocation,
        shiftData: shiftName,
        usersLimit:usersLimit
      });

      let logoImage = `${APP.APIHOST}:${PORTS.API_PORT}/public/upload/login.png`;

      let register = await userData.save();
      if (register) {
        let payload = {
          _id: register._id,

          role: register.role,

          name: register.name,

          image: register.image,

          email: register.email,
        };

        const token = jwt.sign(payload, SECRETKEY, { expiresIn: "40m" });
        register.token = token;
        await userModel.findByIdAndUpdate(
          register._id,
          { $set: { token: token } },
          { new: true }
        );

        let notifyData = new notification({
          createrId: req.user._id,
          userId: register._id,
        });

        let notification1 = await notifyData.save();

        if (APP.APIHOST === "http://54.190.192.105:9133") {
          APP.APIHOST = "https://mean.stagingsdei.com:445";
        }

        let data = await createDynamicLinkSetupProfile(token)
          let dynamicURLData;
          if(data && data.status){
            dynamicURLData = data.URL
}

        let signUpEmailContent = await signUpEmail(APP, PORTS, dynamicURLData);
      let signupMessage = await generateMessageSignup(dynamicURLData)

        if (token) {
          let subject = "Account Create Link";
          let text = signUpEmailContent;
          let response = sendEmail(register.email, subject, text);
          // let fromNumber = '+19523736114'
          // let toNumber = `+91${contact}`

         
          let toNumber = `+1${register?.contact}`
          let sendMessage = await sendSMS.sendSms(toNumber, signupMessage)

          .then((message) => {
            console.log(`Message sent to : ${message?.data?.to[0]?.phone_number}`);
           })
           .catch((error) => {
           console.error(`Error sending message: ${error.message}`);
           });

          if (response) {
            res.json({
              status: responses.SUCCESS,
              messageID: responses.SUCCESS_CODE,
              message: responses.ACCOUNT_CREATED,
              data: register,
            });
          } else {
          }
        }
      }
    } else {
      return res.json({
        status: responses.FAILURE,
        messageID: responses.SUCCESS_CODE,
        message: responses.ROLE_MESSAGE,
        data: register,
      });
    }
  } catch (err) {
    console.log(err)
    res.status(201).json({

      status: responses.FAILURE,
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.INTERNAL_ERROR,
      err: err,
    });
  }
}

/* 
Profile Update API - 

User Case - Setup Profile is also using this api to update the password

*/
async function profileUpdate(req, res) {
  try {
    // let newLiveLocation;
    let payload = {};
    let passwordData = req.body.password;
    let token = req.header("token");
    let bodyToken = req.body.token;
    var jwtSecretKey = SECRETKEY;
    const decoded = jwt.verify(token, jwtSecretKey);

    let getReceiverID = await userModel.findOne({ _id: decoded._id });
    // if (req.body.liveLocation == "" || req.body.liveLocation == "undefined") {
    //   newLiveLocation = getReceiverID.liveLocation;
    // } else {
    //   newLiveLocation = JSON.parse(req.body.liveLocation);
    // }

    let imageData;

    if (req.file !== undefined) {
      imageData = req.file.path;
    } else {
      imageData = req.body.image;
    }

    let id = decoded._id;

    if (req.body.name || req.body.name === "") payload.name = req.body.name;

    if (req.body.email || req.body.email === "") payload.email = req.body.email;
    if (req.body.fax || req.body.fax === "") payload.fax = req.body.fax;

    if (req.body.contact || req.body.contact === "")
      payload.contact = req.body.contact;

    if (req.body.description || req.body.description === "")
      payload.description = req.body.description;

    if (req.body.nursing_company || req.body.nursing_company === "")
      payload.nursing_company = req.body.nursing_company;

    if (req.body.geo_location || req.body.geo_location === "")
      payload.geo_location = req.body.geo_location;

    if (req.body.password || req.body.password === "") {
    }

    const salt1 = await bcrypt.genSalt(10);
    let newPassword1 = await bcrypt.hash(passwordData, salt1);

    passwordData;
    payload.image = imageData;

    let update_data = await userModel.findByIdAndUpdate(
      decoded._id,
      {
        $set: {
          payload,
          password: newPassword1,
          status: 1,
          // liveLocation: newLiveLocation,
        },
      },
      { new: true }
    );

    let notificationObj = {
      sender: decoded._id,
      receiver: getReceiverID.creatorID,
      message: `profile has been updated by ${getReceiverID.name}`,
      notificationType: "admin",
      additionalData: {
        type: "admin",
        typeId: getReceiverID.creatorID,
      },
    };

    let save = await notification.create(notificationObj);

    if (update_data) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.UPDATE_SUCCESS,
        data: update_data,
      });
    }
  } catch (error) {
    res.status(201).json({
      status: responses.FAILURE,
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.INTERNAL_ERROR,
      err: error,
    });
  }
}



async function setupProfileUpdate(req, res) {
  try {
    let payload = {};
    let passwordData = req.body.password;
    let bodyToken = req.body.token; // Taking token from the request body
    var jwtSecretKey = SECRETKEY;
    const decoded = jwt.verify(bodyToken, jwtSecretKey); // Using the token from the request body

    let getReceiverID = await userModel.findOne({ _id: decoded._id });

    let imageData;

    if (req.file !== undefined) {
      imageData = req.file.path;
    } else {
      imageData = req.body.image;
    }

    let id = decoded._id;

    if (req.body.name || req.body.name === "") payload.name = req.body.name;

    if (req.body.email || req.body.email === "") payload.email = req.body.email;
    if (req.body.fax || req.body.fax === "") payload.fax = req.body.fax;

    if (req.body.contact || req.body.contact === "")
      payload.contact = req.body.contact;

    if (req.body.description || req.body.description === "")
      payload.description = req.body.description;

    if (req.body.nursing_company || req.body.nursing_company === "")
      payload.nursing_company = req.body.nursing_company;

    if (req.body.geo_location || req.body.geo_location === "")
      payload.geo_location = req.body.geo_location;

    if (req.body.password || req.body.password === "") {
      const salt1 = await bcrypt.genSalt(10);
      let newPassword1 = await bcrypt.hash(passwordData, salt1);
      payload.password = newPassword1; // Adding the hashed password to the payload
    }

    payload.image = imageData;

    let update_data = await userModel.findByIdAndUpdate(
      decoded._id,
      {
        $set: {
          ...payload, // Spreading the payload properties
          status: 1,
        },
      },
      { new: true }
    );

    let notificationObj = {
      sender: decoded._id,
      receiver: getReceiverID.creatorID,
      message: `profile has been updated by ${getReceiverID.name}`,
      notificationType: "admin",
      additionalData: {
        type: "admin",
        typeId: getReceiverID.creatorID,
      },
    };

    let save = await notification.create(notificationObj);

    if (update_data) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.UPDATE_SUCCESS,
        data: update_data,
      });
    }
  } catch (error) {
    res.status(201).json({
      status: responses.FAILURE,
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.INTERNAL_ERROR,
      err: error,
    });
  }
}




/* 
This API is used to get all Users - Admin
*/
async function getAllUsers(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 10,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else query = { status: { $ne: 2 } };
    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [{ name: { $regex: filter, $options: "i" } }],
        },
      },
    ];

    userModel.aggregatePaginate(myAggregate, options, function (err, results) {
      if (err) {
      } else {
        return res.jsonp({
          status: responses.SUCCESS,
          messageID: constant.SUCCESS_CODE,
          message: responses.USER_FECHED_MSG,
          data: results,
        });
      }
    });
  } catch (e) {
    return res.jsonp({
      status: responses.FAILURE,
      messageID: constant.INTERNAL_ERROR,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
Function is used the get the user by using the ID
*/

async function getUser(req, res) {
  try {
    let id = req.params._id;

    let userData = await userModel.findOne({ _id: id });
    if (userData) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.USER_FECHED_MSG,
        data: userData,
      });
    } else {
      res.status(201).json({
        status: responses.FAILURE,
        messageID: responses.INTERNAL_ERROR_CODE,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (error) {
    res.status(201).json({
      status: responses.FAILURE,
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.NO_RECORDS_FOUND,
      error: error,
    });
  }
}

/* 
function is used to delete the user by using the ID

*/

async function deleteUserById(req, res) {
  try {
    userModel.findOneAndUpdate(
      { _id: req.body._id },
      { $set: { status: 2 } },
      { new: true },
      (err, data) => {
        if (!err) {
          return res.json({
            status: responses.SUCCESS,
            messageID: responses.SUCCESS_CODE,
            message: responses.DELETE_SUCCESS,
            // data: data,
          });
        } else {
          res.status(201).json({
            status: responses.FAILURE,
            messageID: responses.INTERNAL_ERROR_CODE,
            message: responses.NO_RECORDS_FOUND,
          });
        }
      }
    );
  } catch (error) {
    res.status(201).json({
      status: responses.FAILURE,
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.NO_RECORDS_FOUND,
      error: error,
    });
  }
}

/* 

function is used to authenticate the user
*/

async function authenticateUser(req, res) {
  try {
    let id = req.user._id;

    let userData = await userModel.findOne({ _id: id });

    if (userData) {
      res.status(200).json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.ACCESS,
        data: userData,
      });
    } else {
      return res.status(201).json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.ROLE_MSG,
      });
    }
  } catch (err) {
    res.status(201).json({
      status: responses.FAILURE,
      messageID: 201,
      message: responses.NO_RECORDS_FOUND,
      error: error,
    });
  }
}

/* 
 function is used to get all nursing homes for admin

*/

async function allNursingHomes(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 10,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else
      query = {
        $and: [{ status: { $ne: 2 } }, { role: { $eq: "nursing_home" } }],
      };

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [{ name: { $regex: filter, $options: "i" } }],
        },
      },
    ];

    let nursingHomeData = await userModel.aggregatePaginate(
      myAggregate,
      options
    );
    if (nursingHomeData.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.NURSINGHOME_FETCHED,
        data: nursingHomeData,
      });
    } else {
      res.status(201).json({
        status: responses.FAILURE,
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: responses.FAILURE,
      messageID: constant.INTERNAL_ERROR,
      message: responses.DATA_FAILED,
    });
  }
}

/* 

function is used to get all assisted livings 
*/

async function getAllAssisstedLiving(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 10,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else
      query = {
        $and: [{ status: { $ne: 2 } }, { role: { $eq: "assisted_living" } }],
      };

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [{ name: { $regex: filter, $options: "i" } }],
        },
      },
    ];

    let assistedLivingData = await userModel.aggregatePaginate(
      myAggregate,
      options
    );
    if (assistedLivingData.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.PHYSICIANS_FETCHED,
        data: assistedLivingData,
      });
    } else {
      res.status(201).json({
        status: responses.FAILURE,
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: responses.FAILURE,
      messageID: constant.INTERNAL_ERROR,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
function is used to update the geo location

*/

function geoLocationUpdate(req, res) {
  async function geoLocationUpdate() {
    try {
      if (req.body._id) {
        let condition = {
          _id: req.body._id,
        };
        let dataToUpdate = {
          geo_location: req.body.geo_location,
        };

        let geoLocationUpdate = await commonQuery.updateOne(
          userModel,
          condition,
          dataToUpdate
        );

        if (geoLocationUpdate) {
          return res.jsonp({
            status: responses.SUCCESS,
            messageID: constant.SUCCESS_CODE,
            message: responses.GEO_LOCATION_UPDATED,
          });
        } else {
          res.status(201).json({
            status: responses.FAILURE,
            messageID: 201,
            message: responses.INTERNAL_ERROR,
          });
        }
      }
    } catch (error) {}
  }
  geoLocationUpdate().then(function () {});
}

/* 

function is used to get all subadmins
*/

async function getAllSubadmin(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 10,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else
      query = {
        $and: [{ status: { $ne: 2 } }, { role: { $eq: "subadmin" } }],
      };

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [{ name: { $regex: filter, $options: "i" } }],
        },
      },
    ];

    let subadminData = await userModel.aggregatePaginate(myAggregate, options);
    if (subadminData.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.SUBADMIT_FETCHED,
        data: subadminData,
      });
    } else {
      res.status(200).json({
        status: responses.FAILURE,
        messageID: 500,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: responses.FAILURE,
      messageID: constant.INTERNAL_ERROR,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
function is used to get physicians and nursed for nursing homes

*/

async function physicianAndNursesForNursingHome(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 10,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else {
      if (req.body.nursing_home_id) {
        query = {
          $and: [
            { status: { $ne: 2 } },

            {
              role: { $in: ["nurse", "physician"] },
              nursing_home_id: req.body.nursing_home_id,
            },
          ],
        };
      }
    }

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [{ name: { $regex: filter, $options: "i" } }],
        },
      },
    ];

    let physicianAndNurseData = await userModel.aggregatePaginate(
      myAggregate,
      options
    );
    if (physicianAndNurseData.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_NURSE_PHYSICIAN,
        data: physicianAndNurseData,
      });
    } else {
      res.status(200).json({
        status: responses.FAILURE,
        messageID: 500,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (error) {
    res.status(200).json({
      status: responses.FAILURE,
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.INTERNAL_ERROR,
    });
  }
}

/* 
function is used to get all physicians and nurses for Assisted Livings

*/

async function physicianAndNursesForAssistedLiving(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 10,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else {
      if (req.body.assissted_living_id) {
        query = {
          $and: [
            { status: { $ne: 2 } },

            {
              role: req.body.role,
              assissted_living_id: req.body.assissted_living_id,
            },
          ],
        };
      }
    }

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [{ name: { $regex: filter, $options: "i" } }],
        },
      },
    ];

    let physicianAndNurseData = await userModel.aggregatePaginate(
      myAggregate,
      options
    );
    if (physicianAndNurseData.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_NURSE_PHYSICIAN,
        data: physicianAndNurseData,
      });
    } else {
      res.status(200).json({
        status: responses.FAILURE,
        messageID: 500,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (error) {}
}

/* 
function is used to get the all physcians and nurses
*/

async function allPhysciansAndNurses(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 10,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };

    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else {
      query = {
        $and: [
          { status: { $ne: 2 } },

          {
            role: req.body.role,
          },
        ],
      };
    }

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [{ name: { $regex: filter, $options: "i" } }],
        },
      },
    ];

    let physicianAndNurseData = await userModel.aggregatePaginate(
      myAggregate,
      options
    );
    if (physicianAndNurseData.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_NURSE_PHYSICIAN,
        data: physicianAndNurseData,
      });
    } else {
      res.status(200).json({
        status: responses.FAILURE,
        messageID: 200,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (error) {}
}

/* 
function is used to get the count for all roles
*/

async function count(req, res) {
  try {
    let data = await userModel
      .find({
        $and: [
          { status: { $ne: 2 } },

          { $in: ["nurse", "physician", "nursing_home", "assisted_living"] },
        ],
      })
      .exec();

    let nurses = [];
    let physicians = [];
    let nursing_home = [];
    let assistedLiving = [];
    if (data) {
      data.map((x) => {
        if (x.role === "nurse") {
          nurses.push(x);
        }
        if (x.role === "physician") {
          physicians.push(x);
        }
        if (x.role === "nursing_home") {
          nursing_home.push(x);
        }
        if (x.role === "assisted_living") {
          assistedLiving.push(x);
        }
      });
    }
    let fullArray = [];
    fullArray.push({
      nurseLength: nurses.length,
      physiciansLength: physicians.length,
      nursing_homeLength: nursing_home.length,
      assistedLivingLength: assistedLiving.length,
    });

    if (fullArray) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.COUNT_NOT_FETCHED,
        data: fullArray,
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.SUCCESS_CODE,
        message: responses.COUNT_FETCHED,
        data: fullArray,
      });
    }
  } catch (error) {}
}

/* 
function is used to get the all subadmins

*/

async function allSubadmin(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 1000000,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    } else
      query = {
        $and: [{ status: { $ne: 2 } }, { role: { $eq: "subadmin" } }],
      };

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      //   { $lookup: {
      //     from: "users",
      //     localField: "assissted_living_id",
      //     foreignField: "_id",
      //     as: "assissted_living_data"
      //  }},
      {
        $match: {
          $or: [
            { name: { $regex: filter, $options: "i" } },
            // { email: { $regex: filter, $options: "i" } },
          ],
        },
      },
    ];

    let subadmin = await userModel.aggregatePaginate(myAggregate, options);
    if (subadmin.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.SUBADMIT_FETCHED,
        data: subadmin,
      });
    } else {
      res.status(201).json({
        status: responses.FAILURE,
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: responses.FAILURE,
      messageID: constant.INTERNAL_ERROR,
      message: responses.DATA_FAILED,
    });
  }
}

/* 

Funtion is used to update the subadmin information
*/

async function updateSubadmin(req, res) {
  try {
    let checkEmail = await userModel.findOne({
      email: req.body.email.toLowerCase(),
      _id: { $ne: req.body._id },
    });
    if (checkEmail) {
      res.json({
        status: responses.ERROR_CODE,
        messageID: responses.ALLREADY_EXIST,
        message: responses.EMAIL_EXIST_ALREADY,
      });
    } else {
      let payload = {};

      let imageData;

      if (req.file !== undefined) {
        imageData = req.file.path;
      } else {
        imageData = req.body.image;
      }

      let id = req.body._id;
      // let userId = req.user._id

      if (req.body.name || req.body.name === "") payload.name = req.body.name;

      if (req.body.email || req.body.email === "")
        // payload.email = req.body.email;

        payload.email =  req.body.email.toLowerCase();

      if (req.body.contact || req.body.contact === "")
        payload.contact = req.body.contact;

      if (req.body.location || req.body.location === "")
        payload.location = req.body.location;

      payload.image = imageData;
      userModel.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true },
        function (err, result) {
          if (result) {
            return res.json({
              status: responses.SUCCESS,
              messageID: responses.SUCCESS_CODE,
              message: responses.UPDATE_SUCCESS,
              data: result,
            });
          } else {
            res.status(201).json({
              status: responses.FAILURE,
              messageID: responses.INTERNAL_ERROR_CODE,
              message: responses.INTERNAL_ERROR,
              err: err,
            });
          }
        }
      );
    }
  } catch (error) {
    res.status(201).json({
      status: responses.FAILURE,
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.INTERNAL_ERROR,
      err: err,
    });
  }
}

/* 

Funtion is used to verify the token information
*/

async function verifyTokenData(req, res) {
  try {
    let token = req.body.token;
    var jwtSecretKey = SECRETKEY;
    const decode = jwt.verify(token, jwtSecretKey);
    let user = await userModel.findById(decode._id);
    console.log(user, "useruseruseruseruser")

    if (!user.password) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.ALLREADY_EXIST,
        message: responses.SETUP_PROFILE_MESSAGE,
      });
    } else if (token == user.token) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.TOKEN_VALID_MSG,
      });
    } else {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.ERROR_CODE,
        message: responses.TOKEN_INVALID_MSG,
      });
    }
  } catch (error) {
    res.status(201).json({
      status: responses.FAILURE,
      messageID: responses.TOKEN_CODE,
      message: responses.TOKEN_INVALID_MSG,
    });
  }
}

/* 

Funtion is used to get the user profile information
*/

async function getUserProfile(req, res) {
  try {
    let token = req.body.token;
    
    var jwtSecretKey = SECRETKEY;
    const decode = jwt.verify(token, jwtSecretKey);
    let data = await userModel.findOne({ _id: decode._id });
    console.log(data, "data")
    if (data) {
      let userData = {
        name: data.name,
        email: data.email,
        location: data.location,
        contact: data.contact,
        image: data.image,
      };
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.PROFILE_FETCHED,
        data: userData,
      });
    } else {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.ERROR_CODE,
        message: responses.PROFILE_FETCH_ERROR,
      });
    }
  } catch (err) {
    res.json({
      status: responses.SUCCESS,
      messageID: responses.ERROR_CODE,
      message: responses.PROFILE_FETCH_ERROR,
    });
  }
}

/* 

Funtion is used to get the status
*/

async function getStatus(req, res) {
  try {
    let status = req.body.status;
    if (status) {
      let statusData = await userModel.find({ status: { $eq: status } });

      res.status(200).json({ message: "Fetched", data: statusData });
    } else {
      let statusData1 = await userModel.find({ status: { $ne: 2 } });
      res.status(200).json({ message: "Fetched", data: statusData1 });
    }
  } catch (error) {}
}

/* 

Funtion is used to update the account
*/

async function accountUpdate(req, res) {
  try {
    let data = req.user;

    let imageData;

    if (req.file !== undefined) {
      imageData = req.file.path;
    } else {
      imageData = req.body.image;
    }

    let updateData = await userModel.findByIdAndUpdate(
      data._id,
      {
        $set: {
          name: req.body.name,
          image: imageData,
          location: req.body.location,
          contact: req.body.contact,
          fax: req.body.fax,
          outlook_email:req.body.outlook_email,
          outlook_password:req.body.outlook_password

        },
      },
      { new: true }
    );
    const payload = {
      _id: updateData._id,
      role: updateData.role,
      name: updateData.name,
      image: updateData.image,
      email: updateData.email,
    };
    const token = jwt.sign(payload, SECRETKEY, {
      expiresIn: "45m",
    });
    let data1 = await userModel.findOneAndUpdate(
      { _id: updateData._id },
      { $set: { token: token } },
      { new: true }
    );

    if (updateData) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.UPDATE_SUCCESS,
        data: data1,
      });
    }
  } catch (err) {
    res.json({
      status: responses.SUCCESS,
      messageID: responses.ALLREADY_EXIST,
      message: responses.INTERNAL_ERROR,
      data: data1,
    });
  }
}

/* 

Funtion is used to generate the firebase token
*/

async function dashboardPhysicianNurses(req, res) {
  try {
    const { id, nursing_home_id, assissted_living_id } = req.query;
    let query;
    let limit = 1000000,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: -1, //Sort by Date Added DESC
      },
    };
    let myAggregate = userModel.aggregate();
    if (id) {
      query = { _id: id };
    }

    if (nursing_home_id) {
      query = {
        $and: [
          {
            nursing_home_id: { $elemMatch: { _id: nursing_home_id } },
            status: { $ne: 2 },
          },
          { role: { $in: ["physician", "nurse", "assisted_living"] } },
          // { role: { $eq: "nurse",  } },
        ],
      };
    }
    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $match: {
          $or: [
            { name: { $regex: filter, $options: "i" } },
            // { email: { $regex: filter, $options: "i" } },
          ],
        },
      },
    ];

    let physicianData = await userModel.aggregatePaginate(myAggregate, options);
    if (physicianData.docs.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: physicianData,
      });
    } else {
      res.status(201).json({
        status: responses.FAILURE,
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: responses.FAILURE,
      messageID: constant.INTERNAL_ERROR,
      message: responses.DATA_FAILED,
    });
  }
}

/* 

Funtion is used to generate the firebase token
*/

async function fireBaseToken(req, res) {
  var message = {
    //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: req.body.pushNotificationToken,
    collapse_key: "your_collapse_key",

    notification: {
      title: "Hello Pradeep",
      body: "this is the notiofication",
    },

    data: {
      //you can send only notification or only data(or include both)
      my_key: "my value",
      my_another_key: "my another value",
    },
  };

  fcm.send(message, function (err, response) {
    if (err) {
      res.send("error");
    } else {
      res.status(200).json({ message: "Sent", message: message.notification });
    }
  });
}

/* 

Funtion is to display dashboard count
*/

async function dashboardCount(req, res) {
  let WeeklyChatData = await weeklyData();
  let dailyMessage = await dailygraphData();
  let monthlyChat = await monthlyGraphData();

  let responseChat = {
    dailyCount: dailyMessage,
    WeeklyCount: WeeklyChatData,
    MonthlyCount: monthlyChat,
  };
  return res.jsonp({
    status: responses.SUCCESS,
    messageID: responses.SUCCESS_CODE,
    message: responses.FETCH_SUCCESS,
    data: {
      ChatCount: responseChat,
    },
  });
}

/* 

Funtion is to display graph count
*/

async function graphCount(req, res) {
  let nursingHomeId = req.user._id;

  let weeklyCount = await nursingHomegraphWeekly(nursingHomeId);
  let monthlyCount = await nursingHomegraphMonthly(nursingHomeId);
  let dailyCount = await nursingHomegraphDaily(nursingHomeId);

  // let getData = await nursingHomegraphMonthly2(nursingHomeId)

  let responseChat = {
    dailyCount: dailyCount,
    WeeklyCount: weeklyCount,
    MonthlyCount: monthlyCount,
  };
  return res.jsonp({
    status: responses.SUCCESS,
    messageID: responses.SUCCESS_CODE,
    message: responses.FETCH_SUCCESS,
    data: {
      Counts: responseChat,
    },
  });
}

/* 

Funtion is to display daily graph for admin
*/

async function weeklyData(messageType) {
  let DateFormat = "MM/DD/YYYY";

  let curr = new Date();
  let week = [];
  let day;
  for (let i = 1; i <= 7; i++) {
    let first = curr.getDate() - curr.getDay() + i;
    day = moment(new Date(curr.setDate(first))).format(DateFormat);
    let getMessageWeekly = await messageModel
      .find({ messageType: "chat", messageDate: { $lte: day, $gte: day } })
      .count();

    let getFaxWeekly = await messageModel
      .find({ messageType: "fax", messageDate: { $lte: day, $gte: day } })
      .count();
    week.push({
      day: day,
      chatCount: getMessageWeekly,
      faxCount: getFaxWeekly,
    });
  }
  return week;
}

/* 

Funtion is to display daily graph for admin
*/

async function dailygraphData(messageType) {
  let DateFormat = "MM/DD/YYYY";
  let current = new Date();
  let newDate = current.getDate();
  daySTart = moment(new Date(current.setDate(newDate))).format(DateFormat);

  let queryDailyChat = {
    messageType: "chat",
    messageDate: { $gte: daySTart, $lte: daySTart },
  };

  let queryDailyFax = {
    messageType: "fax",
    messageDate: { $gte: daySTart, $lte: daySTart },
  };

  let getMessageDaily = await messageModel.find(queryDailyChat).count();
  let getFaxDaily = await messageModel.find(queryDailyFax).count();

  let data = {
    chatCount: getMessageDaily,
    faxCount: getFaxDaily,
  };

  return data;
}

/* 

Funtion is to display monthly graph for admin
*/

async function monthlyGraphData(messageType) {
  let monthArray = [];

  let DateFormat = "MM/DD/YYYY";

  let createdDate = new Date();
  createdDate.setFullYear(createdDate.getFullYear() - 1);
  createdDate.setDate(1);
  let dateAndYearList = [];
  for (let i = 0; i <= 11; i++) {
    let getMonthName = {
      startDate1: new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        1
      ),
    };

    let onj = {
      startDate: moment(
        new Date(createdDate.getFullYear(), createdDate.getMonth(), 1)
      ).format(DateFormat),
      lastDate: moment(
        new Date(createdDate.getFullYear(), createdDate.getMonth() + 1, 0)
      ).format(DateFormat),
    };
    const month = getMonthName.startDate1.toLocaleString("default", {
      month: "short",
    });

    let queryMonthlyChat = {
      messageType: "chat",
      messageDate: {
        $gte: onj.startDate,
        $lte: onj.lastDate,
      },
    };

    let queryMonthlyFax = {
      messageType: "fax",
      messageDate: {
        $gte: onj.startDate,
        $lte: onj.lastDate,
      },
    };
    let getMessageMonthly = await messageModel.find(queryMonthlyChat).count();
    let getFaxMonthly = await messageModel.find(queryMonthlyFax).count();

    let data = {
      MonthName: month,
      chatCount: getMessageMonthly,
      faxCount: getFaxMonthly,
    };
    dateAndYearList.push(data);
    createdDate.setMonth(createdDate.getMonth() + 1);
  }

  return dateAndYearList;
}

/* 

Funtion is to display weekly graph for nursing home
*/

async function nursingHomegraphWeekly(nursingHomeId) {
  try {
    let weekData = [];
    let DateFormat = "MM/DD/YYYY";

    let curr = new Date();
    let week = [];
    let day;
    for (let i = 1; i <= 7; i++) {
      let first = curr.getDate() - curr.getDay() + i;
      day = moment(new Date(curr.setDate(first))).format(DateFormat);
      let getMessageWeekly = await Message.aggregate([
        {
          $match: {
            messageDate: {
              $gte: day,
              $lte: day,
            },
            messageType: "chat",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chat",
            foreignField: "_id",
            as: "chat",
          },
        },
        {
          $match: {
            "chat.identificationID": nursingHomeId,
          },
        },
        {
          $project: {
            messageDate: 1,
            messageType: 1,
          },
        },
        { $group: { _id: "$messageDate", count: { $sum: 1 } } },
      ]);

      let getFaxWeekly = await Message.aggregate([
        {
          $match: {
            messageDate: {
              $gte: day,
              $lte: day,
            },
            messageType: "fax",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chat",
            foreignField: "_id",
            as: "chat",
          },
        },
        {
          $match: {
            "chat.identificationID": nursingHomeId,
          },
        },
        {
          $project: {
            messageDate: 1,
            messageType: 1,
          },
        },
        { $group: { _id: "$messageDate", count: { $sum: 1 } } },
      ]);

      week.push({
        day: day,
        chatCount: getMessageWeekly,
        faxCount: getFaxWeekly,
      });
    }

    return week;
  } catch (error) {
    throw error;
  }
}

/* 

Funtion is to display Monthly graph for nursing home
*/

async function nursingHomegraphMonthly2(nursingHomeId) {
  try {
    let getWeeklyChat = await Message.aggregate([
      {
        $match: {
          messageDate: {
            $gte: moment(new Date()).subtract(1, "month").format("MM/DD/YYYY"),
          },
          messageType: "chat",
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $match: {
          "chat.identificationID": nursingHomeId,
        },
      },
      {
        $project: {
          createdAt: 1,
          messageType: 1,
        },
      },

      {
        $project: {
          formattedDate: {
            $dateToString: { format: "%m", date: "$createdAt" },
          },
        },
      },
      {
        $addFields: {
          month: {
            $let: {
              vars: {
                monthsInString: [
                  ,
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: {
                $arrayElemAt: [
                  "$$monthsInString",
                  { $toInt: "$formattedDate" },
                ],
              },
            },
          },
        },
      },

      { $group: { _id: "$month", count: { $sum: 1 } } },
    ]);

    let getWeeklyFax = await Message.aggregate([
      {
        $match: {
          messageDate: {
            $gte: moment(new Date()).subtract(1, "month").format("MM/DD/YYYY"),
          },
          messageType: "chat",
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $match: {
          "chat.identificationID": nursingHomeId,
        },
      },
      {
        $project: {
          createdAt: 1,
          messageType: 1,
        },
      },

      {
        $project: {
          formattedDate: {
            $dateToString: { format: "%m", date: "$createdAt" },
          },
        },
      },
      {
        $addFields: {
          month: {
            $let: {
              vars: {
                monthsInString: [
                  ,
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: {
                $arrayElemAt: [
                  "$$monthsInString",
                  { $toInt: "$formattedDate" },
                ],
              },
            },
          },
        },
      },

      { $group: { _id: "$month", count: { $sum: 1 } } },
    ]);
    let response = {
      chat: getWeeklyChat,
      fax: getWeeklyFax,
    };

    return response;
  } catch (error) {
    throw error;
  }
}

/* 

Funtion is to display Monthly graph for nursing home
*/

async function nursingHomegraphMonthly(nursingHomeId) {
  try {
    let monthArray = [];

    let DateFormat = "MM/DD/YYYY";

    let createdDate = new Date();
    createdDate.setFullYear(createdDate.getFullYear() - 1);
    createdDate.setDate(1);
    let dateAndYearList = [];
    for (let i = 0; i <= 11; i++) {
      let getMonthName = {
        startDate1: new Date(
          createdDate.getFullYear(),
          createdDate.getMonth(),
          1
        ),
      };

      let onj = {
        startDate: moment(
          new Date(createdDate.getFullYear(), createdDate.getMonth(), 1)
        ).format(DateFormat),
        lastDate: moment(
          new Date(createdDate.getFullYear(), createdDate.getMonth() + 1, 0)
        ).format(DateFormat),
      };
      const month = getMonthName.startDate1.toLocaleString("default", {
        month: "short",
      });

      let getMessageMonthly = await Message.aggregate([
        {
          $match: {
            messageDate: {
              $gte: onj.startDate,
              $lte: onj.lastDate,
            },
            messageType: "chat",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chat",
            foreignField: "_id",
            as: "chat",
          },
        },
        {
          $match: {
            "chat.identificationID": nursingHomeId,
          },
        },
        {
          $project: {
            createdAt: 1,
            messageType: 1,
          },
        },

        {
          $project: {
            formattedDate: {
              $dateToString: { format: "%m", date: "$createdAt" },
            },
          },
        },
        // {
        //   $addFields: {
        //     month: {
        //       $let: {
        //         vars: {
        //           monthsInString: [
        //             ,
        //             "Jan",
        //             "Feb",
        //             "Mar",
        //             "Apr",
        //             "May",
        //             "Jun",
        //             "Jul",
        //             "Aug",
        //             "Sep",
        //             "Oct",
        //             "Nov",
        //             "Dec",
        //           ],
        //         },
        //         in: {
        //           $arrayElemAt: [
        //             "$$monthsInString",
        //             { $toInt: "$formattedDate" },
        //           ],
        //         },
        //       },
        //     },
        //   },
        // },

        { $group: { _id: "$formattedDate", count: { $sum: 1 } } },
      ]);
      let getFaxMonthly = await Message.aggregate([
        {
          $match: {
            messageDate: {
              $gte: onj.startDate,
              $lte: onj.lastDate,
            },
            messageType: "fax",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chat",
            foreignField: "_id",
            as: "chat",
          },
        },
        {
          $match: {
            "chat.identificationID": nursingHomeId,
          },
        },
        {
          $project: {
            createdAt: 1,
            messageType: 1,
          },
        },

        {
          $project: {
            formattedDate: {
              $dateToString: { format: "%m", date: "$createdAt" },
            },
          },
        },
        // {
        //   $addFields: {
        //     month: {
        //       $let: {
        //         vars: {
        //           monthsInString: [
        //             ,
        //             "Jan",
        //             "Feb",
        //             "Mar",
        //             "Apr",
        //             "May",
        //             "Jun",
        //             "Jul",
        //             "Aug",
        //             "Sep",
        //             "Oct",
        //             "Nov",
        //             "Dec",
        //           ],
        //         },
        //         in: {
        //           $arrayElemAt: [
        //             "$$monthsInString",
        //             { $toInt: "$formattedDate" },
        //           ],
        //         },
        //       },
        //     },
        //   },
        // },

        { $group: { _id: "$formattedDate", count: { $sum: 1 } } },
      ]);

      let data = {
        MonthName: month,
        chatCount: getMessageMonthly,
        faxCount: getFaxMonthly,
      };
      dateAndYearList.push(data);
      createdDate.setMonth(createdDate.getMonth() + 1);
    }

    return dateAndYearList;
  } catch (err) {
    throw err;
  }
}

/* 

Funtion is to display daily graph for nursing home
*/

async function nursingHomegraphDaily(nursingHomeId) {
  try {
    let DateFormat = "MM/DD/YYYY";
    let current = new Date();
    let newDate = current.getDate();
    daySTart = moment(new Date(current.setDate(newDate))).format(DateFormat);
    let weekData = [];
    let getDailyChat = await Message.aggregate([
      {
        $match: {
          messageDate: { $gte: daySTart, $lte: daySTart },
          messageType: "chat",
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $match: {
          "chat.identificationID": nursingHomeId,
        },
      },
      {
        $project: {
          messageDate: 1,
          messageType: 1,
        },
      },
      { $group: { _id: "$messageDate", count: { $sum: 1 } } },
    ]);

    let getDailyFax = await Message.aggregate([
      {
        $match: {
          messageDate: { $gte: daySTart, $lte: daySTart },
          messageType: "fax",
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $match: {
          "chat.identificationID": nursingHomeId,
        },
      },
      {
        $project: {
          messageDate: 1,
          messageType: 1,
        },
      },
      { $group: { _id: "$messageDate", count: { $sum: 1 } } },
    ]);

    let data = {
      chatCount: getDailyChat,
      faxCount: getDailyFax,
    };
    return data;
  } catch (error) {
    throw error;
  }
}

/* 
function to retreive the distance from fence to user in KM
*/

function distance(lat1, lat2, lon1, lon2) {
  lon1 = (lon1 * Math.PI) / 180;
  lon2 = (lon2 * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
  let c = 2 * Math.asin(Math.sqrt(a));
  let r = 6371;
  return c * r;
}

/* 
Function to find the staff availibility - 

User is inside the fence or not 
*/
async function staffAvailibility(req, res) {
  try {
    let UserLat;
    let UserLang;
    let userId = req.user._id;
    let mobileLat;
    let mobileLang;
    let data = {
      _id: userId,
    };
    // let { mobileLat, mobileLang } = req.body;
    let userInfo = await commonQuery.findOne(userModel, data);
    let condition1 = {
      _id: userInfo.nursing_home_id[0]._id,
    };

    let nursingHomeLocation = await commonQuery.findOne(userModel, condition1);

    if (nursingHomeLocation.liveLocation) {
      UserLang = nursingHomeLocation.liveLocation.lang;
      UserLat = nursingHomeLocation.liveLocation.lat;
    }
    mobileLat = userInfo.liveLocation.lat;
    mobileLang = userInfo.liveLocation.lang;
    let getFinal_distance = distance(mobileLat, UserLat, mobileLang, UserLang);

    if (getFinal_distance > userInfo.radius) {
      let condition = {
        _id: req.user._id,
      };
      dataToUpdate = {
        validateLocation: false,
      };

      let updateLocation = await commonQuery.updateOne(
        userModel,
        condition,
        dataToUpdate
      );
      if (updateLocation) {
        return res.json({
          status: "Failed",
          messageID: 401,
          message: "You are out Of location",
          data: updateLocation,
        });
      }
    }
    let condition = {
      _id: req.user._id,
    };

    dataToUpdate = {
      validateLocation: true,
    };
    let updateLocation = await commonQuery.updateOne(
      userModel,
      condition,
      dataToUpdate
    );
    return res.json({
      status: "Success",
      messageID: 200,
      message: "You are inside the location",
      data: updateLocation,
    });
  } catch (err) {
    throw err;
  }
}

async function nursingLatLong(req, res) {
  try {
    let address;
    let email = req.body.email.toLowerCase();

    checkEmailData = await userModel;

    let currentLat = req.body.lat;
    let currentLang = req.body.lang;
    if (req.body.nurseID) {
      address = await userModel.findOne({ _id: req.body.nurseID });
    }
    if (email) {
      addressdata1 = await userModel.findOne({ email: email });
      address = addressdata1;
      if (!address) {
        return res.json({
          status: "Success",
          messageID: 200,
          message: "User Not available",
          // data: `total distance from nursing home to nurse location is ${exactMeeter} Meeters`,
        });
      }
    }

    let nursingHomeId;
    address.nursing_home_id.forEach((el) => {
      nursingHomeId = el._id;
    });
    if (address.role === "nurse") {
      let addressData = await userModel.findOne({ _id: nursingHomeId });
      let latNursingHome = addressData.liveLocation.lat;
      let langNursingHome = addressData.liveLocation.lang;

      let distance = await calcCrow(
        latNursingHome,
        langNursingHome,
        currentLat,
        currentLang
      );
      var meeters = distance * 1000;
      let exactMeeter = meeters.toFixed();

      if (exactMeeter < 500) {
        if (req.body.email.toLowerCase()) {
          updateValidaton = await userModel.findOneAndUpdate(
            { email: req.body.email.toLowerCase() },
            { $set: { validateLocation: true } },
            { new: true }
          );
        }
        if (req.body.nurseID) {
          updateValidaton = await userModel.findOneAndUpdate(
            { _id: req.body.nurseID },
            { $set: { validateLocation: true } },
            { new: true }
          );
        }
        return res.json({
          status: "Success",
          messageID: 200,
          message: "You are inside the location",
          data: `total distance from nursing home to nurse location is ${exactMeeter} Meeters`,
        });
      } else {
        if (req.body.email.toLowerCase()) {
          updateValidaton = await userModel.findOneAndUpdate(
            { email: req.body.email.toLowerCase() },
            { $set: { validateLocation: false } },
            { new: true }
          );
        }
        if (req.body.nurseID) {
          updateValidaton = await userModel.findOneAndUpdate(
            { _id: req.body.nurseID },
            { $set: { validateLocation: false } },
            { new: true }
          );
        }
        return res.json({
          status: "Success",
          messageID: 200,
          message: "You are outside the location",
          data: `total distance from nursing home to nurse location is ${exactMeeter} Meeters`,
        });
      }
    } else {
      return res.json({
        status: "Success",
        messageID: 200,
        message: "Not for physician",
        // data: `total distance from nursing home to nurse location is ${exactMeeter} Meeters`,
      });
    }
  } catch (err) {}
}



async function removeAllTokens(req, res){
  try{
    let userId = req.user._id
    let removeTokens = await userModel.findOneAndUpdate({_id:userId}, {$set:{pushNotificationToken:"", voip_push:""}}, {new:true})
    
    if(removeTokens){
      return res.json({
        status: "Success",
        messageID: 200,
        message: "Token Removed Successfully",
        
      });
    }

  }catch(err){
    return res.json({
      status: "Success",
      messageID: 200,
      message: "Something Wrong happened",
      error: err
    });
  }

}

function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return (Value * Math.PI) / 180;
}



async function resendProfilelink(req, res){
  try{
    console.log(req.body, 'test')

    let register = await userModel.findOne({_id:req.body._id})

    console.log(register, "register")
    // return false
    if (register) {
      let payload = {
        _id: register._id,
    
        role: register.role,
    
        name: register.name,
    
        image: register.image,
    
        email: register.email,
      };
    
      const token = jwt.sign(payload, SECRETKEY, { expiresIn: "40m" });
      register.token = token;
      await userModel.findByIdAndUpdate(
        register._id,
        { $set: { token: token } },
        { new: true }
      );
    
      let notifyData = new notification({
        createrId: req.user._id,
        userId: register._id,
      });
    
      let notification1 = await notifyData.save();
    
      if (APP.APIHOST === "http://54.190.192.105:9133") {
        APP.APIHOST = "https://mean.stagingsdei.com:445";
      }
    
      let data = await createDynamicLinkSetupProfile(token)
        let dynamicURLData;
        if(data && data.status){
          dynamicURLData = data.URL
    }
    
    
      let signUpEmailContent = await signUpEmail(APP, PORTS, dynamicURLData);
      let signupMessage = await generateMessageSignup(dynamicURLData)


      if (token) {
        let subject = "Account Create Link";
        let text = signUpEmailContent;
        let response = sendEmail(register.email, subject, text);
        let toNumber = `+1${register?.contact}`
        let sendMessage = await sendSMS.sendSms(toNumber, signupMessage)
        .then((message) => {
          
         console.log(`Message sent to : ${message?.data?.to[0]?.phone_number}`);
         })
         .catch((error) => {
         console.error(`Error sending message: ${error.message}`);
         });
        if (response) {
          res.json({
            status: responses.SUCCESS,
            messageID: responses.SUCCESS_CODE,
            message: "Account Setup Link Sent Successfully",
            data: register,
          });
        } else {
        }
      }
    }
    
  }catch(error){
    console.log(error)
  }
}


module.exports = {
  currentUser: currentUser,
  register: register,
  profileUpdate: profileUpdate,
  getAllUsers: getAllUsers,
  getUser: getUser,
  deleteUserById: deleteUserById,
  authenticateUser: authenticateUser,
  allNursingHomes: allNursingHomes,
  getAllAssisstedLiving: getAllAssisstedLiving,
  geoLocationUpdate: geoLocationUpdate,
  getAllSubadmin: getAllSubadmin,
  physicianAndNursesForNursingHome: physicianAndNursesForNursingHome,
  physicianAndNursesForAssistedLiving: physicianAndNursesForAssistedLiving,
  allPhysciansAndNurses: allPhysciansAndNurses,
  count: count,
  allSubadmin: allSubadmin,
  updateSubadmin: updateSubadmin,
  verifyTokenData: verifyTokenData,
  getUserProfile: getUserProfile,
  getStatus: getStatus,
  accountUpdate: accountUpdate,
  updateStatus: updateStatus,
  dashboardPhysicianNurses: dashboardPhysicianNurses,
  getProfile: getProfile,
  logout: logout,
  nurseLoginLogs: nurseLoginLogs,
  fireBaseToken: fireBaseToken,
  dashboardCount: dashboardCount,
  graphCount: graphCount,
  staffAvailibility: staffAvailibility,
  assignPhysicianToNursingHome: assignPhysicianToNursingHome,
  removePhysician: removePhysician,
  nursingLatLong: nursingLatLong,
  removeAllTokens:removeAllTokens,
  resendProfilelink:resendProfilelink,
  setupProfileUpdate:setupProfileUpdate
};
