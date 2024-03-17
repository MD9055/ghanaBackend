const { File } = require("@babel/core");
var axios = require("axios");
var FormData = require("form-data");
const fs = require('fs');
const path = require("path");
let Url = "https://api2.westfax.com";
let RespEnc = "JSON";
const responses = require("../constant");

async function GetProductList(Username, Password, Cookies) {
  try {
    var data = new FormData();
    data.append("Username", Username);

    data.append("Password", Password);
    data.append("Cookies", Cookies);

    let response = await axios.post(
      `${Url}/REST/Profile_GetProductList/${RespEnc}`,

      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept-Encoding": "compress",
        },
      }
    );

    return response;
  } catch (error) {
    throw error
  }
}

async function GetAccountInfo(Username, Password, Cookies, ProductId) {
  try {
    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);
    data.append("ProductId", ProductId);
    let response = await axios.post(
      `${Url}/REST/Profile_GetAccountInfo/${RespEnc}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept-Encoding": "compress",
        },
      }
    );

    return response;
  } catch (error) {
    throw error
  }
}

async function authenticateUserForID(Username, Password, Cookies) {
  try {
    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);

    let response = await axios.post(
      `${Url}/REST/Security_Authenticate/${RespEnc}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept-Encoding": "compress",
        },
      }
    );

    return response;
  } catch (e) {
    throw e
  }
}

async function authenticateUser(Username, Password, Cookies, ProductId) {
  try {
    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);
    data.append("ProductId", ProductId);
    let response = await axios.post(
      `${Url}/REST/Security_Authenticate/${RespEnc}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept-Encoding": "compress",
        },
      }
    );

    return response;
  } catch (e) {
    throw e
  }
}

async function GetFaxToEmailProductList(Username, Password, Cookies) {
  try {
    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);

    let response = await axios.post(
      `${Url}/REST/Profile_GetF2EProductList/${RespEnc}`,

      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept-Encoding": "compress",
        },
      }
    );

    return response;
  } catch (error) {
    throw error
  }
}

async function GetF2EProductDetailAPI(Username, Password, Cookies) {
  try {
    let productId;
    let product = await GetFaxToEmailProductList(Username, Password, Cookies);
    product.data.Result.forEach((ele) => {
      productId = ele.Id;
    });

    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);
    data.append("ProductId", productId);

    let response = await axios.post(
      `${Url}/REST/Profile_GetF2EProductDetail/${RespEnc}`,

      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept-Encoding": "compress",
        },
      }
    );

    return response;
  } catch (error) {
    throw error
  }
}

async function sendFaxApi(
  Username, Password, Cookies, JobName, Header, BillingCode, Numbers1, Numbers2, Files0, FeedbackEmail) {

  try {
    
    let productDetails = await GetF2EProductDetailAPI(
      Username,
      Password,
      Cookies
    );

    let productDetailsData = {
      CSID: productDetails.data.Result.OutboundCSID,
      ANI: productDetails.data.Result.OutboundANI,
      StartDate: new Date().getTime(),
    };


    let reqPath = path.join(__dirname, '../')
    let imageData = fs.createReadStream(`${reqPath}public/upload/${Files0.filename}`)





    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);
    data.append("ProductId", productDetails.data.Result.Id);
    data.append("JobName", JobName);
    data.append("Header", Header);
    data.append("BillingCode", BillingCode);
    data.append("Numbers1", Numbers1);
    data.append("Numbers2", Numbers2);
    data.append("Files0", imageData);
    data.append("CSID", productDetailsData.CSID);
    data.append("ANI", productDetailsData.ANI);
    data.append("StartDate", productDetailsData.StartDate);
    data.append("FaxQuality", "Fine");
    data.append("FeedbackEmail", FeedbackEmail);
    data.append("CallbackUrl", "[get]http://yourweburl.com/{@jobid}?prod={@prodid}&dir={@dir}")
    let response = await axios.post(
      `${Url}/REST/Fax_SendFax/${RespEnc}`,

      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",

          "Accept-Encoding": "compress",
        },
      }
    );



    return response;

  } catch (error) {
    let response = {
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.FETCH_SUCCESS,
      data: error,
    };
    return response;
  }
}



async function sendFaxApiReturn(
  Username, Password, Cookies, JobName, Header, BillingCode, Numbers1, Numbers2, Files0, FeedbackEmail) {

  try {

    let productDetails = await GetF2EProductDetailAPI(
      Username,
      Password,
      Cookies
    );

    let productDetailsData = {
      CSID: productDetails.data.Result.OutboundCSID,
      ANI: productDetails.data.Result.OutboundANI,
      StartDate: new Date().getTime(),
    };

    let reqPath = path.join(__dirname, '../')
   
    let imageData = fs.createReadStream(Files0)

    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);
    data.append("ProductId", productDetails.data.Result.Id);
    data.append("JobName", JobName);
    data.append("Header", Header);
    data.append("BillingCode", BillingCode);
    data.append("Numbers1", Numbers1);
    data.append("Numbers2", Numbers2);
    data.append("Files0", imageData);
    data.append("CSID", productDetailsData.CSID);
    data.append("ANI", productDetailsData.ANI);
    data.append("StartDate", productDetailsData.StartDate);
    data.append("FaxQuality", "Fine");
    data.append("FeedbackEmail", FeedbackEmail);
    data.append("CallbackUrl", "[get]http://yourweburl.com/{@jobid}?prod={@prodid}&dir={@dir}")
    let response = await axios.post(
      `${Url}/REST/Fax_SendFax/${RespEnc}`,

      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",

          "Accept-Encoding": "compress",
        },
      }
    );



    return response;

  } catch (error) {
    let response = {
      status: responses.ERROR,
      messageID: responses.ERROR_CODE,
      message: responses.FETCH_SUCCESS,
      data: error,
    };
    return response;
  }
}

async function Fax_GetFaxIdentifiersFunction(Username, Password, Cookies, productId, StartDate, FaxDirection) {
  try {
    var data = new FormData();
    data.append("Username", Username);
    data.append("Password", Password);
    data.append("Cookies", Cookies);
    data.append("ProductId", productId);
    data.append("StartDate", StartDate);
    data.append("FaxDirection", FaxDirection);

    let response = await axios.post(
      `${Url}/REST/Fax_GetFaxIdentifiers/${RespEnc}`,

      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept-Encoding": "compress",
        },
      }
    );

    return response;
  } catch (err) {

  }




}
module.exports = {
  authenticateUser: authenticateUser,
  GetAccountInfo: GetAccountInfo,
  GetProductList: GetProductList,
  GetFaxToEmailProductList: GetFaxToEmailProductList,
  GetF2EProductDetailAPI: GetF2EProductDetailAPI,
  sendFaxApi: sendFaxApi,
  sendFaxApiReturn:sendFaxApiReturn,
  authenticateUserForID: authenticateUserForID,
  Fax_GetFaxIdentifiersFunction: Fax_GetFaxIdentifiersFunction,
  // Fax_GetFaxDescriptionsFunction:Fax_GetFaxDescriptionsFunction
};
