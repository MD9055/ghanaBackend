const mongoose = require("mongoose");
const chat = require("../model/chatModel");
const Message = require("../model/messageModel");
const users = require("../model/users");
const usersModel = require("../model/users");

const responses = require("../constant");
var ObjectId = require("mongodb").ObjectID;
var moment = require("moment");
const notification = require("../model/notification");
const { v4: uuidv4 } = require("uuid");
const VideoRooms = require("../model/videoRoom");
const videoRooms = require("../model/videoRoom");
const groupImage = "/public/users-image/user_group.png";
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;


const PDFDocument = require('pdfkit');
const fs = require('fs');

const {
  RtcTokenBuilder,
  RtmTokenBuilder,
  RtcRole,
  RtmRole,
} = require("agora-access-token");
const commonQuery = require("./commonQuery");
const {
  TrustProductsEntityAssignmentsPage,
} = require("twilio/lib/rest/trusthub/v1/trustProducts/trustProductsEntityAssignments");
let appIds = "7b4ccbc409024d08a7d553d595a9c77d";
let appCertificates = "ba95cc20b5cf4a679151f0504e9183bb";
let identity = uuidv4();

module.exports = {
  allMessages: allMessages,
  sendMessage: sendMessage,
  fetchChatsMobile: fetchChatsMobile,
  accessChatMobile: accessChatMobile,
  createGroupChatMobile: createGroupChatMobile,
  updateIsRead: updateIsRead,
  markAsRead: markAsRead,
  joinRoom: joinRoom,
  joinRoomAgora: joinRoomAgora,
  callUser: callUser,
  findRoom: findRoom,
  fetchRoomForCall,
  fetchRoomForCallAgora,
  renameGroupForMobile: renameGroupForMobile,
  globalSearch: globalSearch,
  participantInfo: participantInfo,
  muteAndUnmute: muteAndUnmute,
  getNotification: getNotification,
  saveNotification: saveNotification,
  updateNotificationById: updateNotificationById,
  getAllNotification: getAllNotification,
  markAllRead: markAllRead,
  deleteMessage: deleteMessage,
  deleteGroup: deleteGroup,
  allMessagesWeb: allMessagesWeb,
  unreadCount: unreadCount,
  rejoinStatus: rejoinStatus,
  removeMember: removeMember,
  memberAdd: memberAdd,
  deleteuser: deleteuser,
  allMessagesMobile: allMessagesMobile,
  fetchChatsMobileTest: fetchChatsMobileTest,
  chatFilter: chatFilter,
  allchatExport:allchatExport,
  renameGroupForimage:renameGroupForimage
};

/* Function to rename the group  */
async function renameGroupForMobile(name, chatId, image) {
  try {
    const updatedChat = await chat
      .findByIdAndUpdate(
        chatId,
        {
          groupDetails: {
            name: name,
            image: image,
          },
          chatName: name,
        },
        { new: true }
      )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return (response = {
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_NOT_FOUND,
      });
    } else {
      let response = {
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.UPDATE_SUCCESS,
        data: updatedChat,
      };
      return response;
    }
  } catch (error) {
    return (response = {
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

async function renameGroupForimage( name, chatId, image) {
  try {
    
    const updatedChat = await chat
    .findByIdAndUpdate(
      chatId,
      {
        groupDetails: {
          name: name,
          image: image,
        },
        chatName: name,
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return (response = {
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_NOT_FOUND,
      });
    } else {
      let response = {
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.UPDATE_SUCCESS,
        data: updatedChat,
      };
      return response;
    }
  } catch (error) {
    return (response = {
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* Function to delete the group */

async function deleteGroup(loginId, chatId) {
  try {
    deleteGroups = await chat.findOneAndUpdate(
      { _id: chatId },

      {
        $push: { deleteUser: loginId },
        $pull: { users: loginId },
        $set: { isDeleted: true },
      },
      { new: true }
    );

    if (deleteGroups) {
      return deleteGroups;
    }
  } catch (err) {
    throw err;
  }
}

/* Function to get all messages for the users */

async function resetChatNurse(finduserPasswordDate) {
  try {
    let time;
    let date = new Date();
    finduserPasswordDate.map((el) => {
      if (el.nursePasswordReset.length > 0) {
        let data = el.nursePasswordReset[el.nursePasswordReset.length - 1];

        if (data.createdTime != undefined) {
          time = data.createdTime;
        }
      }
    });
    return time;
  } catch (err) {
    throw err;
  }
}

async function allMessages(req, res) {
  try {
    let isMatched = true;
    let query;
    let dataChat = await chat.findOne({
      _id: req.query.chatId,
      type: req.query.chatType,
    });
    let loggedInUser = await chat.findOne({ "users[0]._id": req.user._id });

    if (!dataChat) {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_NOT_FOUND,
      });
    }
    if (req.user.role === responses.ADMIN_ROLE) {
      query = { chat: req.query.chatId };
    }
    if (dataChat) {
      dataChat.users.forEach(async (el) => {
        if (el._id.toString() == req.user._id) {
          isMatched = true;
        }
      });
    }

    if (!isMatched) {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_ID_MSG,
      });
    }

    if (!loggedInUser) {
      res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.ID_MSG,
      });
    }

    if (req.user.role === responses.NURSE_ROLE) {
      let finduserPasswordDate = await chat.find({
        users: { $in: req.user._id },
      });
      let passwordTime = await resetChatNurse(finduserPasswordDate);

      query = { chat: req.query.chatId };
    }
    if (req.user.role === responses.NURSINGHOME_ROLE) {
      isMatched = false;
    }
    if (req.user.role === responses.NURSINGHOME_ROLE) {
      query = { chat: req.query.chatId };
    }
    if (req.user.role === responses.PHYSICIAN_ROLE) {
      query = { chat: req.query.chatId };
    }

    if (req.query.filter) {
      query = { $text: { $search: req.query.filter } };
    }
    let limit = 15,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: req.query.type === "web" ? 1 : -1, //Sort by Date Added DESC
      },
      populate: [
        {
          path: "sender",
          select: "name image",
        },

        {
          path: "chat",
          populate: {
            path: "latestMessage",
            model: "Message",
          },
          populate: {
            path: "users",
            select: " name image",
            model: "user",
          },
        },
      ],
    };

    let newData1 = await Message.paginate(query, options);

    let ChatDATA = await (
      await chat.findOne({ _id: req.query.chatId })
    ).populate("users groupAdmin");

    let data = {
      AllData: newData1,
      groupedData: ChatDATA,
    };

    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: data,
    });
  } catch (error) {
    res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* Function for getting the chat conunt */

async function chatCount(senderId, type) {
  try {
    let data = await chat.aggregate([
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "chat",
          as: "chat",
        },
      },
      {
        $match: {
          type: type,
          users: mongoose.Types.ObjectId(senderId),
        },
      },
      { $unwind: "$chat" },
      {
        $match: {
          "chat.readBy": { $ne: mongoose.Types.ObjectId(senderId) },
        },
      },
      {
        $group: {
          _id: "$_id",

          count: { $sum: 1 },
        },
      },
    ]);

    return data;
  } catch (err) {
    throw err;
  }
}

/* Function to get channel listing */

async function fetchChatsMobile(senderId, type, page) {
  try {
    let chatCountData = await chatCount(senderId, type);

    let admin = await users.find({ _id: mongoose.Types.ObjectId(senderId) });
    let query = {};
    if (
      admin[0].role === responses.NURSE_ROLE ||
      admin[0].role === responses.PHYSICIAN_ROLE
    ) {
      query = {
        users: { $elemMatch: { $eq: mongoose.Types.ObjectId(senderId) } },
        type: type,
        isDeleted: false,
      };
    }
    if (
      admin[0].role == responses.NURSINGHOME_ROLE ||
      (admin[0].role == responses.ASSISTEDLIVING_ROLE &&
        admin[0].role !== responses.NURSE_ROLE)
    ) {
      query = {
        identificationID: senderId,

        type: type,
        isDeleted: false,
      };

    }



    if (admin[0].role == responses.ADMIN_ROLE) {

      query = {
        type: type,
        isDeleted: false,
      };

    }

    let orderBy = { createdAt: 1 }; //Sort by Date Added DESC};
    let limit = 100,
      page = 1;
    if (page) page = page;
    let options = {
      page: page,
      limit: limit,
      skip: limit * (page - 1),
      sort: orderBy,
    };

    let myAggregate = chat.aggregate();

    myAggregate._pipeline = [
      {
        $match: query,
      },

      { $addFields: { adminId: { $toString: "$groupAdmin" } } },
      {
        $lookup: {
          from: "users",

          localField: "adminId",
          foreignField: "_id",
          as: "groupAdmin",
        },
      },
      { $unwind: "$groupAdmin" },

      {
        $lookup: {
          from: "messages",
          localField: "latestMessage",
          foreignField: "_id",
          as: "latestMessage",
        },
      },


      {
        $unwind: {
          path: '$latestMessage',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          let: { article_Id: "$users" },
          pipeline: [
            { $addFields: { articleId: { $toObjectId: "$_id" } } },
            { $match: { $expr: { $in: ["$articleId", "$$article_Id"] } } },
          ],
          as: "users",
        },
      },

      {
        $lookup: {
          from: "users",
          let: { article_Id: "$deleteUser" },
          pipeline: [
            { $addFields: { articleId: { $toObjectId: "$_id" } } },
            { $match: { $expr: { $in: ["$articleId", "$$article_Id"] } } },
          ],
          as: "deleteUser",
        },
      },

      {
        $project: {
          type: 1,
          // senderInformation:"$senderInformation",
          isGroupChat: 1,
          groupDetails: 1,
          chatName: 1,
          createdAt: 1,
          updatedAt: 1,
          isDeleted: 1,
          latestMessage: {
            content: "$latestMessage.content",
            attachments: "$latestMessage.attachments",
            messageDate: "$latestMessage.messageDate",
            createdAt: "$latestMessage.createdAt",
            updatedAt: "$latestMessage.updatedAt",
            messageType: "$latestMessage.messageType",
          },
          "users.name": 1,
          "users.image": 1,
          "users._id": 1,
          "deleteUser.name": 1,
          "deleteUser.image": 1,
          "deleteUser._id": 1,
          groupAdmin: {
            name: "$groupAdmin.name",
            image: "$groupAdmin.image",
            _id: "$groupAdmin._id",
          },
        },
      },
    ];

    let data = await chat.aggregatePaginate(myAggregate, options)
    if (!data) {

      let response = {
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED,
      };
      return response
    } else {
      let newObj = {
        type: type,
        result: data,
        chatCount: chatCountData,
      };
      let response = {
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.CHAT_FETCHED_MSG,
        data: newObj,
      };

      
      return response

    }

  } catch (error) {
    throw error;
  }
}

/* Function to send message to the user */
async function sendMessage(
  chatId,
  content,
  senderid,
  attachments,
  isImportant,
  senderName
) {
  try {
    let curr = new Date();
    let newDate = curr.getDate();
    day = new Date(curr.setDate(newDate)).toISOString().slice(0, 10);

    let checkChat = await chat.findOne({ _id: chatId });

    if (!checkChat) {
    }
    if (!content) {
      console.log("Data Not available");
    }

    var newMessage = {
      sender: senderid,
      senderName:senderName,
      content: content,
      chat: chatId,
      attachments: attachments,
      isImportant: isImportant,
      readBy: senderid,
      messageType: checkChat.type,
      messageDate: moment(new Date()).format("MM/DD/YYYY"),
    };

    var message = await Message.create(newMessage);

    message = await message.populate("sender", "image");
    message = await message.populate("chat");

    message = await users.populate(message, {
      path: "chat.user",
      select: "name pic email",
    });

    await chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });
    return message;
  } catch (error) { }
}

/* Function to create chat with user */
async function accessChatMobile(senderId, user_id, type) {
  try {
    if (user_id) {
      var isChat = await chat
        .find({
          isGroupChat: false,
          type: type,
          isDeleted: false,

          $and: [
            {
              users: { $in: [senderId] },
            },
            {
              users: { $in: [user_id] },
            },
          ],
        })
        .populate("users", "-password")
        .populate("latestMessage");

      isChat = await users.populate(isChat, {
        path: "latestMessage.sender",
        select: "name, pic, email",
      });
      if (isChat.length > 0) {
        let chatExist = isChat[0];
        let response = {
          status: responses.SUCCESS,
          messageID: responses.SUCCESS_CODE,
          message: responses.CHAT_FETCHED_MSG,
          data: chatExist,
        };

        return response;
      } else {
        let nursingHomeId;
        let findNursingHomeId = await users.findOne({ _id: senderId });

        let findNursingHomeIdUser = await users.findOne({ _id: user_id });
        if (findNursingHomeIdUser.role == "nurse") {
          findNursingHomeIdUser.nursing_home_id.forEach((el) => {
            if (el._id != null) {
              nursingHomeId = el._id;
            }
          });
        }
        if (findNursingHomeId.role == "nurse") {
          findNursingHomeId.nursing_home_id.forEach((el) => {
            if (el._id != null) {
              nursingHomeId = el._id;
            }
          });
        }

        if (findNursingHomeId.role == 'nursing_home') {
          nursingHomeId = findNursingHomeId._id
        }

        if(findNursingHomeId.role == 'assisted_living'){
          nursingHomeId = findNursingHomeId._id
        }

        var chatData = {
          chatName: "sender",
          isGroupChat: false,
          users: [senderId, user_id],
          nursePasswordReset: [
            {
              status: false,
              createdTime: new Date().getTime(),
            },
          ],
          type: type,
          identificationID: nursingHomeId ? nursingHomeId : "",
          groupAdmin: senderId,
          createdBy: senderId
        };

        const createdChat = await chat.create(chatData);

        const fullChat = await chat
          .findOne({ _id: createdChat._id })
          .populate("users", "-password");
        let response = {
          status: responses.SUCCESS,
          messageID: responses.SUCCESS_CODE,
          message: responses.CHAT_FETCHED_MSG,
          data: fullChat,
        };
        return response;
      }
    }
  } catch (err) {
    let response = {
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    };
    return response;
  }
}

/* Function to create group chat room */

async function createGroupChatMobile(user, name, senderId, groupName) {
  try {
    if (!name) {
      let response = {
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.REQUIRED_MSG,
      };
      return response;
    }

    var users = [];

    users = user;
    // let nursingHomeIds = [];
    // user.forEach(async(el)=>{

    //   let getData = await usersModel.findOne({_id:mongoose.Types.ObjectId(el)})
    //   if(getData.role === "nurse"){

    //     getData.nursing_home_id.forEach((check)=>{

    //       nursingHomeIds.push(check._id)
    //       console.log(nursingHomeIds, "nursingHomeIds")
    //     })

    //   }

    // })
    // console.log(nursingHomeIds, "nursingHomeId")
    // return false

    if (users.length < 2) {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.MEMBER_MSG,
      });
    }

    users.push(senderId);

    const groupChat = await chat.create({
      chatName: name,
      users: users,
      isGroupChat: true,
      groupAdmin: senderId,
      groupDetails: {
        name: groupName,
        image: groupImage,
      },
      identificationID: senderId,
      type: "chat",
      nursePasswordReset: [
        {
          status: false,
          createdTime: new Date().getTime(),
        },
      ],
    });

    const fullGroupChat = await chat
      .findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    let response = {
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.GROUP_CREATED,
      data: fullGroupChat,
    }; // res.status(200).json(fullGroupChat);

    return response;
  } catch (err) {
    let response = {
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    };
    return response;
  }
}

/* Function to update read and unread messages */

async function updateIsRead(roomId, senderId) {
  try {
    let updateIsreadData = await Message.updateMany(
      { isReadMessage: false, sender: senderId, chat: roomId },
      { $set: { isReadMessage: true } },
      { multi: true }
    );
    if (updateIsreadData) {
      return updateIsreadData;
    }
  } catch (error) { }
}

/* Function to mark read messages */
async function markAsRead(chatId, loggedInUserId, type) {
  try {
    let findMessage = await Message.find({
      chat: chatId.toString(),
    });
    let data = await Message.find({
      chat: chatId.toString(),
      readBy: { $nin: loggedInUserId },
    });

    data.forEach(async (el) => {
      let data1 = await Message.findByIdAndUpdate(
        el._id.toString(),
        { $push: { readBy: ObjectId(loggedInUserId) } },
        { new: true }
      );
    });

    let updateMarkedMessage = await Message.updateMany(
      { chat: mongoose.Types.ObjectId(chatId) },
      { $set: { isImportant: false } },
      { new: true }
    );
    let checkNotification = await notification.updateMany(
      { "additionalData.typeId": chatId.toString(), receiver: loggedInUserId },
      {
        $set: {
          readBy: {
            readerId: loggedInUserId,
            read_at: Date.now(),
          },
        },
        isClicked: true,
      },
      { new: true }
    );
  } catch (err) {
    throw err;
  }
}

/* Twilio function for calling fearures */

const twilioClient = require("twilio")(
  process.env.TWILIO_API_KEY_SID,
  process.env.TWILIO_API_KEY_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

/* Function to generate the access token */

const getAccessToken = (roomName) => {
  let identity = uuidv4();
  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET
  );
  token.identity = String(identity);

  const videoGrant = new VideoGrant({
    room: roomName,
  });

  token.addGrant(videoGrant);
  let data = {
    token: token.toJwt(),
    tokenIdentity: token.identity,
  };
  return data;
};

/*  Function to join the room dusing the call */
async function joinRoom(roomNamedata, data, type, chatId, callerId, uniqueId) {
  try {
    if (!roomNamedata) {
      // return res.status(200).send("Must include roomName argument.");
    }
    const roomName = roomNamedata;

    findOrCreateRoom(roomName, type, chatId, callerId, uniqueId);
  } catch (err) {
    throw err;
  }
}

/* function to join the calling room using Agora Api */

async function joinRoomAgora(
  roomNamedata,
  data,
  type,
  chatId,
  callerId,
  uniqueId
) {
  try {
    if (!roomNamedata) {
      // return res.status(200).send("Must include roomName argument.");
    }
    const roomName = roomNamedata;

    findOrCreateRoomAgora(roomName, type, chatId, callerId, uniqueId);
  } catch (err) {
    throw err;
  }
}

/* Function to create the call or generate the call */

async function callUser(senderId, chatId) {
  try {
    let data = await chat.find({ _id: mongoose.Types.ObjectId(chatId) });
    let newArray = [];
    let check = data.map((e1) => {
      e1.users.map((e2) => {
        if (e2 != senderId) {
          newArray.push(e2._id);
        }
      });
    });

    return newArray;
  } catch (err) {
    throw err;
  }
}

/* Function to create the room for call */

const findOrCreateRoom = async (roomName, type, chatId, callerId, uniqueId) => {
  try {
    if (type === "video") {
      let saveVideo = new VideoRooms({
        roomName: roomName,
        status: "InProgress",
        chatId: chatId,
        callerId: callerId,
        callType: type,
      });

      let save = await saveVideo.save();
    }

    if (type === "audio") {
      let saveVideo = new VideoRooms({
        roomName: roomName,
        status: "InProgress",
        chatId: chatId,
        callerId: callerId,
        callType: type,
      });

      let save = await saveVideo.save();
    }
  } catch (err) {
    throw err;
  }
};

/* Function to generate the token for call - (Agora) */

async function agoraTokenGenerator(roomName, uniqueId) {
  try {
    const appId = appIds;
    const appCertificate = appCertificates;
    const channelName = roomName;
    const uid = uniqueId;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    // Build token with uid
    const tokenA = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    let tokenObj = {
      uid: uid,
      token: tokenA,
    };

    return tokenObj;
  } catch (err) {
    throw err;
  }
}

/* Function to find or join the room for calling  */

async function findRoom(roomNamedata) {
  try {
    if (!roomNamedata) {
      // return res.status(200).send("Must include roomName argument.");
    }
    const roomName = roomNamedata;

    let token = await agoraTokenGenerator(roomName);

    // const token = getAccessToken(roomName);

    return token;
  } catch (err) {
    throw err;
  }
}

async function agoraTokenGenerator(roomName, uniqueId) {
  try {
    const appId = appIds;
    const appCertificate = appCertificates;
    const channelName = roomName;
    const uid = uniqueId;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    // Build token with uid
    const tokenA = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    let tokenObj = {
      uid: uid,
      token: tokenA,
    };

    return tokenObj;
  } catch (err) {
    throw err;
  }
}

/* Function to fetch room to join the call (Agora) */

async function fetchRoomForCallAgora(req, res) {
  try {
    let checkavailableUser = await videoRooms.findOne({
      roomName: req.body.roomName,
    });
    if (checkavailableUser.participants) {
      checkavailableUser.participants.forEach((el) => {
        if (el.userId.toString() == req.user._id) {
          return res.json({
            status: responses.ERROR,
            messageID: responses.ERROR_CODE,
            message: "Duplicate Identity",
          });
        }
      });
    }
    const roomName = req.body.roomName;
    const uniqueId = req.body.uid;
    if (!roomName) {
      return res.status(200).json("Must include roomName argument.");
    }
    const genetateIdentity = uuidv4();

    let token = await agoraTokenGenerator(roomName, uniqueId);

    const data = await getAccessToken(roomName);

    if (req.body.loggedInUserId) {
      let dataPass = {
        userId: req.body.loggedInUserId,
        userIdentity: uniqueId,
      };
      let updateData = await videoRooms.findOneAndUpdate(
        { roomName: roomName },
        { $push: { participants: dataPass } },
        { new: true }
      );
    }

    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: "Token Generated",
      data: token,
    });
  } catch (e) {
    throw e;
  }
}

async function fetchRoomForCall(req, res) {
  try {
    let checkavailableUser = await videoRooms.findOne({
      roomName: req.body.roomName,
    });
    if (checkavailableUser.participants) {
      checkavailableUser.participants.forEach((el) => {
        if (el.userId.toString() == req.user._id) {
          return res.json({
            status: responses.ERROR,
            messageID: responses.ERROR_CODE,
            message: "Duplicate Identity",
          });
        }
      });
    }
    const roomName = req.body.roomName;
    const uniqueId = req.body.uid;
    if (!roomName) {
      return res.status(200).json("Must include roomName argument.");
    }
    const genetateIdentity = uuidv4();

    let token = await agoraTokenGenerator(roomName, uniqueId);

    const data = await getAccessToken(roomName);

    if (req.body.loggedInUserId) {
      let dataPass = {
        userId: req.body.loggedInUserId,
        userIdentity: uniqueId,
      };
      let updateData = await videoRooms.findOneAndUpdate(
        { roomName: roomName },
        { $push: { participants: dataPass } },
        { new: true }
      );
    }

    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: "Token Generated",
      data: token,
    });
  } catch (e) {
    throw e;
  }
}

/* Function to search information globally for chat  */
async function globalSearch(req, res) {
  try {
    // let findChat = await chat.find({});
    let chatDetails = await chat.aggregate([
      {
        $match: {
          users: { $in: [mongoose.Types.ObjectId(req.user._id)] },
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "chat",
          as: "chat",
        },
      },

      { $unwind: "$chat" },

      {
        $lookup: {
          from: "users",
          localField: "chat.sender",
          foreignField: "_id",
          as: "chat.sender",
        },
      },
      { $unwind: "$chat.sender" },

      {
        $match: {
          "chat.content": { $regex: req.query.filter },
        },
      },

      {
        $project: {
          chat: 1,
          name: "$chat.sender.name",
          image: "$chat.sender.image",
          createdAt: "$chat.sender.createdAt",
        },
      },
    ]);

    /*  data = findChat.map(async (el) => {
      
      if (req.query.filter) {
        query = {
          $text: { $search: req.query.filter },
          chat: el._id.toString(),
        };
      }

      let limit = 100,
        page = 1;

      if (req.query.page) page = req.query.page;

      let options = {
        page,
        limit: limit,
        skip: limit * page,
        sort: {
          createdAt: req.query.type === "web" ? 1 : -1, //Sort by Date Added DESC
        },
        populate: [
          {
            path: "sender",
            select: "name image",
          },

          {
            path: "chat",
            select: "name",
          },
        ],
      };

      let responess = await Message.paginate(query, options);
      
      return responess
    });  */

    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: chatDetails,
    });
  } catch (e) {

    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* Function to retreive the participant info during the call */

async function participantInfo(req, res) {
  try {
    let getData = await videoRooms
      .findOne({
        roomName: req.query.roomName,
        participants: {
          $elemMatch: { userIdentity: req.query.identtity },
        },
      })
      .populate("participants.userId", "name image");
    if (getData.participants) {
      setTimeout(() => {
        getData.participants.forEach(async (ele) => {
          let audioFlag;
          let videoFlag;
          if (ele.userIdentity == req.query.identtity) {
            let findUser = await users.findById(ele.userId._id);
            let eventData = await videoRooms.findOne({
              roomName: req.query.roomName,
            });
            eventData.participants.forEach((element) => {
              if (element.userId == ele.userId._id) {
                audioFlag = element.isAudioMuted;
                videoFlag = element.isVideoMuted;
              }
            });

            let finalResponse = {
              participantName: findUser.name,
              userId: findUser._id,
              Identity: req.query.identtity,
              image: findUser.image,
              isAudioMute: audioFlag,
              isVideoMute: videoFlag,
            };
            return res.jsonp({
              status: responses.SUCCESS,
              messageID: responses.SUCCESS_CODE,
              message: responses.FETCH_SUCCESS,
              data: finalResponse,
            });
          }
        });
      }, 2000);
    } else {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED,
      });
    }
  } catch (e) {
    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* Function to make the participant mute and unmute */

async function muteAndUnmute(roomName, userId, isAudioMuted, isVideoMuted) {
  try {
    let updateRoom = await videoRooms.findOne({ roomName: roomName });
    let identity;
    updateRoom.participants.forEach(async (el) => {
      if (userId == el.userId.toString()) {
        identity = el.userIdentity;
        let check = await videoRooms.findOneAndUpdate(
          { "participants.userId": el.userId },
          {
            $set: {
              "participants.$.isAudioMuted": isAudioMuted,
              "participants.$.isVideoMuted": isVideoMuted,
            },
          },
          { new: true }
        );
      }
    });

    let obj = {
      data: updateRoom,
      userIdentity: identity,
    };
    return obj;
  } catch (err) {
    throw err;
  }
}
/* function to retreive the notification */

async function getNotification(req, res) {
  try {
    let query = {
      isClicked: false,
      receiver: req.user._id,
    };
    let limit = 10,
      page = 1;
    if (req.query.page) page = req.query.page;
    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: { createdAt: -1 },
      populate: [
        {
          path: "sender",
          select: "name image",
        },
      ],
    };
    getreceiverInfo = await usersModel.findOne({ _id: req.user._id });
    let receiverInfo = {
      name: getreceiverInfo.name,
      id: getreceiverInfo._id,
      image: getreceiverInfo.image,
    };

    let newData1 = await notification.paginate(query, options);
    let unreadNotificationCount = newData1.docs.length;

    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: {
        notificationData: newData1,
        unreadCount: unreadNotificationCount,
        receiverInfo: receiverInfo,
      },
    });
  } catch (err) {
    throw err;
  }
}

/* function to get all the notification for the chat */

async function getAllNotification(req, res) {
  try {
    let query = {
      isClicked: false,
      receiver: req.user._id,
    };
    let allNotification = await notification
      .find(query)
      .populate("sender", "name image");
    let getCount = allNotification.length;
    if (allNotification.length > 0) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: {
          notificationData: allNotification,
          unreadCount: getCount,
        },
      });
    } else {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED,
      });
    }
  } catch (err) {
    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

/* Function to save the notification in Database */

async function saveNotification(chatId, senderId) {
  try {
    let messageContent;
    let getRecieverid = await chat.findOne({
      _id: mongoose.Types.ObjectId(chatId),
    });

    let receiverId;
    getRecieverid.users.forEach((el) => {
      if (el._id.toString() != senderId) {
        receiverId = el._id;
      }
    });
    let getUserData = await users.findOne({ _id: senderId });

    if (getRecieverid.isGroupChat) {
      messageContent = `New Message Received in group ${getRecieverid.chatName} from ${getUserData.name}`;
    }
    if (!getRecieverid.isGroupChat) {
      messageContent = `New Message Received from ${getUserData.name}`;
    }

    let createNotificationObj = new notification({
      sender: senderId,
      receiver: receiverId,
      message: messageContent,
      additionalData: {
        type: getRecieverid.type,
        typeId: getRecieverid._id,
      },
    });

    let saveNotification = await notification.create(createNotificationObj);

    return saveNotification;
  } catch (err) {
    throw err;
  }
}

/* Function to update the notification by ID */

async function updateNotificationById(req, res) {
  try {
    let updateNotification = await notification.findOneAndUpdate(
      { _id: req.body._id },
      {
        $set: {
          isClicked: true,
          read_by: { readerId: req.user._id, read_at: Date.now() },
        },
      },
      { new: true }
    );
    if (updateNotification) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: updateNotification,
      });
    } else {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.DATA_FAILED,
      });
    }
  } catch (error) {
    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
      error: error,
    });
  }
}

/* Function to make the message mark all read */

async function markAllRead(req, res) {
  try {
    let markRead = await notification.updateMany(
      { receiver: mongoose.Types.ObjectId(req.user._id) },
      {
        $push: {
          read_by: {
            readerId: req.user._id,
          },
        },
        $set: { isClicked: true },
      },

      { new: true }
    );

    if (markRead) {
      return res.json({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        // data: updateNotification,
      });
    }
  } catch (err) {
    return res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
      error: err,
    });
  }
}

/* Function to delete the message by ID */
async function deleteMessage(id) {
  try {
    let condition = {
      _id: id,
    };
    let dataToUpdate = {
      isDeleted: true,
    };
    deleteMessage = await commonQuery.updateOne(
      Message,
      condition,
      dataToUpdate
    );
    if (deleteMessage) {
      let message;
      if (deleteMessage.acknowledged == true) {
        message = "Message Deleted Successfully";
      }
      let resObj = {
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        UpdateStatus: {
          message: message,
          MessageId: id,
        },
      };
      return resObj;
    }
  } catch (err) {
    throw err;
  }
}

/* function to remove the chat if nurse password got reset */

async function allMessagesWeb(req, res) {
  try {
    let isMatched = true;
    let query;
    let dataChat = await chat.findOne({
      _id: req.query.chatId,
      type: req.query.chatType,
    });
    let loggedInUser = await chat.findOne({ "users[0]._id": req.user._id });

    if (!dataChat) {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_NOT_FOUND,
      });
    }
    if (req.user.role === responses.ADMIN_ROLE) {
      query = { chat: req.query.chatId };
    }
    if (dataChat) {
      dataChat.users.forEach(async (el) => {
        if (el._id.toString() == req.user._id) {
          isMatched = true;
        }
      });
    }

    if (!isMatched) {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_ID_MSG,
      });
    }

    if (!loggedInUser) {
      res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.ID_MSG,
      });
    }

    if (req.user.role === responses.NURSE_ROLE) {
      let finduserPasswordDate = await chat.find({
        users: { $in: req.user._id },
      });
      let passwordTime = await resetChatNurseWeb(finduserPasswordDate);
      query = { chat: req.query.chatId, createdAt: { $gte: passwordTime } };
    }
    if (req.user.role === responses.NURSINGHOME_ROLE) {
      isMatched = false;
    }
    if (req.user.role === responses.NURSINGHOME_ROLE) {
      query = { chat: req.query.chatId };
    }
    if (req.user.role === responses.ASSISTEDLIVING_ROLE) {
      query = { chat: req.query.chatId };
    }
    if (req.user.role === responses.PHYSICIAN_ROLE) {
      query = { chat: req.query.chatId };
    }

    if (req.query.filter) {
      query = { $text: { $search: req.query.filter } };
    }
    let limit = 500,
      page = 1;

    if (req.query.page) page = req.query.page;

    let options = {
      page,
      limit: limit,
      skip: limit * page,
      sort: {
        createdAt: req.query.type === "web" ? 1 : -1, //Sort by Date Added DESC
      },
      populate: [
        {
          path: "sender",
          select: "name image",
        },

        {
          path: "chat",
          populate: {
            path: "latestMessage",
            model: "Message",
          },
          populate: {
            path: "users",
            select: " name image",
            model: "user",
          },
        },
      ],
    };

    let newData1 = await Message.paginate(query, options);

    let ChatDATA = await (
      await chat.findOne({ _id: req.query.chatId })
    ).populate("users groupAdmin");

    let data = {
      AllData: newData1,
      groupedData: ChatDATA,
    };

    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: data,
    });
  } catch (error) {
    res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

async function resetChatNurseWeb(finduserPasswordDate) {
  try {
    let time;
    let date = new Date();
    finduserPasswordDate.map((el) => {
      if (el.nursePasswordReset.length > 0) {
        let data = el.nursePasswordReset[el.nursePasswordReset.length - 1];
        if (data.createdTime != undefined) {
          time = data.createdTime ? data.createdTime : "";
        }
      }
    });
    return time;
  } catch (err) {
    throw err;
  }
}

async function unreadCount(req, res) {
  try {
    let query = {
      isClicked: false,
      receiver: req.user._id,
    };

    let newData1 = await notification.find(query).count();

    return res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: {
        unreadCount: newData1,
      },
    });
  } catch (err) {
    throw err;
  }
}

async function rejoinStatus(req, res) {
  try {
    let getInfo = await videoRooms
      .find({ chatId: req.body.chatId })
      .sort({ _id: -1 })
      .limit(1);
    if (getInfo[0].participants.length == 0) {
      let updateStatus = await videoRooms.findOneAndUpdate({ roomName: getInfo[0].roomName }, { $set: { status: "Completed" } }, { new: true })
      return res.status(200).json({
        message: "Call has been completed",
        data: {
          roomCallStatus: updateStatus.status,
          roomName: updateStatus.roomName,
          callType: updateStatus.callType

        },
      });
    }

    let data = getInfo[0].participants.filter((el) => {

      return el.userId == req.user._id;
    });



    if (getInfo[0].status != "Completed" && data.length == 0) {
      res.status(200).json({
        message: "User can join the call again",
        data: {
          roomCallStatus: getInfo[0].status,
          roomName: getInfo[0].roomName,
          callType: getInfo[0].callType
        },
      });
    }
    if (getInfo[0].status == "Completed") {
      res.status(200).json({
        message: "Call has been completed",
        data: {
          roomCallStatus: getInfo[0].status,
          roomName: getInfo[0].roomName,
          callType: getInfo[0].callType

        },
      });
    }
    if (getInfo[0].status != "Completed" && data.length > 1) {
      res.status(200).json({
        message: "Call is In-progress",
        data: {
          roomCallStatus: getInfo[0].status,
          roomName: getInfo[0].roomName,
          callType: getInfo[0].callType

        },
      });
    }
  } catch (err) {
    throw err;
  }
}

async function removeMember(id, chatID) {
  try {
    let removeUser = await chat.findOneAndUpdate(
      { _id: chatID },
      {
        $pull: {
          users: mongoose.Types.ObjectId(id),
        },
      },
      { new: true }
    );

    let ChatDATA = await (
      await chat.findOne({ _id: chatID })
    ).populate("users groupAdmin");

    let data = {
      groupedData: ChatDATA,
    };

    return data;
  } catch (e) {
    throw e;
  }
}

async function memberAdd(data) {
  try {
    let addMemberInGroup = await chat.findOneAndUpdate(
      { _id: data.chatId },
      { $push: { users: data.user } },
      { new: true }
    );

    const fullGroupChat = await chat
      .findOne({ _id: addMemberInGroup._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    let response = {
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.GROUP_UPDATED,
      data: fullGroupChat,
    };
    return response;
  } catch (err) {
    throw err;
  }
}

async function deleteuser(data) {
  let loggedInID = data.loggedInId;
  let roomID = data.roomName;

  let removeUser = await videoRooms.findOneAndUpdate(
    { roomName: data.roomName },
    {
      $pull: {
        participants: { userId: mongoose.Types.ObjectId(data.loggedInId) },
      },
    },
    { $set: { status: "Complete" } },
    { safe: true },
    { new: true }
  );

  return removeUser;
}

async function allMessagesMobile(req, res) {
  try {
    let dataChat = await chat.findOne({
      _id: req.query.chatId,
      type: req.query.chatType,
    });
    let loggedInUser = await chat.findOne({ "users[0]._id": req.user._id });

    if (!dataChat) {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_NOT_FOUND,
      });
    }

    let isMatched = true;
    let query = { chat: mongoose.Types.ObjectId(req.query.chatId) };

    if (req.user.role === responses.ADMIN_ROLE) {
      query = { chat: mongoose.Types.ObjectId(req.query.chatId) };
    }
    if (dataChat) {
      dataChat.users.forEach(async (el) => {
        if (el._id.toString() == req.user._id) {
          isMatched = true;
        }
      });
    }

    if (!isMatched) {
      return res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.CHAT_ID_MSG,
      });
    }

    if (!loggedInUser) {
      res.json({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.ID_MSG,
      });
    }

    if (req.user.role === responses.NURSE_ROLE) {
      // let finduserPasswordDate = await chat.find({
      //   users: { $in: req.user._id },
      // });
      // let passwordTime = await resetChatNurse(finduserPasswordDate);

      query = { chat: mongoose.Types.ObjectId(req.query.chatId) };
    }
    if (req.user.role === responses.NURSINGHOME_ROLE) {
      isMatched = false;
    }
    if (req.user.role === responses.NURSINGHOME_ROLE) {
      query = { chat: mongoose.Types.ObjectId(req.query.chatId) };
    }
    if (req.user.role === responses.PHYSICIAN_ROLE) {
      query = { chat: mongoose.Types.ObjectId(req.query.chatId) };
    }

    if (req.query.filter) {
      query = { $text: { $search: req.query.filter } };
    }
    let filter = "";
    let orderBy = { createdAt: -1 }; //Sort by Date Added DESC};
    let limit = 10,
      page = 1;
    if (req.query.page) page = Number(req.query.page);
    let options = {
      page: page,
      limit: limit,
      skip: limit * (page - 1),
      sort: orderBy,
    };

    let myAggregate = Message.aggregate();
    myAggregate._pipeline = [
      {
        $match: query,
      },

      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "senderInformation",
        },
      },

      {
        $lookup: {
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chat",
        },
      },
      { $unwind: "$chat" },

      {
        $lookup: {
          from: "messages",
          localField: "chat.latestMessage",
          foreignField: "_id",
          as: "chat.latestMessage",
        },
      },

      { $addFields: { adminId: { $toString: "$chat.groupAdmin" } } },
      {
        $lookup: {
          from: "users",

          localField: "adminId",
          foreignField: "_id",
          as: "chat.groupAdmin",
        },
      },
      { $unwind: "$chat.groupAdmin" },

      { $unwind: "$senderInformation" },

      {
        $project: {
          users: {
            $map: {
              input: "$chat.users",
              as: "usersID",
              in: {
                $convert: {
                  input: "$$usersID",
                  to: "string",
                },
              },
            },
          },

          latestMessage: 1,
          sender: {
            _id: "$senderInformation._id",
            name: "$senderInformation.name",
            image: "$senderInformation.image",
          },
          attachments: 1,
          isImportant: 1,
          messageType: 1,
          messageDate: 1,
          isDeleted: 1,
          chat: "$chat._id",
          createdAt: 1,
          content: 1,
          groupDetails: "$chat.groupDetails",
          groupAdmin: {
            _id: "$chat.groupAdmin._id",
            name: "$chat.groupAdmin.name",
            image: "$chat.groupAdmin.image",
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },

      {
        $project: {
          latestMessage: 1,
          latestMessage: 1,
          sender: 1,
          attachments: 1,
          isImportant: 1,
          messageType: 1,
          messageDate: 1,
          isDeleted: 1,
          chat: 1,
          createdAt: 1,
          content: 1,
          readBy: 1,
          groupDetails: 1,
          groupAdmin: 1,
          "users.name": 1,
          "users.image": 1,
          "users._id": 1,
        },
      },

      /* {
        $project:{
          sender:{
            _id:"$senderInformation._id",
            name:"$senderInformation.name",
            image:"$senderInformation.image"
          },
          attachments:1,
          isImportant:1,
          messageType:1,
          messageDate:1,
          isDeleted:1,
          chat:"$chat._id",
          createdAt:1,
          content:1,
          groupDetails:"$chat.groupDetails",
          groupAdmin:{
            _id:"$chat.groupAdmin._id",
            name:"$chat.groupAdmin.name",
            image:"$chat.groupAdmin.image"
          }


        }
      } */
    ];
    Message.aggregatePaginate(myAggregate, options, async (err, result) => {
      if (err) {

        res.json({
          status: responses.ERROR,
          messageID: responses.ERROR_CODE,
          message: responses.DATA_FAILED,
        });
      } else {
        // let ChatDATA = await (
        //   await chat.findOne({ _id: req.query.chatId},{users:1,groupAdmin:1, isGroupChat:1 })
        // ).populate("users groupAdmin","name image")

        let data = {
          AllData: result,
          // groupedData: ChatDATA,
        };

        return res.json({
          status: responses.SUCCESS,
          messageID: responses.SUCCESS_CODE,
          message: responses.FETCH_SUCCESS,
          data: data,
        });
      }
    });
  } catch (error) {
    res.json({
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.DATA_FAILED,
    });
  }
}

async function fetchChatsMobileTest(req, res) {
  try {
    let type = "chat";

    let chatCountData = await chatCount(req.user._id, type);

    let admin = await users.find({
      _id: mongoose.Types.ObjectId(req.user._id),
    });

    let query = {};
    if (
      admin[0].role === responses.NURSE_ROLE ||
      admin[0].role === responses.PHYSICIAN_ROLE
    ) {

      query = {
        users: { $elemMatch: { $eq: mongoose.Types.ObjectId(req.user._id) } },
        type: type,
        isDeleted: false,
      };
    }
    if (
      admin[0].role == responses.NURSINGHOME_ROLE ||
      (admin[0].role == responses.ASSISTEDLIVING_ROLE &&
        admin[0].role !== responses.NURSE_ROLE)
    ) {
      query = {
        identificationID: mongoose.Types.ObjectId(req.user._id),
        type: type,
        isDeleted: false,
      };
    }

    if (admin[0].role == responses.ADMIN_ROLE) {
      let channelList = await chat
        .find({ type: type })
        .populate("users", "_id name image");
      let response = {
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.CHAT_FETCHED_MSG,
        data: {
          type: type,
          result: channelList,
          chatCount: chatCountData,
        },
      };
      return response;
    }

    let orderBy = { createdAt: 1 }; //Sort by Date Added DESC};
    let limit = 10,
      page = 1;
    if (req.query.page) page = Number(req.query.page);
    let options = {
      page: page,
      limit: limit,
      skip: limit * (page - 1),
      sort: orderBy,
    };

    let myAggregate = chat.aggregate();

    myAggregate._pipeline = [
      {
        $match: query,
      },

      { $addFields: { adminId: { $toString: "$groupAdmin" } } },
      {
        $lookup: {
          from: "users",

          localField: "adminId",
          foreignField: "_id",
          as: "groupAdmin",
        },
      },
      { $unwind: "$groupAdmin" },

      {
        $lookup: {
          from: "messages",
          localField: "latestMessage",
          foreignField: "_id",
          as: "latestMessage",
        },
      },
      { $unwind: "$latestMessage" },

      {
        $lookup: {
          from: "users",
          let: { article_Id: "$users" },
          pipeline: [
            { $addFields: { articleId: { $toObjectId: "$_id" } } },
            { $match: { $expr: { $in: ["$articleId", "$$article_Id"] } } },
          ],
          as: "users",
        },
      },

      {
        $lookup: {
          from: "users",
          let: { article_Id: "$deleteUser" },
          pipeline: [
            { $addFields: { articleId: { $toObjectId: "$_id" } } },
            { $match: { $expr: { $in: ["$articleId", "$$article_Id"] } } },
          ],
          as: "deleteUser",
        },
      },

      {
        $project: {
          type: 1,
          // senderInformation:"$senderInformation",
          isGroupChat: 1,
          chatName: 1,
          createdAt: 1,
          updatedAt: 1,
          isDeleted: 1,
          latestMessage: {
            content: "$latestMessage.content?$latestMessage.content:''",
            attachments: "$latestMessage.attachments",
            messageDate: "$latestMessage.messageDate",
            createdAt: "$latestMessage.createdAt",
            updatedAt: "$latestMessage.updatedAt",
            messageType: "$latestMessage.messageType",
          },
          "users.name": 1,
          "users.image": 1,
          "users._id": 1,
          "deleteUser.name": 1,
          "deleteUser.image": 1,
          "deleteUser._id": 1,
          groupAdmin: {
            name: "$groupAdmin.name",
            image: "$groupAdmin.image",
            _id: "$groupAdmin._id",
          },
        },
      },
    ];

    chat.aggregatePaginate(myAggregate, options, async (err, result) => {
      if (err) {

        res.json({
          status: responses.ERROR,
          messageID: responses.ERROR_CODE,
          message: responses.DATA_FAILED,
        });
      } else {
        let newObj = {
          type: type,
          result: result,
          chatCount: chatCountData,
        };
        return res.status(200).json({
          status: "success",
          messageID: responses.SUCCESS_CODE,
          message: responses.CHAT_FETCHED_MSG,
          data: newObj,
        });
      }
    });
  } catch (error) {
    throw error;
  }
}

async function chatFilter(req, res) {
const {chatId,startDate,endDate}=req.query;

 var fromDate=moment(startDate).format("MM/DD/YYYY");
 var toDate=moment(endDate).format("MM/DD/YYYY");
 
  let messageInfo = await Message.find({ chat:chatId,messageDate:{ $gte: fromDate ,$lte: toDate } });
  if (messageInfo) {
    return res.json({
      status: "success",
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: messageInfo,
    });
  } else {
    res.status(201).json({
      status: "failure",
      messageID: 201,
      message: responses.NO_RECORDS_FOUND,
    });
  }
}

async function allchatExport(req, res) {
  const {chatId}=req.query;
   
    let messageInfo = await Message.find({ chat:chatId });
    if (messageInfo) {
      return res.json({
        status: "success",
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: messageInfo,
      });
    } else {
      res.status(201).json({
        status: "failure",
        messageID: 201,
        message: responses.NO_RECORDS_FOUND,
      });
    }
  }
