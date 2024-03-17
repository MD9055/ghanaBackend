const mongoose = require("mongoose");

const videoRoomsModel = mongoose.Schema(
  {
    
   roomName:{type:String},
   token:{type:String},
   status: {type:String},
   participants:[{
    userId:{type:mongoose.Schema.Types.ObjectId, ref: "user"},
    userIdentity:{type:String},
    isAudioMuted:{type:Boolean, default:false},
    isVideoMuted:{type:Boolean, default:false}
   }],
   callerId : {type: mongoose.Schema.Types.ObjectId, ref: "user"},
   chatId :{ type: mongoose.Schema.Types.ObjectId, ref: "chat" },
   callType:{type:String}

  
   
  },

  { timestamps: true }
);

const videoRooms = mongoose.model("videoRooms", videoRoomsModel);

module.exports = videoRooms;
