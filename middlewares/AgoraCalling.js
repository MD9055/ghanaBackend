const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')

let appIds = "7b4ccbc409024d08a7d553d595a9c77d";
let appCertificates = "ba95cc20b5cf4a679151f0504e9183bb"
let uuID = 0
async function calling(roomName){
  let getToken =   await TokenGeneration(roomName)
}
async function TokenGeneration(roomName){
const appId = appIds;
const appCertificate = appCertificates;
const channelName = roomName;
const uid = uuID;
const role = RtcRole.PUBLISHER;
const expirationTimeInSeconds = 3600
const currentTimestamp = Math.floor(Date.now() / 1000)
const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
// Build token with uid
const tokenA = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs);
return tokenA

}

















module.exports = {
    calling:calling
}