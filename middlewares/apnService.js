var apn = require("apn");
const path = require("path");
const users = require("../model/users");
const Chat = require("../model/chatModel");
const mongoose = require("mongoose");
const notification = require("../model/notification");
const { type } = require("os");

async function apnServiceiOS(
  message,
  token,
  senderName,
  chatId,
  type,
  receiverId,
  senderId,
  senderImage,
  callerData,
  calltype,
  voipToken,
  callerNameinfo
) {
  try {
    let senderNameInfo;

    let groupInfo = await Chat.findOne({ _id: chatId });

    if (groupInfo.isGroupChat) {
      senderNameInfo = groupInfo.chatName;
    }
    if (!groupInfo.isGroupChat) {
      senderNameInfo = senderName;
    }

    let getCount = await countData(receiverId);
    let getReceiverData = await users.findOne({ _id: receiverId });
    let receiverInfo = {
      name: getReceiverData.name,
      id: getReceiverData._id,
      image: getReceiverData.image,
    };
    let senderInfo = {
      senderName: senderName,
      senderId: senderId,
      senderImage: senderImage,
    };

    let PayloadData;

    if (type == "audio") {
      PayloadData = {
        chatId: chatId,
        type: type,
        receiverInfo: receiverInfo,
        senderInfo: senderInfo,
        callerInfo: callerData,
        name: callerData.data.userData.name,
      };
    }

    if (type == "video") {
      PayloadData = {
        chatId: chatId,
        type: type,
        receiverInfo: receiverInfo,
        senderInfo: senderInfo,
        callerInfo: callerData,
        name: callerData.data.userData.name,
        hasVideo: true,
      };
    }

    const info = path.resolve(__dirname, "../pushcert.pem");
    var deviceToken = voipToken;

    var service = new apn.Provider({
      cert: info,
      key: info,
    });
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 560; // Expires 1 minute from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = `Call From ${senderName}`;
    note.payload = { messageFrom: senderName, data: PayloadData };

    note.topic = "com.docnock.voip";
    note.priority = 10;
    note.pushType = "background";
    service.send(note, deviceToken).then((err, result) => {
      if (err) {
        return console.log(JSON.stringify(err));
      } else {
        return console.log(JSON.stringify(result));
      }
    });
  } catch (err) {
    throw err;
  }
}

async function countData(receiverId) {
  let query = {
    isClicked: false,
    receiver: receiverId,
  };

  let newData = await notification.find(query).count();

  return newData;
}

async function apnServiceiOSMissedCall(
  content,
  pushToken,
  receiverName,
  chatId,
  calltype,
  receiverVOIPToken,
  callerName
) {
  try {
    let payload = {
      chatId: chatId,
      type: calltype,
      receiverName: receiverName,
    };

    const info = path.resolve(__dirname, "../pushcert.pem");
    var deviceToken = receiverVOIPToken;
    var service = new apn.Provider({
      cert: info,
      key: info,
    });
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 560; // Expires 1 minute from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = content;
    note.payload = { messageFrom: callerName, data: payload };

    note.topic = "com.docnock.voip";
    note.priority = 10;
    note.pushType = "background";
    service.send(note, deviceToken).then((err, result) => {
      if (err) {
        return console.log(JSON.stringify(err));
      } else {
        return console.log(JSON.stringify(result));
      }
    });
  } catch (err) {
    throw err;
  }
}




/* Test Call serive Other function  */



/* async function apnServiceiOS(
  message,
  token,
  senderName,
  chatId,
  type,
  receiverId,
  senderId,
  senderImage,
  callerData,
  calltype,
  voipToken,
  callerNameinfo
) {
  try {
    let senderNameInfo;

    let groupInfo = await Chat.findOne({ _id: chatId });

    if (groupInfo.isGroupChat) {
      senderNameInfo = groupInfo.chatName;
    }
    if (!groupInfo.isGroupChat) {
      senderNameInfo = senderName;
    }

    let getCount = await countData(receiverId);
    let getReceiverData = await users.findOne({ _id: receiverId });
    let receiverInfo = {
      name: getReceiverData.name,
      id: getReceiverData._id,
      image: getReceiverData.image,
    };
    let senderInfo = {
      senderName: senderName,
      senderId: senderId,
      senderImage: senderImage,
    };

    let PayloadData;

    if (type == "audio") {
      PayloadData = {
        chatId: chatId,
        type: type,
        receiverInfo: receiverInfo,
        senderInfo: senderInfo,
        callerInfo: callerData,
        name: callerData.data.userData.name,
      };
    }

    if (type == "video") {
      PayloadData = {
        chatId: chatId,
        type: type,
        receiverInfo: receiverInfo,
        senderInfo: senderInfo,
        callerInfo: callerData,
        name: callerData.data.userData.name,
      };
    }

    const apnPayload = {
      aps: {
        "content-available": 1,
        "apns-push-type": "background",
        "apns-expiration": 0
      },
      data: {
        uuid: uuid.v4(), // generates a unique uuid
        name: "RNVoip",
        handle: "123213782123", // replace with the phone number of the recipient
        handleType: "number"
      }
    };

    if (type == "video") {
      apnPayload.data.hasVideo = true;
    }

    console.log(apnPayload, "apnPayload");

    const info = path.resolve(__dirname, "../pushcert.pem");
    var deviceToken = "03b2261afd411e5a118f71377a1faea27bc79bba9f81403e7a5d6f3d34a33696";

    var service = new apn.Provider({
      cert: info,
      key: info,
    });
    var note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 560; // Expires 1 minute from now.
    note.badge = 3;
    note.sound = "ping.aiff";
    note.alert = `Call From ${senderName}`;
    note.payload = { messageFrom: senderName, data: apnPayload };

    note.topic = "com.docnock.voip";
    note.priority = 10;
    note.pushType = "alert";
    service.send(note, deviceToken).then((err, result) => {
      if (err) {
        return console.log(JSON.stringify(err));
      } else {
        return console.log(JSON.stringify(result));
      }
    });
  } catch (err) {
    console.log(err);
  }
}
 */

module.exports = {
  apnServiceiOS: apnServiceiOS,
  apnServiceiOSMissedCall: apnServiceiOSMissedCall,
};
