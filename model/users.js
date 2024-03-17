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
    email: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      // enum: [0, 1, 2,3, 4], /*   0 = Admin, 1 = Nusing Home, 2 = Assisted Living, 3 = Physicians, 4 = Nurses*/
      required: true,
    },
    password: {
      type: String,
      default: "",
    },
    image: {
      type: String,
    },
    nursing_company: {
      type: String,
    },
    location: {
      type: String,
    },

    description: {
      type: String,
    },
    geo_location: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Number,
      default: 0,
    },
    nursing_home_id: {
      type: Array,
      ref: "users",
    },

    assissted_living_id: {
      type: Array,
      ref: "users",
    },

    token: {
      type: String,
      default: null,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    pushNotificationToken: {
      type: String,
      default: null,
    },

    voip_push:{
      type: String,
      default: null,
    },
    deviceType:{
      type: String,
      default: null,
    },

    notificationToken: {
      type: String,
      default: null,
    },
    creatorID: { type: mongoose.Schema.Types.ObjectId, ref: "user" },

    agency_nurse: {
      type: Boolean,
      default: false,
    },

    outlook_email:{
      type: String,
      default: null,
    },
    outlook_password:{
      type: String,
      default: null,
    },


    fax: {
      type: String,
      default: null,
    },

    validateLocation:{
      type:Boolean
    },
    usersLimit:{
      type:Number,

    },
    

    liveLocation:{
      lat:{type:Number},
      lang:{type:Number}
    }
    ,

    shiftData :[],

    shift: [
      {
        day: {
          type: String,
        },
        selected: {
          type: Boolean,
        },

        shiftTime: [
          {
            startTime: {
              type: String,
            },
            endTime: {
              type: String,
            },
            
          },
        ],
      },
    ],

    // createdAt: {
    //     type: Number
    // },
    // updatedAt: {
    //     type: String
    // }
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
