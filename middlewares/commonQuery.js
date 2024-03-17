"use strict";

var constant = require("../constant");
var mongoose = require("mongoose");
var fs = require("fs");
const responses = require("../constant");
const Config = require("../config/config").get(process.env.NODE_ENV || "local");
const {validationResult} = require('express-validator')


var commonQuery = {};
/* Function to update one document Dynamically */

commonQuery.updateOneDocument = function updateOneDocument(
  model,
  updateCond,
  updateData
) {
  return new Promise(function (resolve, reject) {
    model
      .findOneAndUpdate(
        updateCond,
        {
          $set: updateData,
        },
        {
          new: true,
          useFindAndModify: false,
        }
      )
      .lean()
      .exec(function (err, result) {
        if (err) {
          reject(0);
        } else {
          resolve(result);
        }
      });
  });
};

/* Function to insert the new document in database */

commonQuery.InsertIntoCollection = function InsertIntoCollection(model, obj) {
  return new Promise(function (resolve, reject) {
    new model(obj).save(function (err, insertedData) {
      if (err) {
        reject(err);
      } else {
        resolve(insertedData);
      }
    });
  });
};

/* Function to find all data  */
commonQuery.findAll = async function findAll(model, condition, pageSize, page) {
  let user = "_id";
  let pageSizes = pageSize;
  let currentPage = page;
  return new Promise(function (resolve, reject) {
    let postQuery = model.find(condition, { timeout: false }).lean();

    if (pageSizes && currentPage) {
      postQuery.skip(pageSizes * (currentPage - 1)).limit(pageSizes);
    }
    postQuery.exec(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/* Function to retreive One document  */
commonQuery.findOne = function findOne(model, condition ){
  
  
  return new Promise(function (resolve, reject) {
    let postQuery = model.findOne(condition).lean();
    postQuery.exec(function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}


/* Function to update one document */
commonQuery.updateOne = function updateOne(model, updateCond, updateData) {
  return new Promise(async function (resolve, reject) {
    model
      .updateOne(updateCond, {
        $set: updateData,
      })
      .lean()
      .exec(async function (err, result) {
        if (err) {
          reject(0);
        } else {
          resolve(result);
        }
      });
  });
};

/* Function to validate the response for the schema - required fields */
commonQuery.validationResponse = (req, res, next) => {

    const error = validationResult(req);

    if (!error.isEmpty()) {
       return res.status(401).json({
          status: responses.FAILURE,
          messageID: 401,
          message: responses.ParameterMissing,
          error: error.array(),
        });

    } else {

        next();

    }

}



commonQuery.responses = function responses(status,messageID, message, data ){
}

module.exports = commonQuery;
