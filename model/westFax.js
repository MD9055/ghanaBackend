const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const faxModel = mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "chat" },
    result:{type:String}
    
  },
  { timestamps: true }
);

faxModel.plugin(mongoosePaginate);
faxModel.plugin(aggregatePaginate);
const Fax = mongoose.model("faxModel", faxModel);

module.exports = Fax;
