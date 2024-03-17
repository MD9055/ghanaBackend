const chat = require("../model/chatModel");
const videoRooms = require("../model/videoRoom");
const commonQuery = require("../middlewares/commonQuery");
const cron = require("node-cron");
const usersModel = require("../model/users");
const mongoose = require("mongoose");
const responses = require("../constant");

const {
  sendNotification,
  sendNotificationForMissedCall,
} = require("./pushNotification");
const { apnServiceiOS, apnServiceiOSMissedCall } = require("./apnService");

const {
  accessChat,
  addToGroup,
  allMessages,
  createGroupChat,
  fetchChats,
  messageThreds,
  removeFromGroup,
  renameGroup,
  sendMessage,
  sendMessage1,
  fetchChatsMobile,
  accessChatMobile,
  createGroupChatMobile,
  fetchChatsMobileForNursingHome,
  updateIsRead,
  markAsRead,
  callUser,
  updateReadAll,
  joinRoom,
  findRoom,
  renameGroupForMobile,
  muteAndUnmute,
  saveNotification,
  deleteMessage,
  deleteGroup,
  removeMember,
  memberAdd,
  deleteuser,
} = require("./chat");
const Message = require("../model/messageModel");

exports = module.exports = function (io) {
  /* 
   - Socket Events - 
  1 - Connection Event
  2 - Join Events 
  */
  io.sockets.on("connection", (socket) => {
    socket.on("join", (data) => {
      socket.join(data.room);
    });

    /* Event to delete the group */

    socket.on("delete-group", async (data) => {
      let deleteGroupData = await deleteGroup(data.loginId, data.chatId);
      let ChatChannel = await chat.findOne({ _id: data.chatId });
      ChatChannel.users.forEach(async (el) => {
        let allData = await fetchChatsMobile(el, "chat");

        await io.in(el.toString()).emit("chat-history", allData);
      });
    });

    /*
         Leave Event - This event help to leave the connection
         */
    socket.on("leave", async (data) => {
      await socket.leave(data.room);
    });

    /* 
        Message Event - Storing Message in Database - Emitting to receipant
        */

    socket.on("message", async (data) => {
      let user = data.user;
      let getSenderName = await usersModel.findOne({
        _id: data.message.sender._id,
      });
      let FindChatData = await chat.findOne({ _id: data.room });
      let findreminderMessage = await Message.find({
        chat: mongoose.Types.ObjectId(data.room),
        isImportant: true,
      });
      var messageData = await sendMessage(
        data.room,
        data.message.content,
        data.message.sender._id,
        data.message.attachments,
        data.message.isImportant,
        getSenderName.name

      );

      io.in(data.room).emit("new message", {
        user: data.user,
        message: data.message,
        room: data.room,
        messageInfo: messageData._id,
      });
      let chatNotification = await saveNotification(
        data.room,
        data.message.sender._id
      );
      if (messageData.isImportant == true) {
        let dataMessage = messageData;
        let obj1 = {
          message: "Priority Message Reminder",
          additionalData: [
            {
              type: FindChatData.type,
              typeId: FindChatData._id.toString(),
            },
          ],
        };

        runningCronPriorityMessage(
          dataMessage._id,
          FindChatData,
          obj1,
          data,
          getSenderName,
          io
        );
      }
      findreminderMessage.forEach((el) => {
        let obj = {
          message: "Priority Reminder",
          additionalData: [
            {
              type: el.messageType,
              typeId: el.chat.toString(),
            },
          ],
        };
        let checkUser = false;
      });
      FindChatData.users.forEach(async (ele) => {
        if (data.message.sender._id != ele._id) {
          await io
            .in(ele._id.toString())
            .emit("received-notification", chatNotification);
        }
      });
      FindChatData.users.map(async (ele) => {
        if (data.message.sender._id !== ele._id.toString()) {
          let findData = await usersModel.find({ _id: ele._id.toString() });
          let receiverId = ele._id;
          sendNotification(
            data.message.content,
            // data.message.attachments,
            findData[0].pushNotificationToken,
            getSenderName.name,
            data.room,
            FindChatData.type,
            receiverId,
            getSenderName._id,
            getSenderName.image
          );
        }
      });
      FindChatData.users.forEach(async (el) => {
        let usersData = await fetchChatsMobile(
          el.toString(),
          FindChatData.type
        );
        await io.in(el.toString()).emit("chat-history", usersData);
      });
    });

    /* 
        fetch-chat-nursingHome - Event to fetch the channel for the nursing home 
        */

    socket.on("fetch-chat-nursingHome", async (data) => {
      let chatData = await fetchChatsMobileForNursingHome(data.senderId);
      await io.in(data.senderId).emit("chat-history-nursingHome", chatData);
    });

    /*   
            fetch-chats event used to fetch chat channels for the users

            */

    socket.on("fetch-chats", async (data) => {
      let usersData = await fetchChatsMobile(
        data.senderId,
        data.type,
        data.page
      );
      await io.in(data.senderId).emit("chat-history", usersData);
    });

    /* 
        Typing event to disply the typing to receipant
        */

    socket.on("typing", (data) => {
      socket.broadcast
        .in(data.room)
        .emit("typing", { data: data, isTyping: true });
    });

    /* 
        This event is used to create the room between 2 users
        */
    socket.on("access-chat", async (data) => {
      let checkData = await accessChatMobile(
        data.senderId,
        data.user_id,
        data.type
      );
      let usersData = await fetchChatsMobile(data.senderId, data.type);
      await io.in(data.senderId).emit("access-user-chat", checkData);
      // io.in(data.senderId).emit("chat-history", usersData);
    });

    /* 
        This is event is used to create room between 3 or more users
        */

    socket.on("create-group", async (data) => {
      let createUSer = await createGroupChatMobile(
        data.user,
        data.name,
        data.senderId,
        data.groupName
      );

      data.user.map(async (el) => {
        let allData = await fetchChatsMobile(el, "chat", 1);

        await io.in(el).emit("chat-history", allData);
      });
      await io.in(data.senderId).emit("access-user-group", createUSer);
    });

    /* 
          
          This event is used to mark read message for the receipants
          */

    socket.on("mark-as-read", async (data) => {
      let markAsReadData = await markAsRead(
        data.chatId,
        data.loggedInUserId,
        data.type
      );
      let getChatType = await chat.findOne({
        _id: mongoose.Types.ObjectId(data.chatId),
      });

      let usersData = await fetchChatsMobile(
        data.loggedInUserId,
        getChatType.type
      );
      await io.in(data.loggedInUserId).emit("chat-history", usersData);

      await io.in(data.loggedInUserId).emit("update-notification", data);
    });

    /*  
            This event is user to end the call and notified to receipants
            */

    socket.on("end-call-emit", async (data) => {
      try {
        let getting_userData = await videoRooms.findOne({
          roomName: data.roomName,
        });
        let roomData = {
          roomName: data.roomName,
        };
        let chatUsers = await chat.findById(getting_userData.chatId);
        if (!chatUsers.isGroupChat) {
          chatUsers.users.map(async (el) => {
            // if(data.loggedInUserId != el._id.toString()){
            await io.in(el._id.toString()).emit("end-call", roomData);
            let removeLoggedInUserData = await videoRooms.findOneAndUpdate(
              { roomName: data.roomName },
              {
                $pull: {
                  participants: {
                    userId: mongoose.Types.ObjectId(data.loggedInUserId),
                  },
                },
              },
              { new: true }
            );
            if (el._id.toString() != data.loggedInUserId) {
            

              let informationUser = await usersModel.findOne({ _id: el._id });
              let loggedinUserInformation = await usersModel.findOne({
                _id: data.loggedInUserId,
              });
             
                if(removeLoggedInUserData.status == 'InProgress' && removeLoggedInUserData.participants.length == 0){
                  const missedCallNotification = await apnServiceiOSMissedCall(
                    `missed call from ${loggedinUserInformation.name}`,
                    informationUser.pushNotificationToken,
                    informationUser.name,
                    getting_userData.chatId,
                    chatUsers.type,
                    informationUser.voip_push,
                    loggedinUserInformation.name
                  );

              
                }

                if(removeLoggedInUserData.status == 'InProgress' && removeLoggedInUserData.participants.length == 0){
                  let messageForMissedCall = "Missed call";
                  const displayNotficationMissedCall =
                    await sendNotificationForMissedCall(
                      loggedinUserInformation.name,
                      informationUser.pushNotificationToken,
                      messageForMissedCall,
                      getting_userData.chatId,
                      chatUsers.type,
                      informationUser.name,
                      loggedinUserInformation._id,
                      loggedinUserInformation.image
    
                    );
                }
                
              
              
              
            }
            let partipantInfo = await videoRooms.findOne({
              roomName: data.roomName,
            });
            
            if (partipantInfo.participants.length === 1) {
              let updateStatus = await videoRooms.findOneAndUpdate(
                { roomName: data.roomName },
                { $set: { status: "Completed" } },
                { new: true }
              );
              
            }



            // }
          });
        } else {
          let info;
          let loggedinUserId;
          getting_userData.participants.forEach((element1) => {
            if (element1.userId.toString() == data.loggedInUserId) {
              info = element1.userIdentity;
              loggedinUserId = element1.userId;
            }
          });

          getting_userData.participants.forEach(async (element) => {
            if (element.userId.toString() != data.loggedInUserId) {
              await io.in(element.userId.toString()).emit("participant-left", {
                roomName: data.roomName,
                identity: info,
                loggedinUserId: loggedinUserId,
              });

              let removeLoggedInUserData = await videoRooms.findOneAndUpdate(
                { roomName: data.roomName },
                {
                  $pull: {
                    participants: {
                      userId: mongoose.Types.ObjectId(data.loggedInUserId),
                    },
                  },
                },
                { new: true }
              );
              let partipantInfo = await videoRooms.findOne({
                roomName: data.roomName,
              });
              
              if (partipantInfo.participants.length === 1) {
                let updateStatus = await videoRooms.findOneAndUpdate(
                  { roomName: data.roomName },
                  { $set: { status: "Completed" } },
                  { new: true }
                );
              }
            }
          });

          if (
            getting_userData.participants.length == 0 &&
            getting_userData.callerId == data.loggedInUserId
          ) {
            chatUsers.users.forEach(async (el) => {
              await io.in(el._id.toString()).emit("end-call", roomData);

              
              if (el._id.toString() != data.loggedInUserId) {

                let informationUser = await usersModel.findOne({ _id: el._id });
                let loggedinUserInformation = await usersModel.findOne({
                  _id: data.loggedInUserId,
                });
  
                const missedCallNotification = await apnServiceiOSMissedCall(
                  `missed call from ${loggedinUserInformation.name}`,
                  informationUser.pushNotificationToken,
                  informationUser.name,
                  getting_userData.chatId,
                  chatUsers.type,
                  informationUser.voip_push,
                  loggedinUserInformation.name
                );
                let messageForMissedCall = "Missed call";
                const displayNotficationMissedCall =
                  await sendNotificationForMissedCall(
                    loggedinUserInformation.name,
                    informationUser.pushNotificationToken,
                    messageForMissedCall,
                    getting_userData.chatId,
                    chatUsers.type,
                    informationUser.name
                  );
              }


            });
          } else {
            await io.in(data.loggedInUserId).emit("end-call", roomData);


            if (el._id.toString() == data.loggedInUserId) {
                
              let informationUser = await usersModel.findOne({ _id: el._id });
              let loggedinUserInformation = await usersModel.findOne({
                _id: data.loggedInUserId,
              });

              const missedCallNotification = await apnServiceiOSMissedCall(
                `missed call from ${loggedinUserInformation.name}`,
                informationUser.pushNotificationToken,
                informationUser.name,
                getting_userData.chatId,
                chatUsers.type,
                informationUser.voip_push,
                loggedinUserInformation.name
              );
              let messageForMissedCall = "Missed call";
              const displayNotficationMissedCall =
                await sendNotificationForMissedCall(
                  loggedinUserInformation.name,
                  informationUser.pushNotificationToken,
                  messageForMissedCall,
                  getting_userData.chatId,
                  chatUsers.type,
                  informationUser.name
                );
            }
          }
        }
      } catch (e) {}
    });

    /* 
        This is used to start the ringing for the calling feature
        */

    socket.on("ringing-start", async (data) => {
      try {
        let informRing = await chat.findById(data.chatId);
        informRing.users.map(async (el) => {
          if (el._id != data.senderId) {
            await io.in(el._id.toString()).emit("ringing-started", data);
          }
        });
      } catch (e) {}
    });

    /* 
        This event is used to make the call to user
        */

    socket.on("call-user", async (data) => {
      let data1 = await chat.findOne({ _id: data.chatId });
      let loggedInUserData = {};
      callType = "calling";
      let uniqueName = (Math.random() + 1).toString(36).substring(7);
      let roomData = uniqueName;

      let findingToken = await joinRoom(
        roomData,
        data1,
        data.type,
        data1._id,
        data.loggedInUserId
      );
      let newTopken = await findRoom(roomData);
      if (!data1.isGroupChat) {
        let IsMatchExecuted = false;
        let IsNotMatchedExecuted = false;
        let notMatchedUserId;
        data1.users.forEach(async (el) => {
          let userId = el.toString();
          if (userId != data.loggedInUserId && !IsNotMatchedExecuted) {
            notMatchedUserId = userId;
            IsNotMatchedExecuted = true;
            let receiverData = await usersModel.findById(userId);
            let receiverUserDAta = {
              userData: {
                name: receiverData.name,
                image: receiverData.image,
                chatId: data1._id,
                roomName: uniqueName,
                // token: findingToken,
                type: data.type,
                isGroup: data1.isGroupChat,
              },
            };

            let responseData = {
              status: responses.SUCCESS,
              messageID: responses.SUCCESS_CODE,
              message: responses.FETCH_SUCCESS,
              data: receiverUserDAta,
            };

            await io.in(data.loggedInUserId).emit("caller-info", responseData);
          }
          if (userId == data.loggedInUserId && !IsMatchExecuted) {
            IsMatchExecuted = true;
            let loggedInUserInfo = await usersModel.findById(
              data.loggedInUserId
            );
            let loggedInUserData = {
              userData: {
                name: loggedInUserInfo.name,
                image: loggedInUserInfo.image,
                chatId: data1._id,
                roomName: uniqueName,
                // token: newTopken,
                type: data.type,
                isGroup: data1.isGroupChat,
              },
            };

            let response = {
              status: responses.SUCCESS,
              messageID: responses.SUCCESS_CODE,
              message: responses.FETCH_SUCCESS,
              data: loggedInUserData,
            };

            data1.users.forEach(async (el) => {
              if (el.toString() != data.loggedInUserId) {
                await io.in(el.toString()).emit("notify-call", response);

                // if (data.loggedInUserId !== el._id.toString()) {
                let findData = await usersModel.find({ _id: el.toString() });
                let receiverId = el;
                let callMessage;
                if (data.type == "audio") {
                  callMessage = `${loggedInUserInfo.name} is starting audio call, please tap here to pick the call..`;
                }
                if (data.type == "video") {
                  callMessage = `${loggedInUserInfo.name} is starting video call, please tap here to pick the call..`;
                }

                if (findData[0].deviceType == "ios") {
                 

                  const grpName = data1.groupDetails.name
                    ? data1.groupDetails.name
                    : data1.chatName;

                  if (
                    findData[0].voip_push &&
                    findData[0].voip_push != "" &&
                    findData[0].voip_push != null
                  ) {
                    apnServiceiOS(
                      `${grpName} is calling, please tap here to pick the call..`,
                      // data.message.attachments,
                      findData[0].pushNotificationToken,
                      findData.name,
                      data.chatId,
                      data.type,
                      receiverId,
                      findData._id,
                      findData.image,
                      response,
                      callType,
                      findData[0].voip_push,
                      loggedInUserInfo.name
                    );
                  }
                }

                if (findData[0].pushNotificationToken) {
                  sendNotification(
                    callMessage,
                    // data.message.attachments,
                    findData[0].pushNotificationToken,
                    findData.name,
                    data.chatId,
                    data.type,
                    receiverId,
                    findData._id,
                    findData.image,
                    response,
                    callType,
                    findData[0].deviceType
                  );
                }

                // }
              }
            });
          }
        });
      } else {
        let IsMatchExecuted = false;
        let IsNotMatchedExecuted = false;
        let notMatchedUserId;
        let loggedInUserInfo = await usersModel.findById(data.loggedInUserId);
        const grpName = data1.groupDetails.name
          ? data1.groupDetails.name
          : data1.chatName;
        const grpImage = data1.groupDetails.image;
        let receiverUserDAta = {
          userData: {
            name: grpName,
            image: grpImage,
            chatId: data1._id,
            roomName: uniqueName,
            token: findingToken,
            type: data.type,
            isGroup: data1.isGroupChat,
          },
        };
        let response = {
          status: responses.SUCCESS,
          messageID: responses.SUCCESS_CODE,
          message: responses.FETCH_SUCCESS,
          data: receiverUserDAta,
        };
        await io.in(data.loggedInUserId).emit("caller-info", response);
        data1.users.forEach(async (el) => {
          if (el.toString() != data.loggedInUserId) {
            await io.in(el.toString()).emit("notify-call", response);
            if (data.loggedInUserId !== el._id.toString()) {
              let findData = await usersModel.find({ _id: el._id.toString() });
              let receiverId = el._id;

              if (findData[0].deviceType == "ios") {
                if (
                  findData[0].voip_push &&
                  findData[0].voip_push != "" &&
                  findData[0].voip_push != null
                ) {
                  apnServiceiOS(
                    `${grpName} is calling, please tap here to pick the call..`,
                    // data.message.attachments,
                    findData[0].pushNotificationToken,
                    findData.name,
                    data.chatId,
                    data.type,
                    receiverId,
                    findData._id,
                    findData.image,
                    response,
                    callType,
                    findData[0].voip_push,
                    loggedInUserInfo.name
                  );
                }
              }
              if (
                findData[0].pushNotificationToken &&
                findData[0].deviceType != "ios"
              ) {
                sendNotification(
                  `${grpName} is calling, please tap here to pick the call..`,
                  // data.message.attachments,
                  findData[0].pushNotificationToken,
                  findData.name,
                  data.chatId,
                  data.type,
                  receiverId,
                  findData._id,
                  findData.image,
                  response,
                  callType
                );
              }
            }
          }
        });
      }
    });

    /* 
        this event is used generate the calling using Agora
        
        */
    socket.on("call-user-agora", async (data) => {
      let data1 = await chat.findOne({ _id: data.chatId });
      let loggedInUserData = {};

      let uniqueName = (Math.random() + 1).toString(36).substring(7);
      let roomData = uniqueName;

      let findingToken = await joinRoomAgora(
        roomData,
        data1,
        data.type,
        data1._id,
        data.loggedInUserId
      );
      // let newTopken = await findRoom(roomData);
      if (!data1.isGroupChat) {
        let IsMatchExecuted = false;
        let IsNotMatchedExecuted = false;
        let notMatchedUserId;
        data1.users.forEach(async (el) => {
          let userId = el.toString();
          if (userId != data.loggedInUserId && !IsNotMatchedExecuted) {
            notMatchedUserId = userId;
            IsNotMatchedExecuted = true;
            let receiverData = await usersModel.findById(userId);
            let receiverUserDAta = {
              userData: {
                name: receiverData.name,
                image: receiverData.image,
                chatId: data1._id,
                roomName: uniqueName,
                // token: findingToken,
                type: data.type,
                isGroup: data1.isGroupChat,
              },
            };

            let responseData = {
              status: responses.SUCCESS,
              messageID: responses.SUCCESS_CODE,
              message: responses.FETCH_SUCCESS,
              data: receiverUserDAta,
            };

            await io
              .in(data.loggedInUserId)
              .emit("caller-info-agora", responseData);
          }
          if (userId == data.loggedInUserId && !IsMatchExecuted) {
            IsMatchExecuted = true;
            let loggedInUserInfo = await usersModel.findById(
              data.loggedInUserId
            );
            let loggedInUserData = {
              userData: {
                name: loggedInUserInfo.name,
                image: loggedInUserInfo.image,
                chatId: data1._id,
                roomName: uniqueName,
                // token: newTopken,
                type: data.type,
                isGroup: data1.isGroupChat,
              },
            };

            let response = {
              status: responses.SUCCESS,
              messageID: responses.SUCCESS_CODE,
              message: responses.FETCH_SUCCESS,
              data: loggedInUserData,
            };

            data1.users.forEach(async (el) => {
              if (el.toString() != data.loggedInUserId) {
                await io.in(el.toString()).emit("notify-call-agora", response);
              }
            });
          }
        });
      } else {
        let IsMatchExecuted = false;
        let IsNotMatchedExecuted = false;
        let notMatchedUserId;
        const grpName = data1.groupDetails.name
          ? data1.groupDetails.name
          : data1.chatName;
        const grpImage = data1.groupDetails.image;
        let receiverUserDAta = {
          userData: {
            name: grpName,
            image: grpImage,
            chatId: data1._id,
            roomName: uniqueName,
            token: findingToken,
            type: data.type,
            isGroup: data1.isGroupChat,
          },
        };
        let response = {
          status: responses.SUCCESS,
          messageID: responses.SUCCESS_CODE,
          message: responses.FETCH_SUCCESS,
          data: receiverUserDAta,
        };
        await io.in(data.loggedInUserId).emit("caller-info-agora", response);
        data1.users.forEach(async (el) => {
          if (el.toString() != data.loggedInUserId) {
            await io.in(el.toString()).emit("notify-call-agora", response);
          }
        });
      }
    });

    /* 
        this event is used for call pick when call picked then it notified to receipants
        */

    socket.on("call-pick-emit", async (data) => {
      let getting_userData = await chat.findById(data.chatId);

      getting_userData.users.map(async (el) => {
        let checkdata = await io
          .in(el._id.toString())
          .emit("call-picked", "call has been picked");
      });
    });

    /* 
          This event is used to update the messages 
          */

    socket.on("update-message", async (data) => {
      let updateMessage = await Message.findOneAndUpdate(
        { _id: data.messageID },
        { $set: { isImportant: false } },
        { new: true }
      );
    });

    /* 
          This event is used to close the ringer during the call
          */

    socket.on("close-ringer", async (data) => {
      try {
        await io.in(data.loggedInUserId).emit("close-ringer-dialog", data);
      } catch (e) {
        throw err;
      }
    });

    /* 
                this event is used to update the group name 
                */

    socket.on("rename", async (data) => {
      let updateGroup = await renameGroupForMobile(
        data.name,
        data.chatId,
        data.image
      );
      let getuserData = await chat.findOne({ chat: data.chatId });

      getuserData.users.forEach(async (el) => {
        let usersData = await fetchChatsMobile(el.toString(), getuserData.type);
        await io.in(el.toString()).emit("group-details-updated", updateGroup);
        await io.in(el.toString()).emit("chat-history", usersData);
      });
    });


    socket.on("remove-group-image", async (data) => {
      let updateGroup = await renameGroupForimage(
        data.name,
        data.chatId,
        data.image
      );
      let getuserData = await chat.findOne({ chat: data.chatId });

      getuserData.users.forEach(async (el) => {
        let usersData = await fetchChatsMobile(el.toString(), getuserData.type);
        await io.in(el.toString()).emit("group-details-updated", updateGroup);
        await io.in(el.toString()).emit("chat-history", usersData);
      });
    });

    /* 
        This event is used mute and unmute the track during the call
        */

    socket.on("track-mute", async (data) => {
      let updateMuteAndUmute = await muteAndUnmute(
        data.roomName,
        data.userId,
        data.isAudioMuted,
        data.isVideoMuted
      );

      let newObj = { ...data, identity: updateMuteAndUmute.userIdentity };

      updateMuteAndUmute.data.participants.forEach(async (el) => {
        await io.in(el.userId.toString()).emit("track-mute-on", newObj);
      });
    });

    /* 
          this event is used to delete the message on run time
        */
    socket.on("delete-message", async (data) => {
      let deleteMessageById = await deleteMessage(data._id);

      await io.in(data.chatId).emit("message-deleted", deleteMessageById);
    });

    socket.on("add-member-ingroup", async (data) => {
      let addMemberInGroup = await memberAdd(data);
      await io.in(data.senderId).emit("updated-room-members", addMemberInGroup);
    });

    socket.on("remove-member", async (data) => {
      let removeMemberFromList = await removeMember(data.id, data.chatId);
      await io
        .in(data.chatId.toString())
        .emit("removed-user", removeMemberFromList);
    });

    socket.on("remove-calluser", async (data) => {
      let removedData = await deleteuser(data);

      await io.in(data.loggedInId).emit("userRemovedFromCall", removedData);
    });
  });
};

/* 
Function to send priority message to the receipants
*/

async function runningCronPriorityMessage(
  messageId,
  getChatData,
  obj1,
  data,
  getSenderName,
  io
) {
  try {
    cron.schedule("*/10 * * * * *", async () => {
      let getData = await Message.findOne({
        _id: mongoose.Types.ObjectId(messageId),
      });
      let getLength = getData.readBy.length;
      let chatUserLength = getChatData.users.length;
      if (getLength != chatUserLength) {
        getChatData.users.forEach(async (el) => {
          let reminder = false;
          getData.readBy.forEach(async (ele) => {
            if (el._id.toString() == ele._id.toString()) {
              reminder = true;
            }
          });
          if (reminder == false) {
            await io.in(el._id.toString()).emit("reminder-message", obj1);

            let pushNotification = await usersModel.findOne({
              _id: el._id.toString(),
            });

            if (pushNotification.pushNotificationToken) {
              sendNotification(
                data.message.content,
                pushNotification.pushNotificationToken,
                getSenderName.name,
                getChatData._id,
                getChatData.type,
                getSenderName._id,
                getSenderName.image
              );
            }
          }
        });
      }
    });
  } catch (err) {
    throw err;
  }
}
