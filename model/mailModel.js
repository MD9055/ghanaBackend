const mongoose = require("mongoose");
const { object } = require("underscore");


const mailSchema = new mongoose.Schema(
{
    from_email: {
        type: String,
        
    },
    to_email: {
        type: String,
       
    },
    subject: {
        type: String,
        
    },
    mailBody: {
        type: String,
       
    },
    fromId: {
        type: mongoose.Types.ObjectId,
        
    },
    createdAt: {
        type: Date,
        
    },
    file: {
        type: Object,
      
      },
    cc_email:{
        type:String
    },
    isSent:{
        type:Boolean,
        // default:false
    }

})

const mail = mongoose.model("emailModel", mailSchema);

module.exports = mail;