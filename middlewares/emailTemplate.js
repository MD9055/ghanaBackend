const config = require("../config/config").get(process.env.NODE_ENV || "local");
const axios = require('axios')
const request = require('request');


const { SECRETKEY, APP, PORTS } = config;


async function createDynamicLink(token) {
    try {
      console.log(token, "token");
      const dynamicURL = "";
      const data = JSON.stringify({
        dynamicLinkInfo: {
          domainUriPrefix: "https://docnock.page.link",
          link: `https://admin.doc-nock.com/reset-password?token=${token}`,
          androidInfo: {
            androidPackageName: "com.docnock",
          },
          iosInfo: {
            iosBundleId: "com.docnock",
          },
        },
      });
  
      const options = {
        method: "POST",
        url: "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyCbztG6d7NZbHI0VfsRD45_1Cs1vVx2Ppo",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };
  
      const response = await axios(options);
      console.log(response.data.shortLink, "dynamicURL.shortLink");
     
      return {
        status: true,
        URL: response.data.shortLink,
      };
    } catch (error) {
      console.error(error);
      return {
        status: false,
      };
    }
  }
  




async function createDynamicLinkSetupProfile(token){
    try{
    

        let dynamicURL = "";
        var data = JSON.stringify({"dynamicLinkInfo":{"domainUriPrefix":"https://docnock.page.link","link":`https://admin.doc-nock.com/setup-profile?token=${token}`,"androidInfo":{"androidPackageName":"com.docnock"},"iosInfo":{"iosBundleId":"com.docnock"}}});
    
    var configData = {
      method: 'post',
      url: 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyCbztG6d7NZbHI0VfsRD45_1Cs1vVx2Ppo',
      headers: { 
        'Content-Type': 'application/json'
      },
      data : data
    };
    
     dynamicURL = await axios(configData) 
    
    
    
    return {
        status:true,
        URL:dynamicURL.data.shortLink
    }

    }catch(err){
        return {
            status:false,
       
        }
    }
 
       

   
    

}

function generateMessageSignup(link) {
    const message = `Message From DocNock\nClick on the link to set up your profile:\n${link}`;
    return message;
  }

  async function generateMessageForget(link) {
    const message = `Message From DocNock\nClick on the link to set up your password:\n${link}`;
    return message;
  }




async function signUpEmail(APP, PORTS, token) {
  let text = `
  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Dock Nock Email Template</title>
                  
                      <style>
                          @media (max-width: 576px){
                              section{
                                  width: auto !important;
                              }
                              .box{
                                  max-width: none !important;
                                  width: 100% !important;
                              }
                              .innerBox{
                                  max-width: 255px !important;
                              }
                          }
                      </style>
                  </head>
                  <body style="background-color: #F9F9F9; width: 100% !important; height: 100vh; margin: 0; padding: 0;">
                      <section style="border-right: 1px solid #DDDDDD; border-left: 1px solid #DDDDDD; width: 500px;  height: 100vh; margin: auto;">
                          <div class="box" style="max-width: 500px; margin: 0 auto; background-color: #F9F9F9;">
                              <div style="width: 100%; padding-top: 10px; text-align: center; position: relative; padding-bottom: 185px; height: 100%; background-image: url(${APP.APIHOST}:${PORTS.API_PORT}/public/upload/welcome_bg.png); background-repeat: no-repeat; background-size: cover;" >
                                  <div>
                                      <div>
                                          <img src="${APP.backEndURL}:${PORTS.API_PORT}/public/upload/loginLogo.png" style="margin-bottom: 20px; width: 85px; margin-top: 20px;" alt="Logo">
                                      </div>
                                  </div>
                      
                                  <div class="innerBox" style="max-width: 300px; width: 100%; margin: auto; background-color: #fff; border-radius: 10px; padding: 20px; position: absolute; left: 50%; transform: translateX(-50%);     bottom: -200px;">
                                      <h1 style="font-size: 32px; color: #272727; font-weight: 600; margin-top: 0; margin-bottom: 0;">Welcome!</h1>
                                      <p style="font-size: 15px; font-weight: 300; color: #656565; margin-top: 25px;">We are exicted to have you on board the communication lifeline.</p>
                      
                                      <a href="${token}" style="background-color: #64BD05; text-align: center; display: inline-block; padding: 8px 0px; max-width: 150px; width: 100%; font-size: 14px; font-weight: 300; margin: 15px  auto 0; color: #fff; border-radius: 35px; text-decoration: none;">Set Up Profile</a>
                      
                      
                                      <p style="font-size: 15px; font-weight: 300; color: #656565; text-align: left;margin-top: 25px;">Thanks,<span style="display: block;">
                                        The DocNock team.</span></p>
                                  </div>
                              </div>
                          </div>
                      </section>
                  </body>
                  </html>
  
  `;

  return text;
}

async function forgetEmail(APP, PORTS, token) {
    let APIHOST ;
    if(APP.APIHOST === "https://www.doc-nock.com"){
        APIHOST = "https://docnock.page.link/reset-password"
    }else{
        // APIHOST = "https://docnock.page.link/reset-password"
        APIHOST ="http://localhost:4200/reset-password"

    }
    
  let text = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dock Nock Email Template</title>
    
        <style>
            @media (max-width: 576px){
                section{
                    width: auto !important;
                }
                .box{
                    max-width: none !important;
                    width: 100% !important;
                }
                .innerBox{
                    max-width: 255px !important;
                }
            }
        </style>
    </head>
    <body style="background-color: #F9F9F9; width: 100% !important; height: 100vh; margin: 0; padding: 0;">
        <section style="border-right: 1px solid #DDDDDD; border-left: 1px solid #DDDDDD; width: 500px;  height: 100vh; margin: auto;">
            <div class="box" style="max-width: 500px; margin: 0 auto; background-color: #F9F9F9;">
                <div style="width: 100%; padding-top: 10px; text-align: center; position: relative; padding-bottom: 185px; height: 100%; background-image: url(${APP.APIHOST}:${PORTS.API_PORT}/public/upload/welcome_bg.png); background-repeat: no-repeat; background-size: cover;" >
                    <div>
                        <div>
                            <img src="${APP.backEndURL}:${PORTS.API_PORT}/public/upload/login.png" style="margin-bottom: 20px; width: 85px; margin-top: 20px;" alt="Logo">
                        </div>
                    </div>
        
                    <div class="innerBox" style="max-width: 300px; width: 100%; margin: auto; background-color: #fff; border-radius: 10px; padding: 20px; position: absolute; left: 50%; transform: translateX(-50%);     bottom: -200px;">
                        <h1 style="font-size: 32px; color: #272727; font-weight: 600; margin-top: 0; margin-bottom: 0;">Reset Password!</h1>
                        <p style="font-size: 15px; font-weight: 300; color: #656565; margin-top: 25px;">Here are the link below to reset the password.</p>
                        
                        <a href="${token}" style="background-color: #64BD05; text-align: center; display: inline-block; padding: 8px 0px; max-width: 150px; width: 100%; font-size: 14px; font-weight: 300; margin: 15px  auto 0; color: #fff; border-radius: 35px; text-decoration: none;">Reset Password</a>
        
                        <p style="font-size: 15px; font-weight: 300; color: #656565; text-align: left; margin-top: 35px;">If you have any questions, just reply to this email - we're always happy to help out.</p>
        
                        <p style="font-size: 15px; font-weight: 300; color: #656565; text-align: left;margin-top: 25px;">Thanks,<span style="display: block;">Care Communication.</span></p>
                    </div>
                </div>
            </div>
        </section>
    </body>
    </html>`;

  return text;
}



async function physicianAssigMail(APP, PORTS, physicianName, nursingHomeName) {
   
    if(APP.APIHOST === "https://www.doc-nock.com"){
        APIHOST = "https://docnock.page.link"
    }else{
        APIHOST = "http://localhost:4200"

    }
    
  let text = `
  <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dock Nock Email Template</title>
    
        <style>
            @media (max-width: 576px){
                section{
                    width: auto !important;
                }
                .box{
                    max-width: none !important;
                    width: 100% !important;
                }
                .innerBox{
                    max-width: 255px !important;
                }
            }
        </style>
    </head>
    <body style="background-color: #F9F9F9; width: 100% !important; height: 100vh; margin: 0; padding: 0;">
        <section style="border-right: 1px solid #DDDDDD; border-left: 1px solid #DDDDDD; width: 500px;  height: 100vh; margin: auto;">
            <div class="box" style="max-width: 500px; margin: 0 auto; background-color: #F9F9F9;">
                <div style="width: 100%; padding-top: 10px; text-align: center; position: relative; padding-bottom: 185px; height: 100%; background-image: url(${APP.APIHOST}:${PORTS.API_PORT}/public/upload/welcome_bg.png); background-repeat: no-repeat; background-size: cover;" >
                    <div>
                        <div>
                            <img src="${APP.backEndURL}:${PORTS.API_PORT}/public/upload/login.png" style="margin-bottom: 20px; width: 85px; margin-top: 20px;" alt="Logo">
                        </div>
                    </div>
        
                    <div class="innerBox" style="max-width: 300px; width: 100%; margin: auto; background-color: #fff; border-radius: 10px; padding: 20px; position: absolute; left: 50%; transform: translateX(-50%);     bottom: -200px;">
                        <h1 style="font-size: 32px; color: #272727; font-weight: 600; margin-top: 0; margin-bottom: 0;">Nursing Home Assigned Notification!</h1>
                        <p style="font-size: 15px; font-weight: 300; color: #656565; margin-top: 25px;">Dear User ${physicianName}, You have been assigned to the new nursing home ${nursingHomeName} </p>
                       
                        
                        
                    </div>
                </div>
            </div>
        </section>
    </body>
    </html>
    `;

  return text;
}


async function physicianRemoveMail(APP, PORTS, physicianName, nursingHomeName) {
   
    if(APP.APIHOST === "https://www.doc-nock.com"){
        APIHOST = "https://docnock.page.link"
    }else{
        APIHOST = "http://localhost:4200"

    }
    
    
  let text = `
  <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dock Nock Email Template</title>
    
        <style>
            @media (max-width: 576px){
                section{
                    width: auto !important;
                }
                .box{
                    max-width: none !important;
                    width: 100% !important;
                }
                .innerBox{
                    max-width: 255px !important;
                }
            }
        </style>
    </head>
    <body style="background-color: #F9F9F9; width: 100% !important; height: 100vh; margin: 0; padding: 0;">
        <section style="border-right: 1px solid #DDDDDD; border-left: 1px solid #DDDDDD; width: 500px;  height: 100vh; margin: auto;">
            <div class="box" style="max-width: 500px; margin: 0 auto; background-color: #F9F9F9;">
                <div style="width: 100%; padding-top: 10px; text-align: center; position: relative; padding-bottom: 185px; height: 100%; background-image: url(${APP.APIHOST}:${PORTS.API_PORT}/public/upload/welcome_bg.png); background-repeat: no-repeat; background-size: cover;" >
                    <div>
                        <div>
                            <img src="${APP.backEndURL}:${PORTS.API_PORT}/public/upload/login.png" style="margin-bottom: 20px; width: 85px; margin-top: 20px;" alt="Logo">
                        </div>
                    </div>
        
                    <div class="innerBox" style="max-width: 300px; width: 100%; margin: auto; background-color: #fff; border-radius: 10px; padding: 20px; position: absolute; left: 50%; transform: translateX(-50%);     bottom: -200px;">
                        <h1 style="font-size: 32px; color: #272727; font-weight: 600; margin-top: 0; margin-bottom: 0;">Nursing Home De-Assigned Notification!</h1>
                        <p style="font-size: 15px; font-weight: 300; color: #656565; margin-top: 25px;">Dear User ${physicianName}, You have been removed from the nursing home ${nursingHomeName}</p>
                       
        
                       
                    </div>
                </div>
            </div>
        </section>
    </body>
    </html>
    `;

  return text;
}








module.exports = {
  signUpEmail,
  forgetEmail,
  physicianAssigMail,physicianRemoveMail,
  createDynamicLink,
  createDynamicLinkSetupProfile,
  generateMessageSignup,
  generateMessageForget

};
