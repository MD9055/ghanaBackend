const mongoose = require("mongoose");

const loginLogsModel = mongoose.Schema(
  {
    
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    date:{type:String, default:null},
    time:{type:String, default:null}
  },

  { timestamps: true }
);

const loginLogs = mongoose.model("loginLogs", loginLogsModel);

module.exports = loginLogs;
