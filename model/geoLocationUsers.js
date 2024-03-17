const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const locationSchema = new mongoose.Schema(
  {
      userId : { type: mongoose.Schema.Types.ObjectId, ref: "user" }, 

      userLocation : {type:String,}
    
  },
  {
    versionKey: false,
    // Make Mongoose use Unix time (seconds since Jan 1, 1970)
    timestamps: true,
  }
);

locationSchema.plugin(mongoosePaginate);
locationSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("userLocation", locationSchema);
