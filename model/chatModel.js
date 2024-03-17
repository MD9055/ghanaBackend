const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const chatModel = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },

    users: [
      
    { type: mongoose.Schema.Types.ObjectId, ref: "user" }
    
    ],
    deleteUser:[
      {
        type: mongoose.Schema.Types.ObjectId, ref: "user" 
      }
    ],

    groupDetails: {
      name: {
        type: String,
      },
      image: {
        type: String,
      },
    },

    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    type: {
      type: String,
    },
    identificationID: {
      type: String,
    },

    isDeleted:{
      type:Boolean, 
      default:false
    },
    nursePasswordReset: [{
      status:{type:Boolean, defalut:false}, createdTime:{type:String}
    }],

    roomName: { type: String },

    isDeleted:{type:Boolean, default:false},

    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

    createdBy:{
      type:mongoose.Schema.Types.ObjectId, ref: "user" 
    }
  },
  { timestamps: true }
);

chatModel.plugin(mongoosePaginate);
chatModel.plugin(aggregatePaginate);
const Chat = mongoose.model("Chat", chatModel);

module.exports = Chat;
