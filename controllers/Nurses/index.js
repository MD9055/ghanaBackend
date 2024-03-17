const userModel = require("../../model/users");
const chatModel = require("../../model/chatModel");
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
const { default: mongoose } = require("mongoose");

module.exports = {
  allNurses: allNurses,
  updateNurse: updateNurse,
  associantedNurses: associantedNurses,
  associatedPhysicians: associatedPhysicians,
  associantedNursesWeb: associantedNursesWeb,
  associatedNursingHomesWeb: associatedNursingHomesWeb,
  dashboardNursinghome: dashboardNursinghome,
  dashboardNurses: dashboardNurses,
  associantedAllData: associantedAllData,
  allNursesAssociatedNursinghome: allNursesAssociatedNursinghome,
  associantedAllDataSelected: associantedAllDataSelected,
};

/* 

Description - 

Controller -  Nurse Controller
Definition -  Nurse CRUD & Other APIs

*/

/* 
API is used to get the list of all nurses
*/

async function allNurses(req, res) {
  try {
    const { id, nursing_home_id, assissted_living_id, shiftData } = req.query;
    let query;
    let limit = 100000,
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
        $and: [{ status: { $ne: 2 } }, { role: { $eq: "nurse" } }],
      };
    }

    if (nursing_home_id != "null" && nursing_home_id != "undefined") {
      query = {
        $and: [
          {
            nursing_home_id: { $elemMatch: { _id: nursing_home_id } },
            status: { $ne: 2 },
          },
          { role: { $eq: "nurse" } },
        ],
      };
    }

    if (assissted_living_id != "null" && assissted_living_id != "undefined") {
      query = {
        $and: [
          {
            assissted_living_id: { $elemMatch: { _id: assissted_living_id } },
            status: { $ne: 2 },
          },
          { role: { $eq: "nurse" } },
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
        $lookup: {
          from: "users",
          localField: "assissted_living_id._id",
          foreignField: "_id",
          as: "assissted_living_id",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "nursing_home_id._id",
          foreignField: "_id",
          as: "nursing_home_id",
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
        message: responses.NURSE_FETCHED,
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
      message: responses.DATA_FAILED,
    });
  }
}

/* 
API is used to update the nurse information
*/

// async function updateNurse(req, res) {
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

//       if (req.body.status || req.body.status === "")
//         payload.status = req.body.status;

//       if (req.body.liveLocation || req.body.liveLocation !== "")
//         payload.liveLocation = JSON.parse(req.body.liveLocation);

//       if (req.body.agency_nurse || req.body.agency_nurse === "")
//         payload.agency_nurse = req.body.agency_nurse;

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

//       if (req.body.shift || req.body.shift === "") {
//         let shiftData = [];
//         let shiftItem = req.body.shift;
//         if (shiftItem) {
//           let data = JSON.parse(shiftItem);
//           if (data.length > 0) {
//             data.map((el) => {
//               shiftData.push(el);
//             });
//           }
//         }
//         payload.shift = shiftData;
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
//               message: responses.NURSE_UPDATED,
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
//   } catch (error) {
//     console.log(error);
//   }
// }


async function updateNurse(req, res) {
  try {
    const payload = {};
    const id = req.body._id;

    const getData = await userModel.findOne({ _id: id });

    let imageData = getData?.image;
    if (req.file) {
      imageData = req.file.path;
    }

    let liveLocation = getData?.liveLocation;
    if (req.body.liveLocation && req.body.liveLocation !== "undefined") {
      liveLocation = JSON.parse(req.body.liveLocation);
    }

    if (req.body.name || req.body.name === "") {
      payload.name = req.body.name;
    }

    if (req.body.email || req.body.email === "") {
      payload.email = req.body.email;
    }

    if (req.body.contact || req.body.contact === "") {
      payload.contact = req.body.contact;
    }

    if (req.body.location || req.body.location === "") {
      payload.location = req.body.location;
    }

    if (req.body.nursing_company || req.body.nursing_company === "") {
      payload.nursing_company = req.body.nursing_company;
    }

    if (req.body.status || req.body.status === "") {
      payload.status = req.body.status;
    }

    if (liveLocation) {
      payload.liveLocation = liveLocation;
    }

    if (req.body.agency_nurse || req.body.agency_nurse === "") {
      payload.agency_nurse = req.body.agency_nurse;
    }

    if (req.body.assissted_living_id || req.body.assissted_living_id === "") {
      const assistLiving = [];
      const assisteData = req.body.assissted_living_id;
      if (assisteData) {
        const data = JSON.parse(assisteData);
        if (data.length > 0) {
          assistLiving.push(...data);
        } else if (data._id) {
          assistLiving.push(data);
        }
      }
      payload.assissted_living_id = assistLiving;
    }

    if (req.body.nursing_home_id || req.body.nursing_home_id === "") {
      const nursingHome = [];
      const nursingData = req.body.nursing_home_id;
      if (nursingData) {
        const data = JSON.parse(nursingData);
        if (data.length > 0) {
          nursingHome.push(...data);
        } else if (data._id) {
          nursingHome.push(data);
        }
      }
      payload.nursing_home_id = nursingHome;
    }

    if (req.body.shift || req.body.shift === "") {
      const shiftData = [];
      const shiftItem = req.body.shift;
      if (shiftItem) {
        const data = JSON.parse(shiftItem);
        if (data.length > 0) {
          shiftData.push(...data);
        }
      }
      payload.shift = shiftData;
    }

    payload.image = imageData;
    const result = await userModel.findByIdAndUpdate(id, { $set: payload }, { new: true });

    if (result) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.NURSE_UPDATED,
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
  } catch (error) {
    console.log(error);
  }
}




/* 
API is used to get associated nurse list
*/

async function associantedNurses(req, res) {
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
      role: "nurse",
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

    let physicianData = await userModel.aggregatePaginate(myAggregate, options);
    if (physicianData.docs.length > 0) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.NURSE_FETCHED,
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
      message: responses.DATA_FAILED,
    });
  }
}

/* 
API is used to get the associated physician list
*/

async function associatedPhysicians(req, res) {
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
      role: "physician",
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

    let physicianData = await userModel.aggregatePaginate(myAggregate, options);
    if (physicianData.docs.length > 0) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.PHYSICIANS_FETCHED,
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
      message: responses.DATA_FAILED,
    });
  }
}

/* 
API is used to get the associated nurse list for web
*/

async function associantedNursesWeb(req, res) {
  try {
    let nursingHomeIds = [];
    let assistedLiving = [];

    if (req.query.nursingHomeId != "null") {
      nursingHomeIds.push(req.query.nursingHomeId);
    } else {
      let physician = await userModel.find({ _id: req.user._id });

      physician[0].nursing_home_id.forEach((element) => {
        nursingHomeIds.push(element._id);
      });

      physician[0].assissted_living_id.forEach((element) => {
        assistedLiving.push(element._id);
      });
    }
    const nurses = await userModel.find({
      role: "nurse",
      status: { $ne: 2 },

      $or: [
        { "nursing_home_id._id": { $in: nursingHomeIds } },
        { "assissted_living_id._id": { $in: assistedLiving } },
      ],
      // "nursing_home_id._id": { $in: [nursingHomeIds,assistedLiving ] },
    });
    return res.json({
      status: "success",
      messageID: responses.SUCCESS_CODE,
      message: "Nurses fetched successfully.",
      data: nurses,
    });
  } catch (err) {
    res.json({
      status: "success",
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
API is used to get associated nursinghome list for web
*/

async function associatedNursingHomesWeb(req, res) {
  try {
    let physician = await userModel.find({ _id: req.user._id });
    let nursingHomeIds = [];
    physician[0].nursing_home_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });
    const nursingHome = await userModel.find({
      role: "nursing_home",
      status: { $ne: 2 },
      _id: { $in: nursingHomeIds },
    });

    if (nursingHome) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCHED_NURSINGHOMES,
        data: nursingHome,
      });
    } else {
      res.json({
        status: "success",
        messageID: responses.INTERNAL_ERROR_CODE,
        message: responses.DATA_FAILED,
      });
    }
  } catch (err) {
    res.json({
      status: "success",
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
API is used to get dashbaord nursinghome for web
*/

async function dashboardNursinghome(req, res) {
  try {
    let physician = await userModel.find({ _id: req.user._id });
    let nursingHomeIds = [];
    physician[0].nursing_home_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });
    let query;
    let limit = 3,
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
          $or: [
            { name: { $regex: filter, $options: "i" } },
            { email: { $regex: filter, $options: "i" } },
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

/* 
API is used to get the nursed for dashboard
*/

async function dashboardNurses(req, res) {
  try {
    let physician = await userModel.find({ _id: req.user._id });
    let nursingHomeIds = [];
    physician[0].nursing_home_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });

    let query;
    let limit = 3,
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
      role: "nurse",
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

    let physicianData = await userModel.aggregatePaginate(myAggregate, options);
    if (physicianData.docs.length > 0) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.NURSE_FETCHED,
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
      message: responses.DATA_FAILED,
    });
  }
}

/* 
API is used to get all the associated information
*/

async function associantedAllData(req, res) {
  try {
    let physician = await userModel.find({ _id: req.user._id });
    let nursingHomeIds = [];
    physician[0].nursing_home_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });

    physician[0].assissted_living_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });

    const nurses = await userModel.find({
      role: "nurse",
      status: { $ne: 2 },
      _id: { $ne: req.user._id },
      $or: [
        { "nursing_home_id._id": { $in: nursingHomeIds } },
        { "assissted_living_id._id": { $in: nursingHomeIds } },
      ],
    });
    const others = await userModel.find({
      role: "others",
      status: { $ne: 2 },
      _id: { $ne: req.user._id },
      $or: [
        { "nursing_home_id._id": { $in: nursingHomeIds } },
        { "assissted_living_id._id": { $in: nursingHomeIds } },
      ],
    });

    const physicianData = await userModel.find({
      role: "physician",
      status: { $ne: 2 },
      _id: { $ne: req.user._id },

      $or: [
        { "nursing_home_id._id": { $in: nursingHomeIds } },
        { "assissted_living_id._id": { $in: nursingHomeIds } },
      ],
    });
    let combineData = {
      nurse: nurses,
      physician: physicianData,
      others: others,
    };

    return res.json({
      status: "success",
      messageID: responses.SUCCESS_CODE,
      message: "All  Roles fetched successfully.",
      data: combineData,
    });
  } catch (err) {
    res.json({
      status: "success",
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* 
API is used to get associated nurses for the nursing home

*/

async function allNursesAssociatedNursinghome(req, res) {
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
      "nursing_home_id._id": req.query.nursing_home_id,
      role: "nurse",
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

    let nurseData = await userModel.aggregatePaginate(myAggregate, options);
    if (nurseData.docs.length > 0) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.NURSE_FETCHED,
        data: nurseData,
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
      message: responses.DATA_FAILED,
    });
  }
}

async function associantedAllDataSelected(req, res) {
  try {
    let newData = await chatModel.findOne({
      _id: mongoose.Types.ObjectId(req.body.chatId),
    });

    let physician = await userModel.find({ _id: req.user._id });
    let nursingHomeIds = [];
    physician[0].nursing_home_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });

    physician[0].assissted_living_id.forEach((element) => {
      nursingHomeIds.push(element._id);
    });

    const nurses = await userModel.find({
      role: "nurse",
      status: { $ne: 2 },
      _id: { $ne: req.user._id },
      $or: [
        { "nursing_home_id._id": { $in: nursingHomeIds } },
        { "assissted_living_id._id": { $in: nursingHomeIds } },
      ],
    });
    const others = await userModel.find({
      role: "others",
      status: { $ne: 2 },
      _id: { $ne: req.user._id },
      $or: [
        { "nursing_home_id._id": { $in: nursingHomeIds } },
        { "assissted_living_id._id": { $in: nursingHomeIds } },
      ],
    });

    const physicianData = await userModel.find({
      role: "physician",
      status: { $ne: 2 },
      _id: { $ne: req.user._id },

      $or: [
        { "nursing_home_id._id": { $in: nursingHomeIds } },
        { "assissted_living_id._id": { $in: nursingHomeIds } },
      ],
    });
    let combineData = {
      nurse: nurses,
      physician: physicianData,
      others: others,
    };

    return res.json({
      status: "success",
      messageID: responses.SUCCESS_CODE,
      message: "All  Roles fetched successfully.",
      data: combineData,
    });
  } catch (err) {
    res.json({
      status: "success",
      messageID: responses.INTERNAL_ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}
