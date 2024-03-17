const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const userSchema = new mongoose.Schema(
  {
    _id: String,
    name: {
      type: String,
      required: true,
    },

    roleName: {
      type: String,
    },
  },
  {
    versionKey: false,
    // Make Mongoose use Unix time (seconds since Jan 1, 1970)
    timestamps: true,
  }
);

userSchema.plugin(mongoosePaginate);
userSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("user", userSchema);
