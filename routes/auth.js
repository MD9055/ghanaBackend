const express = require("express");
const { login } = require("../auth/login");
const { profileUpdate } = require("../controllers/admin/users");
const authRoute = express.Router();
const verifyToken = require("../middlewares/verifyToken");
// const {isLogin} = require('../auth/login.validator')
const {
  changePassword,
  forgotPassword,
  createPassword,
  
} = require("../auth/login");

authRoute.post("/login",  login);

authRoute.post("/auth/change-password", changePassword);
authRoute.post("/auth/forgot-password", forgotPassword);
authRoute.post("/auth/create-password", createPassword);


module.exports = authRoute;
