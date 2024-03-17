const jwt = require("jsonwebtoken");
const constant = require("../constant");
const { responseCodes } = require("../constant");
const users = require("../model/users");
const config = require("../config/config.js").get(
  process.env.NODE_ENV || "local"
);
const { SECRETKEY } = config;
const userModel = require("../model/users");

/* 
Function To Verifying Token

1 - Taking the token from the Header
2 - Matching with the Error - like auth error and keys

*/

async function verifyToken(req, res, next) {
  const token = req.header("token");

  
  var jwtSecretKey = SECRETKEY;
  if (!token) return res.status(401).json({ message: "Auth Error" });
  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    let userdata = await userModel.findOne({ _id: decoded._id });
    if(token != userdata.token){
      if(userdata.deviceType == 'ios'){
        let removeTokens = await userModel.findOneAndUpdate({_id:decoded._id}, {$set:{pushNotificationToken:""}}, {new:true})

      }
      if(userdata.deviceType == 'android'){
        let removeTokens = await userModel.findOneAndUpdate({_id:decoded._id}, {$set:{ voip_push:""}}, {new:true})
        
      }
      return res.status(401).json({ message: "Token Expired" });
    }
    if (userdata.status == 2 || userdata.status == 0) {
      return res.status(401).json({ message: "Auth Error" });
    }
    req.user = decoded;

    next();
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token Expired" });
    }
    return res.status(500).send({ message: "Invalid Token" });
  }
}

module.exports = {
  verifyToken: verifyToken,
};
