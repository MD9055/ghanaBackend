const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const mg = require("nodemailer-mailgun-transport");
const config = require("../config/config.js").get(
  process.env.NODE_ENV || "local"
);
const { EMAIL } = config;

const sendEmail = async (email, subject, text, file, cc_email) => {
  let transporter = nodemailer.createTransport(
    smtpTransport({
      service: "gmail",
      host: EMAIL.host,
      auth: {
        user: EMAIL.user,
        pass: EMAIL.password,
      },
    })
  );

  const mailOptions = {
    from: EMAIL.user,
    to: email,
    subject: subject,
    html: text,
    cc: cc_email, // add CC email address
    attachments: file ? [
      {
        filename: file.originalname,
        path: file.path
      }
    ] : []
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = sendEmail;