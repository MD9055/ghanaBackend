const locationModel  = require('../model/geoLocationUsers')

async function saveLiveLocation(req, res){
    try{



       
          global.navigator.geolocation.getCurrentPosition((data) => {
          });

  

        let saveLoationData = new locationModel({
            userId : req.user._id

        })

    }catch(err){
        throw err;
    }
}







module.exports = {
    saveLiveLocation:saveLiveLocation
}