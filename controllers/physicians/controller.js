const userModel = require("../../model/users");
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
const emailModel = require("../../model/mailModel");
const Signature = require("../../model/signatureModel");

const constant = require("../../constant");

const { SECRETKEY } = config;
const CryptoJS = require('crypto-js');


let Imap = require('imap'),
  inspect = require('util').inspect;
const { simpleParser } = require('mailparser');

module.exports = {
  allPhysicians: allPhysicians,
  updatePhysician: updatePhysician,
  associatedNursingHome: associatedNursingHome,
  physicianAssociantedOthers: physicianAssociantedOthers,
  sendMail: sendMail,
  getEmail: getEmail,
  getInbox: getInbox,
  addSignature: addSignature,
  getSignatureById: getSignatureById,
  deleteSignature: deleteSignature,
  getEmailInfo: getEmailInfo,
  replyInboxmail: replyInboxmail,
  forwardMail: forwardMail,
  authenticateOutlook: authenticateOutlook,
  getPhysicianDetail: getPhysicianDetail,
  saveCredOutlook: saveCredOutlook,
  sendDraftMail: sendDraftMail,
  getDraftEmail:getDraftEmail
};

function generateKey() {
  // generate a random 256-bit key
  return CryptoJS.lib.WordArray.random(32);
}

function encryptData(data) {
  return CryptoJS.AES.encrypt(data, 'secretData').toString();
}
function decryptData(data) {
  var bytes = CryptoJS.AES.decrypt(data, 'secretData');
  var originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText
}

async function allPhysicians(req, res) {
  try {
    let findData = await userModel.findOne({ _id: req.user._id });
    let assistedId = findData._id;
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
    } else if (nursing_home_id == "null") {
      query = {
        $and: [{ status: { $ne: 2 } }, { role: { $eq: "physician" } }],
      };
    }

    if (nursing_home_id != "null" && nursing_home_id != "undefined") {
      query = {
        $and: [
          {
            nursing_home_id: { $elemMatch: { _id: nursing_home_id } },
            status: { $ne: 2 },
          },
          { role: { $eq: "physician" } },
          // { role: { $eq: "nurse",  } },
        ],
      };
    }

    if (assissted_living_id != "null" && assissted_living_id != "undefined") {
      query = {
        $and: [
          {
            assissted_living_id: { $elemMatch: { _id: assistedId } },
            status: { $ne: 2 },
          },
          { role: { $eq: "physician" } },
        ],
      };
    }

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

    let physicianData = await userModel.aggregatePaginate(myAggregate, options);
    if (physicianData.docs.length > 0) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "Physicians Fetched Successfully.",
        data: physicianData,
      });
    } else {
      res.status(201).json({
        status: "failure",
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: "failure",
      messageID: constant.INTERNAL_ERROR,
      message: "Data failed",
    });
  }
}

// async function updatePhysician(req, res) {
//   try {
//     let checkEmail = await userModel.findOne({
//       email: req.body.email,
//       _id: { $ne: req.body._id },
//     });
//     if (checkEmail) {
//       res.json({
//         status: responses.ERROR_CODE,
//         messageID: responses.ALLREADY_EXIST,
//         message: responses.EMAIL_EXIST_ALREADY,
//       });
//     } else {
//       let payload = {};

//       let imageData;

//       if (req.file !== undefined) {
//         imageData = req.file.path;
//       } else {
//         imageData = req.body.image;
//       }

//       let id = req.body._id;
//       // let userId = req.user._id

//       if (req.body.name || req.body.name === "") payload.name = req.body.name;

//       if (req.body.email || req.body.email === "")
//         payload.email = req.body.email;

//       if (req.body.contact || req.body.contact === "")
//         payload.contact = req.body.contact;

//       if (req.body.location || req.body.location === "")
//         payload.location = req.body.location;

//       if (req.body.nursing_company || req.body.nursing_company === "")
//         payload.nursing_company = req.body.nursing_company;

//       if (req.body.liveLocation || req.body.liveLocation != "")
//         payload.liveLocation = JSON.parse(req.body.liveLocation);

//       if (req.body.status || req.body.status === "")
//         payload.status = req.body.status;

//       if (req.body.assissted_living_id || req.body.assissted_living_id === "") {
//         let assistLiving = [];
//         let assisteData = req.body.assissted_living_id;
//         if (assisteData) {
//           let data = JSON.parse(assisteData);
//           if (data.length > 0) {
//             data.map((el) => {
//               assistLiving.push(el);
//             });
//           } else {
//             if (data._id) assistLiving.push(data);
//           }
//         }
//         payload.assissted_living_id = assistLiving;
//       }

//       if (req.body.nursing_home_id || req.body.nursing_home_id === "") {
//         let nursingHome = [];
//         let nursingData = req.body.nursing_home_id;
//         if (nursingData) {
//           let data = JSON.parse(nursingData);
//           if (data.length > 0) {
//             data.map((el) => {
//               nursingHome.push(el);
//             });
//           } else {
//             if (data._id) nursingHome.push(data);
//           }
//         }
//         payload.nursing_home_id = nursingHome;
//       }

//       payload.image = imageData;
//       userModel.findByIdAndUpdate(
//         id,
//         { $set: payload },
//         { new: true },
//         function (err, result) {
//           if (result) {
//             return res.json({
//               status: "success",
//               messageID: responses.SUCCESS_CODE,
//               message: "Physician update successfully.",
//               data: result,
//             });
//           } else {
//             res.status(201).json({
//               status: "failure",
//               messageID: responses.INTERNAL_ERROR_CODE,
//               message: responses.INTERNAL_ERROR,
//               err: err,
//             });
//           }
//         }
//       );
//     }
//   } catch (error) {}
// }


async function updatePhysician(req, res) {
  try {
    let id = req.body._id;
    let payload = {};
    let imageData;
    const getData = await userModel.findOne({ _id: id });
    

    if (req.file !== undefined) {
      imageData = req.file.path;
    } else {
      imageData = req.body.image;
    }

    let liveLocation = getData?.liveLocation;
    if (req.body.liveLocation && req.body.liveLocation !== "undefined") {
      liveLocation = JSON.parse(req.body.liveLocation);
    }


    if (req.body.name || req.body.name === "") payload.name = req.body.name;

    if (req.body.email || req.body.email === "")
      payload.email = req.body.email;

    if (req.body.contact || req.body.contact === "")
      payload.contact = req.body.contact;

    if (req.body.location || req.body.location === "")
      payload.location = req.body.location;

    if (req.body.nursing_company || req.body.nursing_company === "")
      payload.nursing_company = req.body.nursing_company;

    if (req.body.status || req.body.status === "")
      payload.status = req.body.status;

     

    if (req.body.assissted_living_id || req.body.assissted_living_id === "") {
      let assistLiving = [];
      let assisteData = req.body.assissted_living_id;
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
      payload.assissted_living_id = assistLiving;
    }

    if (req.body.nursing_home_id || req.body.nursing_home_id === "") {
      let nursingHome = [];
      let nursingData = req.body.nursing_home_id;
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
      payload.nursing_home_id = nursingHome;
    }

    payload.image = imageData;
    
    if (liveLocation) {
      payload.liveLocation = liveLocation;
    }

    userModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true },
      function (err, result) {
        if (result) {
          return res.json({
            status: "success",
            messageID: responses.SUCCESS_CODE,
            message: "Physician update successfully.",
            data: result,
          });
        } else {
          res.status(201).json({
            status: "failure",
            messageID: responses.INTERNAL_ERROR_CODE,
            message: responses.INTERNAL_ERROR,
            err: err,
          });
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
}



async function associatedNursingHome(req, res) {
  try {
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

    query = {
      _id: req.user._id,
    };

    let filter = "";

    if (req.query.filter) filter = req.query.filter;
    myAggregate._pipeline = [
      {
        $match: query,
      },
      {
        $lookup: {
          from: "users",
          localField: "nursing_home_id._id",
          foreignField: "_id",
          as: "nursing_home_id._id",
        },
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
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "Nursing Home Fetched Successfully.",
        data: physicianData,
      });
    } else {
      res.status(201).json({
        status: "failure",
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: "failure",
      messageID: constant.INTERNAL_ERROR,
      message: "Data failed",
    });
  }
}

async function physicianAssociantedOthers(req, res) {
  try {
    let physician = await userModel.find({ _id: req.user._id });
    let nursingHomeIds = [];
    physician[0].nursing_home_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });

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

    query = {
      role: "others",
      status: { $ne: 2 },
      "nursing_home_id._id": { $in: nursingHomeIds },
    };

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

    let othersData = await userModel.aggregatePaginate(myAggregate, options);
    if (othersData.docs.length > 0) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "All Others fetched successfully.",
        data: othersData,
      });
    } else {
      res.status(201).json({
        status: "failure",
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (e) {
    return res.jsonp({
      status: "failure",
      messageID: constant.INTERNAL_ERROR,
      message: "Data failed",
    });
  }
}

async function addSignature(req, res) {
  try {
    let signature = '';

    if (req.body.signatureId) {
      let _id = req.body.signatureId;
      signature = await Signature.findOneAndUpdate(_id,
        { $set: { signatureContent: req.body.signatureData } }, { new: true });

    } else {
      let signatureData = new Signature({
        signatureContent: req.body.signatureData,
        Id: req.body.Id,
        createdAt: new Date(),
        modifiedAt: new Date(),
      });
      signature = await signatureData.save();
    }
    if (signature) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Signature Added successfully",
        data: signature
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Failed to Add Signature"
      });
    }
  } catch (err) {
    console.log(err);
  }
};

async function getSignatureById(req, res) {
  try {
    let signatureData = await Signature.findOne({ Id: req.params.Id }).exec();
    if (signatureData) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Signature Fetch Successfully",
        data: signatureData
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Failed to Fetch"
      });
    }
  } catch (err) {
    console.log(err);
  }
};

async function deleteSignature(req, res) {
  try {
    let deletedSignature = await Signature.findByIdAndDelete({ _id: mongoose.Types.ObjectId(req.params.id) });

    if (deletedSignature) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Signature Deleted Successfully",
        data: deletedSignature
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Failed to Delete"
      });
    }
  } catch (err) {
    console.log(err);
  }
};

async function sendMail(req, res) {
  try {
    
    let sendemails = new emailModel({
      from_email: req.body.from_email,
      to_email: req.body.to_email,
      mailBody: req.body.signatureData,
      subject: req.body.subject,
      createdAt: new Date(),
      file: req.file,
      type: req.body.type,
      cc_email: req.body.cc_email

    })

    if (req.body.type == 'send') {
    let sentMail = await sendEmail(req.body.to_email, req.body.subject, req.body.signatureData, req.file,req.body.cc_email);
      sendemails.isSent = true; // update the flag to true
      const savedData = await sendemails.save(); 
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Mail Sent Successfullyyyy",
        data: sendemails
      });
    } else if(req.body.type == 'draft') {
        sendemails.isSent = false; // update the flag to false
        const savedDatas = await sendemails.save(); 
        res.json({
          status: responses.SUCCESS,
          messageID: responses.SUCCESS_CODE,
          message: "Mail Saved as Draft",
          data: sendemails
        });
    }
  } catch (err) {
    console.log(err);
  }
}

async function sendDraftMail(req, res) {
  try {
    
    let sendemails = new emailModel({
      from_email: req.body.from_email,
      to_email: req.body.to_email,
      mailBody: req.body.signatureData,
      subject: req.body.subject,
      createdAt: new Date(),
      file: req.file,
    })

    if (sendemails) {
      sendemails.isSent = false; // update the flag to true
      sendemails = await sendemails.save();
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Mail Saved to Draft Successfully",
        data: sendemails
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Mails Not Sent to Draft"
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function getEmailInfo(req, res) {

  let _id = req.params.id;
  try {
    const getEmail = await emailModel.findById(req.params.id).exec();

    if (getEmail) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Mails fetch Successfully",
        data: getEmail
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Mails not fetch"
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function getEmail(req, res) {
  try {
    const { _id } = req.query;
    let allEmails = await emailModel.find({ id: _id, isSent:true }).sort({ _id: -1 });
  
    if (allEmails) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: allEmails
      });
    } else {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED
      });
    }
  } catch (err) {
    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED
    });
  }
}

async function getDraftEmail(req, res) {
  try {
    const { _id } = req.query;
    let allDraftEmails = await emailModel.find({ id: _id, isSent:false }).sort({ _id: -1 });
   
    if (allDraftEmails) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: allDraftEmails
      });
    } else {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED
      });
    }
  } catch (err) {
    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED
    });
  }
}

async function getInbox(req, res) {
  // let loggedInUser = req.user
  let newData = [];

  try {
    let email = req.body.user;
    let password = req.body.password;

    // Authenticate the user
    // const isAuthenticated = await authenticateOutlook(email, password, loggedInUser);
    // console.log(isAuthenticated, "isAuthenticated")
    // if (!isAuthenticated) {
    //   return res.status(401).json({ message: 'Please log in first.' });
    // }

    const imapConfig = {
      user: email,
      password: password,
      host: 'imap-mail.outlook.com',
      port: 993,
      tls: true
    };

    const imap = new Imap(imapConfig);
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['ALL', ['SINCE', 'Sep 6, 2022']], (err, results) => {
          const f = imap.fetch(results, { bodies: '' });
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                // const {from, subject, textAsHtml, text} = parsed;
                /* Make API call to save the data
                   Save the retrieved data into a database.
                   E.t.c
                */
                //  res.send(parsed)
                newData.push(parsed);
                newData.sort((a, b) => {
                  a - b
                })

              });
            });
            msg.once('attributes', attrs => {
              const { uid } = attrs;
            });
          });
          f.once('error', ex => {
            return Promise.reject(ex);
          });
          f.once('end', () => {
            imap.end();
          });
        });
      });
    });

    imap.once('error', err => {
      console.log(err, "errorrr");
    });

    imap.once('end', () => {
      return res.json(newData);
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred', ex);
  }
}

async function authenticateOutlook(email, password, loggedInUser) {

  try {
    const user = await userModel.findOne({ outlook_email: email });
    if (!user) {
      return null;
    }

    let updateOutLookemail = await userModel.findOneAndUpdate({ _id: loggedInUser._id }, { $set: { outlook_email: email, outlook_password: password } }, { new: true })

    if (updateOutLookemail) {
      return updateOutLookemail.toObject(); // return object instead of true/false
    } else {
      console.log("error")
    }
  } catch (err) {
    console.log(err);
  }

}

async function saveCredOutlook(req, res) {

  try {
    let userId = req.user._id;
    let { outlook_email, outlook_password } = req.body;

    let updateOutLookemail = await userModel.findOneAndUpdate({ _id: userId }, { $set: { outlook_email: outlook_email, outlook_password: outlook_password } }, { new: true });

    if (updateOutLookemail) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Data Added Successfully",
        data: updateOutLookemail
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Failed to Add Data"
      });
    }
  } catch (err) {
    console.log(err);
  }

}

async function replyInboxmail(req, res) {
  try {
    let sendemails = new emailModel({
      from_email: req.body.from_email,
      to_email: req.body.to_email,
      mailBody: req.body.signatureData,
      subject: req.body.subject,
      createdAt: new Date(),
      file: req.file,
      cc_email: req.body.cc_email
    })
    sendEmail(req.body.to_email, req.body.subject, req.body.signatureData, req.file, req.body.cc_email);
    sendemails.isSent = true;
    let sentMail = await sendemails.save();

    if (sentMail) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Mail Send Successfully",
        data: sentMail
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Failed to Send Mail"
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function forwardMail(req, res) {
  try {
    let sendemails = new emailModel({
      from_email: req.body.from_email,
      to_email: req.body.to_email,
      mailBody: req.body.mailBody,
      subject: req.body.subject,
      createdAt: new Date(),
      file: req.file,
      cc_email: req.body.cc_email
    })

    sendEmail(req.body.to_email, req.body.subject, req.body.signatureData, req.file, req.body.cc_email);
    sendemails.isSent = true;
    let sentMail = await sendemails.save();

    console.log(sentMail,"sentMailsentMailsentMail")
    if (sentMail) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: "Mail Forwarded Successfully",
        data: sentMail
      });
    } else {
      res.json({
        status: responses.FAILURE,
        messageID: responses.ERROR_CODE,
        message: "Failed to Forward Mail"
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function getPhysicianDetail(req, res) {
  try {
    let allEmails = await userModel.findOne({ _id: req.user._id });
    if (allEmails) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: allEmails
      });
    } else {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED
      });
    }
  } catch (err) {
    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED
    });
  }
}