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
const { response } = require("express");
const { SECRETKEY } = config;

module.exports = {
  getAllAssisstedLiving: getAllAssisstedLiving,
  geoLocationUpdate: geoLocationUpdate,
  physicianAndNursesForAssistedLiving: physicianAndNursesForAssistedLiving,
  updateAssistedLiving: updateAssistedLiving,
  assistedLivings: assistedLivings,
  associatedAssistedLivingWeb: associatedAssistedLivingWeb,
};



/* 

API is used to get the all assisted livings 
*/

async function getAllAssisstedLiving(req, res) {
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
    }
    if (req.query.status == 1) {
      query = {
        $and: [
          { status: { $ne: 2 }, status: { $eq: 1 } },
          { role: { $eq: "assisted_living" } },
        ],
      };
    }
    if (req.query.status == 0 && req.query.status != "") {
      query = {
        $and: [
          { status: { $ne: 2 }, status: { $eq: 0 } },
          { role: { $eq: "assisted_living" } },
        ],
      };
    }
    if (req.query.status != 2 && req.query.status == "") {
      query = {
        $and: [{ status: { $ne: 2 } }, { role: { $eq: "assisted_living" } }],
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

    let assistedLivingData = await userModel.aggregatePaginate(
      myAggregate,
      options
    );
    if (assistedLivingData.docs.length > 0) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.ASSISSTED_LIVE_FETCHED,
        data: assistedLivingData,
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

API is used to update the geo location for the assisted livings 

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
            status: "Success",
            messageID: constant.SUCCESS_CODE,
            message: responses.GEO_LOCATION_UPDATED,
          });
        } else {
          res.status(201).json({
            status: "failure",
            messageID: 201,
            message: responses.DATA_FAILED,
          });
        }
      }
    } catch (error) {}
  }
  geoLocationUpdate().then(function () {});
}

/* 
API is used to get the physicians and nursed for the assisted livings 
*/

async function physicianAndNursesForAssistedLiving(req, res) {
  try {
    const { id } = req.query;
    let query;
    let limit = 100,
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
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_NURSE_PHYSICIAN,
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

/* 
API is used to update the assisted livings 
*/

async function updateAssistedLiving(req, res) {
  try {
    let checkEmail = await userModel.findOne({
      email: req.body.email,
      _id: { $ne: req.body._id },
    });
    if (checkEmail) {
      res.json({
        status: "success",
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

      if (req.body.description || req.body.description === "")
        payload.description = req.body.description;

      if (req.body.geo_location || req.body.geo_location === "")
        payload.geo_location = req.body.geo_location;

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
              status: "success",
              messageID: responses.SUCCESS_CODE,
              message: responses.UPDATE_ASSISTED_LIVE,
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
    }
  } catch (error) {}
}

/* 
API is used to get the list of Assisted Livings 
*/

async function assistedLivings(req, res) {
  try {
    let query = {
      role: "assisted_living",
     // status: { $eq: 1 },
    };
    let assisteLive = await userModel.find(query);

    if (assisteLive) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.ASSISSTED_LIVE_FETCHED,
        data: assisteLive,
      });
    }
  } catch (err) {}
}


/* 
Function to get the associated assisted living list for web
*/

async function associatedAssistedLivingWeb(req, res) {
  try {
    let physician = await userModel.find({ _id: req.user._id });
    let assistedLivingId = [];
    physician[0].assissted_living_id.forEach((element) => {
      assistedLivingId.push(element._id);
    });
    const nursingHome = await userModel.find({
      role: "assisted_living",
      status: { $ne: 2 },
      _id: { $in: assistedLivingId },
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
