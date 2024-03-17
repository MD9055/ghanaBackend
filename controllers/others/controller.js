const userModel = require("../../model/users");
const mongoose = require("mongoose");
const responses = require("../../constant");

const path = require("path");
const jwt = require("jsonwebtoken");
const config = require("../../config/config").get(
  process.env.NODE_ENV || "local"
);
const constant = require("../../constant");

module.exports = {
  othersList: othersList,
};

async function othersList(req, res) {
  try {
    let nursinghomeId;
    let assistedLiveId
    if (req.user.role === "assisted_living") {
       assistedLiveId = req.query.assissted_living_id;
    }
    if (req.user.role === "nursing_home") {
      nursinghomeId = req.query.nursing_home_id;
    }
    if(req.user.role === 'admin'){
      nursinghomeId = ''
    }

    const { id } = req.query;
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
    } else if (req.query.status == 1) {
      query = {
        $and: [
          { status: { $ne: 2 }, status: { $eq: 1 } },
          { role: { $eq: "others" } },
        ],
      };
    } else if (req.query.status) {
      query = {
        $and: [
          { status: { $ne: 2 }, status: { $eq: 0 } },
          { role: { $eq: "others" } },
        ],
      };
    } else if (req.user.role === "assisted_living") {
      query = {
        $and: [
          { status: { $ne: 2 } },
          { role: { $eq: "others" } },
          { "assissted_living_id._id": req.user._id },
        ],
      };
    }
    if (req.user.role === "nursing_home") {
      query = {
        $and: [
          { status: { $ne: 2 } },
          { role: { $eq: "others" } },
          { "nursing_home_id._id": req.user._id },
        ],
      };
    }


     if (req.user.role === 'admin') {
      query = {
        $and: [
          { status: { $ne: 2 } },
          { role: { $eq: "others" } },
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
          from: "users", // Update this with the actual collection name
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
            // { location: { $regex: filter, $options: "i" } },
          ],
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
        message: responses.OTHER_FETCHED,
        data: nursingHomeData,
      });
    } else {
      res.status(201).json({
        status: responses.NOT_FOUND,
        messageID: responses.ALLREADY_EXIST,
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
