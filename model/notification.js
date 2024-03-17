const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const notificationSchema = new mongoose.Schema(
  {
    
    sender: {type:mongoose.Schema.Types.ObjectId, ref:'user'}, // Notification creator
    receiver: {type:mongoose.Schema.Types.ObjectId, ref:'user'}, // Ids of the receivers of the notification
    message: {type:String}, // any description of the notification message 
    read_by:[{
     readerId:{type:mongoose.Schema.Types.ObjectId, ref:'user'},
     read_at: {type: Date, default: Date.now}
    }],
    additionalData:[
     {
      type:{type:String},
      typeId:{type:String},
     }
    ],
    created_at:{type: Date, default: Date.now},
    isClicked:{
      type:Boolean, 
      default:false
    },

  },
  {
    versionKey: false,
    // Make Mongoose use Unix time (seconds since Jan 1, 1970)
    timestamps: true,
  }
);

notificationSchema.plugin(mongoosePaginate);
notificationSchema.plugin(aggregatePaginate);
module.exports = mongoose.model("notification", notificationSchema);
