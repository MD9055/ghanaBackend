const express = require("express");
const constant = require("../constant");
const userModel = require("../model/users");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const config = require("../config/config").get(process.env.NODE_ENV);
const sendEmail = require("../middlewares/sendEmail");
const loginLogsData = require("../model/loginLogs");
const loginLogs = require("../model/loginLogs");
const sendSMS = require('../middlewares/twilioMSG')
const moment = require("moment");
const {
  forgetEmail,
  createDynamicLink,
  generateMessageForget
} = require("../middlewares/emailTemplate");
const { nursingLatLong } = require("../controllers/admin/users");

const { SECRETKEY, APP, PORTS, API_PORT } = config;

module.exports = {
  login: login,
  changePassword: changePassword,
  forgotPassword: forgotPassword,
  createPassword: createPassword,
};

async function login(req, res) {
  const { email, passwoord, pushNotificationToken } = req.body;
  if (req.body && req.body.email) {
    const email = req.body.email.toLowerCase();
    let checkUser = await userModel.findOne({
      email: email,
      status: { $ne: 2 },
    });

    // if(checkUser){
    //   if(checkUser.validateLocation == false ){

    //     return res.jsonp({
    //       status: constant.DATA_FAILED,
    //       messageID: constant.ERROR_CODE,
    //       message: constant.LocationOUTMessage,
    //     });

    //   }
    // }
    if (!checkUser) {
      return res.jsonp({
        status: constant.DATA_FAILED,
        messageID: constant.ALLREADY_EXIST,
        message: constant.USER_DOEST_NOT_EXIST,
      });
    } else if (checkUser.status == 0) {
      return res.jsonp({
        status: constant.DATA_FAILED,
        messageID: constant.ALLREADY_EXIST,
        message: "User Status is In-Active",
      });
    } else {
      const isMatch = await bcrypt.compareSync(
        req.body.password,
        checkUser.password
      );
      
      console.log(req.body.password,checkUser.password, "checking password" )
      console.log(isMatch, "isMatch" )


      if (!isMatch) {
        return res.jsonp({
          status: constant.DATA_FAILED,
          messageID: constant.ALLREADY_EXIST,
          message: constant.INCORRECT_PASSWORD,
        });
      }
      const payload = {
        _id: checkUser.id,

        role: checkUser.role,

        name: checkUser.name,

        image: checkUser.image,

        email: checkUser.email,
      };
      const token = jwt.sign(
        payload,
        SECRETKEY,
        {
          expiresIn: "72h",
        },
        async (err, token) => {
          let data = {
            role: checkUser.role,
            token: token,
            name: checkUser.name,
            image: checkUser.image,
            _id: checkUser._id,
          };

          // saving token in the table

          if (token) {
            let saveToken = await userModel.findByIdAndUpdate(checkUser._id, {
              $set: { token: token },
            });
          }

          // saving push notification token

          if (
            req.body.pushNotificationToken != "" ||
            req.body.pushNotificationToken != null
          ) {
            let pushNotification = await userModel.findByIdAndUpdate(
              checkUser._id,
              {
                $set: { pushNotificationToken: req.body.pushNotificationToken },
              }
            );
          }

          if (req.body.deviceType != "" || req.body.deviceType != null) {
            let deviceType = await userModel.findByIdAndUpdate(
              checkUser._id,
              {
                $set: { deviceType: req.body.deviceType },
              },
              { new: true }
            );
          }

          if (req.body.voip_push != "" || req.body.voip_push != null) {
            let voip_pushINfo = await userModel.findByIdAndUpdate(
              checkUser._id,
              {
                $set: { voip_push: req.body.voip_push },
              },
              { new: true }
            );
          }

          // if(req.body.deviceType === 'ios'){
          //   let pushNotification = await userModel.findByIdAndUpdate(
          //     checkUser._id,
          //     { $set: { pushNotificationToken: "" } }
          //   );
          // }

          // if(req.body.deviceType === 'android'){

          //   let voip_pushINfo = await userModel.findByIdAndUpdate(checkUser._id, {
          //     $set:{voip_push:""},
          //   },{new:true})
          // }

          if (checkUser.role === "nurse")
            data.nursingId = checkUser.nursing_home_id;

          if (err) throw err;

          let today_date = moment(new Date()).format("YYYY-MM-DD");
          let DateString = new Date();
          let time = moment.utc(DateString).format("LTS");
          let loginLogsData = new loginLogs({
            user_id: checkUser._id,
            date: today_date,
            time: time,
          });
          if (checkUser.role === "nurse") {
            await loginLogsData.save((err, result) => {
              if (err) {
                return err;
              } else {
                console.log("Logged in successfully");
              }
            });
          }

          res.status(200).json({
            status: constant.SUCCESS,
            messageID: constant.SUCCESS_CODE,
            message: constant.LOGIN_SUCESS,
            data: data,
          });
        }
      );
    }
  }
}

async function changePassword(req, res) {
  try {
    let token = req.header("token");

    var jwtSecretKey = SECRETKEY;
    const decoded = jwt.verify(token, jwtSecretKey);
    let newData = await userModel.findOne({ _id: decoded._id });

    let email = newData.email;

    const { oldPassword, newPassword } = req.body;

    try {
      let user = await userModel.findOne({
        email: email,
      });

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch)
        return res.jsonp({
          status: constant.DATA_FAILED,
          messageID: constant.ERROR_CODE,
          message: constant.INCORRECT_PASSWORD,
        });

      const salt = await bcrypt.genSalt(10);
      let newPass = await bcrypt.hashSync(newPassword, salt);
      const update = await userModel.findOneAndUpdate(
        { email: email },
        { $set: { password: newPass, name: req.body.name } },
        { new: true }
      );
      return res.jsonp({
        status: constant.SUCCESS,
        messageID: constant.SUCCESS_CODE,
        message: constant.PASSWORD_CHANGED,
        data: update,
      });
    } catch (e) {
      return res.jsonp({
        status: constant.FAILURE,
        messageID: constant.ERROR_CODE,
        message: constant.PASSWORD_FAILED_MSG,
      });
    }
  } catch (error) {
    res.jsonp({
      status: constant.FAILURE,
      messageID: constant.ERROR_CODE,
      message: constant.PASSWORD_FAILED_MSG,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email, mobile } = req.body;
    let modalName;
    let role = "";
    let user;

    user = await userModel.findOne({
      email: req.body.email.toLowerCase(),
    });

    // setup profile code
    if (user.status == 0) {
      return res.jsonp({
        status: constant.FAILURE,
        messageID: constant.ERROR_CODE,
        message:
          user.status == 0
            ? "User cant reset Password under In-Active Mode"
            : constant.USER_NOT_ACCESS_MSG,
      });
    }
    let payload = { type: role, _id: user._id };
    const token = jwt.sign(payload, SECRETKEY, { expiresIn: "20m" });
    let token_Data = (Math.random() + 1).toString(36).substring(2);
   let datsa =  await userModel.findOneAndUpdate(
      { email: req.body.email.toLowerCase() },
      { $set: { token: token } },
      { new: true }
    );
    if (APP.APIHOST === "http://54.190.192.105") {
      APP.APIHOST = "https://mean.stagingsdei.com";
    }
    if (PORTS.EMAIL_PORT === 9133) {
      PORTS.EMAIL_PORT = 445;
    }

    const data = await createDynamicLink(token);
    let dynamicURLData;
    if (data && data.status) {
      dynamicURLData = data.URL;
    }
    let ForgetPasswordMailContent = await forgetEmail(
      APP,
      PORTS,
      dynamicURLData
    );

    let forgetMessageContent = await generateMessageForget(dynamicURLData)


    let subject = "Forgot Your Password";
    let text = ForgetPasswordMailContent;
    let response = sendEmail(email, subject, text);
    let toNumber = `+1${user?.contact}`
    let sendMessage = await sendSMS.sendSms(toNumber, forgetMessageContent)
        .then((message) => {
          
         console.log(`Message sent to : ${message?.data?.to[0]?.phone_number}`);
         })
         .catch((error) => {
         console.error(`Error sending message: ${error.message}`);
         });

    if (response)
      return res.jsonp({
        status: constant.SUCCESS,
        messageID: constant.SUCCESS_CODE,
        message: constant.FORGET_PASSWORD_MSG,
        // url: `${APP.APIHOST}:${PORTS.EMAIL_PORT}/reset-password/${token}`,
      });
    else
      return res.jsonp({
        status: constant.FAILURE,
        messageID: constant.ERROR_CODE,
        message: constant.PASSWORD_CHANGE_FAILED,
      });
  } catch (e) {
    console.log(e);
    return res.jsonp({
      status: constant.FAILURE,
      messageID: constant.ERROR_CODE,
      message: constant.PASSWORD_CHANGE_FAILED,
    });
  }
}

async function createPassword(req, res) {
  try {
    let token = req.body.token;

    var jwtSecretKey = SECRETKEY;
    const decode = jwt.verify(token, jwtSecretKey);
    const resetToken = await userModel.findById(decode._id);
    if (resetToken.token) {
      const { password } = req.body;

      if (decode._id) {
        const salt = await bcrypt.genSalt(10);
        let newPass = await bcrypt.hashSync(password, salt);

        userModel.findByIdAndUpdate(
          decode._id,
          { $set: { password: newPass, token: null } },
          { new: true },
          (err, result) => {
            if (err) {
              res.jsonp({
                status: constant.FAILURE,
                messageID: constant.ERROR_CODE,
                message: constant.PASSWORD_UPDATE_ERROR,
                data: err,
              });
            } else {
              return res.jsonp({
                status: "Success",
                messageID: constant.SUCCESS_CODE,
                message: "Password Created Successfully",
                data: result,
              });
            }
          }
        );
      }
    } else {
      res.jsonp({
        status: "Failed",
        messageID: constant.AUTH_CODE,
        message: "Token Expired",
      });
    }
  } catch (error) {
    return res.jsonp({
      status: "Failed",
      messageID: constant.AUTH_CODE,
      message: "Invalid Token",
      data: error,
    });
  }
}
