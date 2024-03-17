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
const bcrypt = require("bcrypt");
const constant = require("../../constant");
const commonQuery = require("../../middlewares/commonQuery");
const Chat = require("../../model/chatModel");
const Message = require("../../model/messageModel");
const chat = require("../../middlewares/chat");
const { SECRETKEY, APP, PORTS } = config;

// const { SECRETKEY } = config;
var ObjectId = require("mongodb").ObjectID;
const {signUpEmail,physicianAssigMail,physicianRemoveMail} = require("../../middlewares/emailTemplate")




async function allNursingHomes(req, res) {
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
    } else if (req.query.status == 1) {
      query = {
        $and: [
          { status: { $ne: 2 }, status: { $eq: 1 } },
          { role: { $eq: "nursing_home" } },
        ],
      };
    } else if (req.query.status) {
      query = {
        $and: [
          { status: { $ne: 2 }, status: { $eq: 0 } },
          { role: { $eq: "nursing_home" } },
        ],
      };
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
        $lookup: {
          from: "users",
          localField: "assissted_living_id",
          foreignField: "_id",
          as: "assissted_living_id",
        },
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
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "Nursing Home Fetched Successfully.",
        data: nursingHomeData,
      });
    } else {
      res.status(201).json({
        status: "Not Found",
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
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "Nurses & Physician Fetched Successfully.",
        data: physicianAndNurseData,
      });
    } else {
      res.status(200).json({
        status: "failure",
        messageID: 500,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  } catch (error) {}
}

async function updateNursingHome(req, res) {
  try {
    let checkEmail = await userModel.findOne({
      email: req.body.email,
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
        payload.email = req.body.email;

      if (req.body.contact || req.body.contact === "")
        payload.contact = req.body.contact;

      if (req.body.location || req.body.location === "" || req.body.location != undefined)
        payload.location = req.body.location;

      if (req.body.nursing_company || req.body.nursing_company === "")
        payload.nursing_company = req.body.nursing_company;

        if (req.body.usersLimit || req.body.usersLimit === "" || req.body.usersLimit != undefined)
        payload.usersLimit = req.body.usersLimit;

        

      if (req.body.status || req.body.status === "")
        payload.status = req.body.status;

      if (req.body.liveLocation || req.body.liveLocation != "")
        payload.liveLocation = JSON.parse(req.body.liveLocation);

      payload.image = imageData;


      let checkUser = await userModel.findOne({
        _id: req.body._id,
   
      });

      
        if(checkUser.email != req.body.email){
          
          const payloadToke = {
            _id: req.body._id,
            role: checkUser.role,
            name: checkUser.name,
            image: checkUser.image,
            email: req.body.email,
    
          };
          const token = jwt.sign(
            payloadToke,
            SECRETKEY,
            {
              expiresIn: "20m",
            })

            userModel.findByIdAndUpdate(
              id,
              { $set: payload, token:token, password:null, status:0},
              { new: true },
             async function (err, result) {
                if (result) {

                  let signUpEmailContent = await signUpEmail(APP, PORTS, token)
              
                 let subject = "Account Re-Setup Link";
                  let text = signUpEmailContent
                  let response = sendEmail(req.body.email, subject, text);
                  return res.json({
                    status: "success",
                    messageID: responses.SUCCESS_CODE,
                    message: "Nursing Home update successfully.",
                    data: result,
                  });
                }
                res.status(201).json({
                  status: "failure",
                  messageID: responses.INTERNAL_ERROR_CODE,
                  message: responses.INTERNAL_ERROR,
                  err: err,
                });
              }
            );
        }
      else{
          userModel.findByIdAndUpdate(
            id,
            { $set: payload},
            { new: true },
            function (err, result) {
              if (result) {
                return res.json({
                  status: "success",
                  messageID: responses.SUCCESS_CODE,
                  message: "Nursing Home update successfully.",
                  data: result,
                });
              }
              res.status(201).json({
                status: "failure",
                messageID: responses.INTERNAL_ERROR_CODE,
                message: responses.INTERNAL_ERROR,
                err: err,
              });
            }
          );
        }
      
    }
  } catch (error) {
   throw error;
  }
}

async function nurshingHomeList(req, res) {
  try {
    let query = {
      role: "nursing_home",
      status: { $eq: 1 },
    };
    let nursingHome = await userModel.find(query);

    if (nursingHome) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "Nursing home fetched",
        data: nursingHome,
      });
    }
  } catch (err) {}
}

async function associatedPhysician(req, res) {
  try {
    let physican = await userModel.find({
      $and: [
        { status: { $ne: 2 } },
        { role: { $eq: "physician" } },
        { nursing_home_id: req.query._id },
      ],
    });

    if (physican) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "Physician Fetched Successfully.",
        data: physican,
      });
    } else {
      res.status(201).json({
        status: "Not Found",
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

async function associatedNurses(req, res) {
  try {
    let physican = await userModel.find({
      $and: [
        { status: { $ne: 2 } },
        { role: { $eq: "nurse" } },
        { nursing_home_id: req.query._id },
      ],
    });

    if (physican) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: "Nurses Fetched Successfully.",
        data: physican,
      });
    } else {
      res.status(201).json({
        status: "Not Found",
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

async function associatedNursingHomes(req, res) {
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
      role: "nursing_home",
      status: { $ne: 2 },
      _id: { $in: nursingHomeIds },
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

async function updateNursePasswrord(req, res) {
  const salt = await bcrypt.genSalt(10);
  let newPass = await bcrypt.hashSync(req.body.password, salt);
  checkNurse = await userModel.findOne({ _id: req.body._id });
  if (checkNurse.status == 0) {
    return res.jsonp({
      status: "Error",
      messageID: constant.ERROR_CODE,
      message: "Profile Setup Required",
    });
  }

  let updateNurse = await userModel.findByIdAndUpdate(
    req.body._id,
    { $set: { password: newPass } },
    { new: true }
  );

  if (updateNurse.role === "nurse") {

    let findNurse = await Chat.find({ users: ObjectId(req.body._id) });
    let payload = {
      status: true,
      createdTime: new Date().getTime(),
    };
    findNurse.forEach(async (el) => {
      if (!el.isGroupChat) {
        let update = await Chat.updateOne(
          { _id: ObjectId(el._id) },
          { $push: { nursePasswordReset: payload } },
          { new: true }
        );
      }
      if (el.isGroupChat) {
        let update = await Chat.update(
          { _id: ObjectId(el._id) },
          { $pull: { users: req.body._id } }
        );
      }
    });
    return res.jsonp({
      status: "success",
      messageID: constant.SUCCESS_CODE,
      message: constant.PASSWORD_CHANGED,
    });
  }
}

async function getNurseByShift(req, res){
  try{
    let getNurseData = await userModel.find({shiftData:req.query.shiftData, role:"nurse", "nursing_home_id._id":req.user._id})
if(getNurseData){
  return res.json({
    status: "success",
    messageID: responses.SUCCESS_CODE,
    message: "Nurse Fetched Successfully.",
    data: getNurseData,
  });
}

  

  }catch(err){
    throw err;
  }
}

async function updateLocationStatus(req, res){
try{
  let id = req.body._id

  let updateStatus = await userModel.findByIdAndUpdate(id, {$set:{validateLocation:req.body.validateLocation}}, {upsert:true} )
  if(updateStatus){
    return res.json({
      status: "success",
      messageID: responses.SUCCESS_CODE,
      message: "Live Location Update Successfully.",
      data: updateStatus,
    });

  }else{
    return res.json({
      status: "Failed",
      messageID: responses.FAILED_TO_PROCESS,
      message: "Filed.",
   
    });
  }
}catch(err){
  return res.json({
    status: "Failed",
    messageID: responses.FAILED_TO_PROCESS,
    message: "Filed.",
 
  });
}
}

async  function getByIdNursingHome(req, res){
 try{
  let {id}= req.query
  console.log(id,"pradeep")

 let getNursingHome = await userModel.findOne({_id:id, status:{$ne:2}})

 if(getNursingHome){
  return res.json({
    status: "success",
    messageID: responses.SUCCESS_CODE,
    message: "Fetched",
    data: getNursingHome,
  });
 }
 }catch(err){
  console.log(err)
 }
}



module.exports = {
  allNursingHomes: allNursingHomes,
  physicianAndNursesForNursingHome: physicianAndNursesForNursingHome,
  updateNursingHome: updateNursingHome,
  nurshingHomeList: nurshingHomeList,
  associatedPhysician: associatedPhysician,
  associatedNurses: associatedNurses,
  associatedNursingHomes: associatedNursingHomes,
  updateNursePasswrord: updateNursePasswrord,
  getNurseByShift:getNurseByShift,
  updateLocationStatus:updateLocationStatus,
  getByIdNursingHome:getByIdNursingHome

};
