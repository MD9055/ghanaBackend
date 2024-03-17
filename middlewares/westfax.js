const fetch = require("fetch").fetchUrl;
const responses = require("../constant");
const {
  GetAccountInfo,
  GetProductList,
  authenticateUser,
  GetFaxToEmailProductList,
  GetF2EProductDetailAPI,
  sendFaxApi,
  authenticateUserForID,
  Fax_GetFaxIdentifiersFunction,
  Fax_GetFaxDescriptionsFunction
} = require("./westfaxAPI_functions");


/* 
Function to Authenticate the product ID
*/

async function Security_Authenticate_ProductID(req, res){
  try{
    let {Username, Password, Cookies} = req.body;

    let securityCheckForID = await authenticateUserForID(
      Username,
      Password,
      Cookies,
      
    );
    res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: securityCheckForID.data,
    });

  }catch(e){
    throw e

  }
}

/* 
Function to Checkout the Security Authentication

Input - Username, Password, Cookies

Output - Security Token With Data
*/

async function Security_Authenticate(req, res) {
  try {
    
    let { Username, Password, Cookies } = req.body;

    let dyamicProductId =  await authenticateUserForID(Username, Password, Cookies)
    let securityCheck = await authenticateUser(
      Username,
      Password,
      Cookies,
      dyamicProductId.data.Result
    );
    res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: securityCheck.data
    });
  } catch (e) {
    throw e
  }
}



/* 
Function to retreive the profile and account information
*/
async function Profile_GetAccountInfoAPI(req, res) {
  try {
    let { Username, Password, Cookies, ProductId } = req.body;

    let accountInfo = await GetAccountInfo(
      Username,
      Password,
      Cookies,
      ProductId
    );

    res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: accountInfo.data,
    });
  } catch (error) {
    throw error
  }
}


/* 
Function to get the product list
*/

async function Profile_GetProductList(req, res) {
  try {
    let { Username, Password, Cookies } = req.body;

    let productList = await GetProductList(Username, Password, Cookies);

    res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: productList.data,
    });
  } catch (error) {
    throw error
  }
}

/* 
Function to get profile product list
*/

async function Profile_GetF2EProductList(req, res) {
  try {
    let { Username, Password, Cookies } = req.body;

    let faxToEmailProductList = await GetFaxToEmailProductList(
      Username,
      Password,
      Cookies
    );

    res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: faxToEmailProductList.data,
    });
  } catch (error) {
    throw error
  }
}


/* 
Function to get profile product Details
*/
async function Profile_GetF2EProductDetail(req, res) {
  try {
    let { Username, Password, Cookies } = req.body;

    let faxToEmailProductDetails = await GetF2EProductDetailAPI(
      Username,
      Password,
      Cookies
    );

    res.json({
      status: responses.SUCCESS,
      messageID: responses.SUCCESS_CODE,
      message: responses.FETCH_SUCCESS,
      data: faxToEmailProductDetails.data,
    });
  } catch (error) {
    throw error
  }
}


/* 
Function to send the fax to the receipants
*/
async function sendWestFax(req, res) {
  try {
    
    
    const {
      Username,
      Password,
      Cookies,
      JobName,
      Header,
      BillingCode,
      Numbers1,
      Numbers2,
      FeedbackEmail,
    } = req.body;
  

let fileName = {
  Files0:req.file
}
    let sendfaxToNumber = await sendFaxApi(
      Username,
      Password,
      Cookies,
      JobName,
      Header,
      BillingCode,
      Numbers1,
      Numbers2,
      fileName.Files0,
      FeedbackEmail
    );

    if (sendfaxToNumber.data.Success == false) {
      res.jsonp({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.REQUIRED_FIELDS_MISSING,
        data: sendfaxToNumber.data,
      });
    }
    if (sendfaxToNumber.data.Success == true) {
      res.jsonp({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: sendfaxToNumber.data,
      });
    }
  } catch (error) {
    throw error
  }
}


/* 
Function to get the fax indentifiers
*/

async function Fax_GetFaxIdentifiers(req, res){
  try{
    const {Username, Password, Cookies, StartDate, FaxDirection} = req.body
    let data = await GetF2EProductDetailAPI(Username, Password,Cookies )
    let productId = data.data.Result.Id

    let faxIdentifiers = await Fax_GetFaxIdentifiersFunction(Username,Password,Cookies,productId,StartDate,FaxDirection)

    if (faxIdentifiers.data.Success == false) {
      res.jsonp({
        status: responses.ERROR,
        messageID: responses.ERROR_CODE,
        message: responses.REQUIRED_FIELDS_MISSING,
        data: faxIdentifiers.data,
      });
    }
    if (faxIdentifiers.data.Success == true) {
      res.jsonp({
        status: responses.SUCCESS,
        messageID: responses.SUCCESS_CODE,
        message: responses.FETCH_SUCCESS,
        data: faxIdentifiers.data,
      });
    }



  }catch(err){
    throw err
  }
}



/* 
Function to get the fax Description
*/


async function Fax_GetFaxDescriptions(req, res){
  try{
      const {Username,Password, Cookies, StartDate, FaxDirection} = req.body
     
      let data = await GetF2EProductDetailAPI(Username, Password,Cookies )
      let productId = data.data.Result.Id

      let faxDescription = await Fax_GetFaxDescriptionsFunction(Username,Password,Cookies,productId,StartDate,FaxDirection)

      

   

  }catch(err){
    throw err
  }
}

module.exports = {
  Security_Authenticate: Security_Authenticate,
  Profile_GetAccountInfoAPI: Profile_GetAccountInfoAPI,
  Profile_GetProductList: Profile_GetProductList,
  Profile_GetF2EProductList: Profile_GetF2EProductList,
  Profile_GetF2EProductDetail: Profile_GetF2EProductDetail,
  sendWestFax: sendWestFax,
  Security_Authenticate_ProductID:Security_Authenticate_ProductID,
  Fax_GetFaxIdentifiers:Fax_GetFaxIdentifiers,
  Fax_GetFaxDescriptions:Fax_GetFaxDescriptions
};
