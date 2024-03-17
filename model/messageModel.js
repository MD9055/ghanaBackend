const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const messageSchema = mongoose.Schema(
  {
    sender: { type: String, ref: "user" },
    senderName:{type: String},
    content: { type: String, trim: true },
    isImportant: { type: Boolean, default: false },
   
    isRead: {
      user: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chat",
        },
      ],
    },

    isReadFinal: {
      type: Boolean,
      default: false,
    },

    nursePasswordReset: {
      type: Boolean,
      default: false,
    },

    messageType: {
      type: String,
    },
    messageDate: {
      type: String,
    },

    attachments: [{ type: Object, path: String }],

    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    groupDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ content: "text" });
messageSchema.plugin(mongoosePaginate);
messageSchema.plugin(aggregatePaginate);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
