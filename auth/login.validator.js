const { check } = require("express-validator");

 const isLogin = [
  check("email")
    .exists()
    .withMessage("EMAIL MISSING")

    .not()

    .isEmpty()

    .withMessage("EMAIL IS_EMPTY")

    .isEmail()

    .withMessage("Email is not valid."),

  check("device_token")
    .exists()

    .withMessage("DEVICE TOKEN MISSING")

    .not()

    .isEmpty()

    .withMessage("DEVICE TOKEN IS_EMPTY"),

  check("password")
    .exists()

    .withMessage("PASSWORD MISSING")

    .not()

    .isEmpty()

    .withMessage("PASSWORD IS_EMPTY"),

  (req, res, next) => {
    validationResponse(req, res, next);
  },
];

module.exports = {
    isLogin
}
