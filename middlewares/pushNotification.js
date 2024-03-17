var FCM = require("fcm-node");
var serverKey = process.env.SERVERKEY; //put your server key here
var fcm = new FCM(serverKey);
const mongoose = require("mongoose");
const chat = require("../model/chatModel");
const message = require("../model/messageModel");
const notification = require("../model/notification");
const users = require("../model/users");

async function sendNotification(
  message,
  token,
  senderName,
  chatId,
  type,
  receiverId,
  senderId,
  senderImage,
  callerData
) {
  let senderNameInfo;
  let groupInfo = await chat.findOne({ _id: chatId });

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

  var message = {
    //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: token,
    // collapse_key: "your_collapse_key",

    notification: {
      title: senderNameInfo,
      body: message,
      sound: "default",
      alert: "alert",
      badge: getCount,
    },
    priority: "high",
    data: {
      chatId: chatId,
      type: type,
      receiverInfo: receiverInfo,
      senderInfo: senderInfo,
      callerInfo: callerData,
    },
  };

  // if(callingTypeInfo){
  //   message = {
  //     //this may vary according to the message type (single recipient, multicast, topic, et cetera)
  //     to: token,
  //     // collapse_key: "your_collapse_key",

  //     notification: {
  //       title: senderNameInfo,
  //       body: message,
  //       sound: 'default',
  //       alert: 'alert',
  //       badge: getCount,

  //     },
  //     data: {

  //       data:JSON.stringify({
  //         chatId: chatId,
  //         type: type,
  //         receiverInfo:receiverInfo,
  //         senderInfo:senderInfo,
  //         callerInfo:callerData
  //       })

  //   },
  //   apns:
  //   {payload:
  //     { aps:
  //       { contentAvailable: true },
  //      }
  //     },
  //     headers: {
  //       'apns-push-type': 'background',
  //       'apns-priority': '5',
  //       'apns-topic': 'com.docnock'
  //     }
  //   };

  // }else{
  //   message = {
  //     //this may vary according to the message type (single recipient, multicast, topic, et cetera)
  //     to: token,
  //     // collapse_key: "your_collapse_key",

  //     notification: {
  //       title: senderNameInfo,
  //       body: message,
  //       sound: 'default',
  //       alert: 'alert',
  //       badge: getCount,

  //     },
  //     data: {
  //       chatId: chatId,
  //       type: type,
  //       receiverInfo:receiverInfo,
  //       senderInfo:senderInfo,
  //       callerInfo:callerData
  //   }
  //   };

  // }

  fcm.send(message, function (err, response) {
    if (err) {
      console.log("Something has gone wrong!", err);
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });
}

async function countData(receiverId) {
  let query = {
    isClicked: false,
    receiver: receiverId,
  };

  let newData = await notification.find(query).count();

  return newData;
  // return res.json({
  //   status: responses.SUCCESS,
  //   messageID: responses.SUCCESS_CODE,
  //   message: responses.FETCH_SUCCESS,
  //   data: {
  //     unreadCount: newData,
  //   },
  // });
}

async function sendNotificationForMissedCall(
  callerName,
  token,
  callMessage,
  chatId,
  type,
  receiverName,
  callerID,
  callerImage
) {
  let senderInfo = {
    senderName: callerName,
    senderId: callerID,
    senderImage: callerImage,
  };

  var message = {
    to: token,
    notification: {
      title: callerName,
      body: callMessage,
      sound: "default",
      alert: "alert",
      //  badge: getCount,
    },
    priority: "high",
    data: {
      senderInfo: senderInfo,
      type: type,
      chatId: chatId,
    },
  };

  fcm.send(message, function (err, response) {
    if (err) {
      console.log("Something has gone wrong!", err);
    } else {
      console.log("Successfully sent with response: ", response);
    }
  });
}

module.exports = {
  sendNotification,
  sendNotificationForMissedCall,
};
