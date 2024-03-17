"use strict";

let url = "mongodb://pradeepmeandev:K8CqVJkiYC4iL3U9@122.161.52.44/ghanaDoc"

const config = {
  local: {
    DB: {
      HOST: "127.0.0.1",
      PORT: "27017",
      DATABASE: "carecomtool",
      MONGOOSE: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      },
    },

    // DB: {
    //   HOST: "34.223.146.53",
    //   PORT: "27017",
    //   DATABASE: "Docnock",
    //   MONGOOSE: {
    //     useUnifiedTopology: true,
    //     useNewUrlParser: true,
    //   },
    //   UserName: "Docnock",
    //   Password: "DFGocn45tgock",
    // },

    EMAIL: {
      host: "smtp.gmail.com",
      user: "no_reply@doc-nock.com",
      password: "ugkhwtbwinuyrfuu",
      // api_key: "c89d3026957c30426647bf29fb1d9739-787e6567-2c7f8802",
      // domain: "sandbox9988bd48331f43679a9b038e8ecd3420.mailgun.org"
    },
    // EMAIL: {
    //   host: "smtp.gmail.com",
    //   user: "docnockservices@gmail.com",
    //   password: "vmpgloaiwzardvat",
    //   // api_key: "c89d3026957c30426647bf29fb1d9739-787e6567-2c7f8802",
    //   // domain: "sandbox9988bd48331f43679a9b038e8ecd3420.mailgun.org"
    // },

    TWILIONUMBER:{
      from_number:"+18335397346",
      SID:"ACeca6fe2e8acce81eb94ce6ba223e8992",
      TOKEN:"5112ae6d46cf79ff34b5f6064bfc2bc3"
    },

    TElNYX:{
      FROM_NUMBER : "+14108868449",
      APIKEY:"KEY018AD49A932188AE5A732DD33C609CFD_0pAU9yk99VRk1b30KBltgQ",
      SECRET:"Z/Mxk+BeySjnpLbSaWTN0+jv12kkPgBBA+YBvDKnbK0="
    },

    

    TWILLIO_ACCOUNT: {
      AccountSID: "AC0d8c65e2cb60fc45c6a9e35579076634",
      AUTH_TOKEN: "1034edc7d2290e1d6ffaefc8ac11e8ad",
      TWILLIO_NUMBER: "+16184238424",
    },

    SOCKETURL: {
      apiURL: "http://localhost:4200",
    },
    SERVERKEY: {
      firebaseServerKey:
        "AAAA9jOcxlw:APA91bFiD3GT3WrZosA8wW0cp9Hl3uA8PrJHRCTmNrGPnHsSYpu6VsfrBtpltyyhRnn01DKo38RPPD3A4jFUQhJdZsxQPqKIWEPSlqLYfDElbZkcsPHboybej7CDniky2uaR1FCMo8Ic",
    },
    SECRETKEY: "deepData",
    APP: {
      URL: "localhost",
      APIHOST: "http://localhost:4200",
      backEndURL:"http://localhost"
    },
    PORTS: {
      API_PORT: 4001,
      EMAIL_PORT: 4200,
     
    },
  },

  
  stagging: {
    DB: {
      HOST: "122.161.52.44",
      PORT: "27017",

      // HOST: "localhost",
      // PORT: "27017",
      DATABASE: "ghanaDoc",
      MONGOOSE: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      },
      UserName: "pradeepmeandev",
      Password: "K8CqVJkiYC4iL3U9",
    },
    // EMAIL: {
    //   host: "smtp.gmail.com",
    //   user: "carecomtool@gmail.com",
    //   password: "mvaeoujxpwblkpko",

    //   // api_key: "c89d3026957c30426647bf29fb1d9739-787e6567-2c7f8802",
    //   // domain: "sandbox9988bd48331f43679a9b038e8ecd3420.mailgun.org"
    // },

    EMAIL: {
      host: "smtp.gmail.com",
      user: "no_reply@doc-nock.com",
      password: "ugkhwtbwinuyrfuu",
      // api_key: "c89d3026957c30426647bf29fb1d9739-787e6567-2c7f8802",
      // domain: "sandbox9988bd48331f43679a9b038e8ecd3420.mailgun.org"
    },

    SOCKETURL: {
      apiURL: "http://54.190.192.105:9133"

    },
    TWILIONUMBER:{
      from_number:"+18335397346",
      SID:"ACeca6fe2e8acce81eb94ce6ba223e8992",
      TOKEN:"5112ae6d46cf79ff34b5f6064bfc2bc3"
    },

    TElNYX:{
      FROM_NUMBER : "+14108868449",
      APIKEY:"KEY018AD49A932188AE5A732DD33C609CFD_0pAU9yk99VRk1b30KBltgQ",
      SECRET:"Z/Mxk+BeySjnpLbSaWTN0+jv12kkPgBBA+YBvDKnbK0="
    },


    SERVERKEY: {
      firebaseServerKey: "AAAA9jOcxlw:APA91bFiD3GT3WrZosA8wW0cp9Hl3uA8PrJHRCTmNrGPnHsSYpu6VsfrBtpltyyhRnn01DKo38RPPD3A4jFUQhJdZsxQPqKIWEPSlqLYfDElbZkcsPHboybej7CDniky2uaR1FCMo8Ic"
    },

    TWILLIO_ACCOUNT: {
      // AccountSID :"AC0d8c65e2cb60fc45c6a9e35579076634",
      // AUTH_TOKEN: "1034edc7d2290e1d6ffaefc8ac11e8ad",
      // TWILLIO_NUMBER:"+16184238424"

      TWILIO_ACCOUNT_SID: "AC1de448195995d84ba8c3f37292ec2a9b",
      TWILIO_AUTH_TOKEN: "ff41ff22c4f0cb5e191b3a4494b9893b",
      TWILIO_API_KEY_SID: "SK19ee5255738a5700c1f6a4a8af3833f6",
      TWILIO_API_KEY_SECRET: "qaxhmcGhGgInucwZZn9lLUVWHWlVcItq"
    },



    SECRETKEY: "deepData",
    APP: {
      URL: "54.190.192.105",
      APIHOST: "http://54.190.192.105:9133",
      backEndURL:"http://54.190.192.105"

    },
    PORTS: {
      API_PORT: 9134,
      EMAIL_PORT: 9133,

    },
  },
  production: {
    DB: {
      HOST: "34.223.146.53",
      PORT: "27017",
      DATABASE: "Docnock",
      MONGOOSE: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      },
      UserName: "Docnock",
      Password: "DFGocn45tgock",
    },

    TWILIONUMBER:{
      from_number:"+18335397346",
      SID:"ACeca6fe2e8acce81eb94ce6ba223e8992",
      TOKEN:"5112ae6d46cf79ff34b5f6064bfc2bc3"
    },

    TElNYX:{
      FROM_NUMBER : "+14108868449",
      APIKEY:"KEY018AD49A932188AE5A732DD33C609CFD_0pAU9yk99VRk1b30KBltgQ",
      SECRET:"Z/Mxk+BeySjnpLbSaWTN0+jv12kkPgBBA+YBvDKnbK0="
    },


    // EMAIL: {
    //   host: "smtp.gmail.com",
    //   user: "carecomtool@gmail.com",
    //   password: "mvaeoujxpwblkpko",
    // },

    EMAIL: {
      host: "smtp.gmail.com",
      user: "no_reply@doc-nock.com",
      password: "ugkhwtbwinuyrfuu",
      // api_key: "c89d3026957c30426647bf29fb1d9739-787e6567-2c7f8802",
      // domain: "sandbox9988bd48331f43679a9b038e8ecd3420.mailgun.org"
    },

    SOCKETURL: {
      apiURL: "https://www.doc-nock.com",
    },

    SERVERKEY: {
      firebaseServerKey:
        "AAAA9jOcxlw:APA91bFiD3GT3WrZosA8wW0cp9Hl3uA8PrJHRCTmNrGPnHsSYpu6VsfrBtpltyyhRnn01DKo38RPPD3A4jFUQhJdZsxQPqKIWEPSlqLYfDElbZkcsPHboybej7CDniky2uaR1FCMo8Ic",
    },

    TWILLIO_ACCOUNT: {
      TWILIO_ACCOUNT_SID: "AC7176fffcdc2f4c96744e6cd1f45a1c1f",
      TWILIO_AUTH_TOKEN: "be266240553b3b4816722ae9779e0b86",
      TWILIO_API_KEY_SID: "SKf5a87c201a203a00100337a62a927086",
      TWILIO_API_KEY_SECRET: "5QiI8mkEGgJLOeQ83f63h3gaMn6uXwJE",
    },

    SECRETKEY: "deepData",
    APP: {
      URL: "http://34.223.146.53",
      APIHOST: "https://www.doc-nock.com",
      backEndURL:"http://34.223.146.53"

    
    },
    PORTS: {
      API_PORT: 9134,

    },
  },
};

module.exports.get = function get(env) {
  return config[env] || config.default;
};
