var uuid = require('uuid');
const generateAPIKey = function generateAPIToken(userUUID, usedBy, callback) {

    const sessionUUID = uuid.v4();
    const session = global.database.collection("session");
    session.insertOne({
        uuid: sessionUUID,
        user: userUUID,
        timeout: Date.now()+1000*60*10,
        isToken: true,
        usedBy: usedBy

    }).then(()=> {
        callback(session);

    })


};
var session = {
    startsession: function (user,interval = 30) {

        const sessionUUID = uuid.v4();
        const session = global.database.collection("session");

        session.insertOne({
            uuid: sessionUUID,
            user:user,
            timeout: Date.now()+interval*60*1000
        })

        return sessionUUID;

    },

    reactivateSession: function (sessionUUID) {
        const session = global.database.collection("session");
        session.updateOne({uuid:sessionUUID,timeout: {$lte: Date.now()+1000*60*10}},{$set: {timeout: Date.now()+1000*60*30}})

    },


    getUserUUID: function (sessionUUID, callback) {

        const session = global.database.collection("session");
        session.findOne({uuid:sessionUUID}).then(result=>{
            if(result!==null) {
                callback(result.user)
            }else{
                callback(undefined);
            }
        })


    },


    deleteSession: function (sessionUUID) {

        return new Promise((resolve) => {
            const session = global.database.collection("session");
            session.deleteOne({uuid: sessionUUID}).then(()=>{
                resolve(`{\"success\":\"loged out\"}`);
            })
        })



    },


    validateSession: function (sessionUUID, callback) {

        const session = global.database.collection("session");
        session.findOne({uuid:sessionUUID}).then(res=>{
            callback(res!==null);
        })

    },

    transformSecurelySessionToUserUUID: function(res, req) {
      return new Promise((resolve => {

          if (req.query.session!=null||req.body.session!=null||req.body.apiKey!=null||req.query.apiKey!=null) {
              let apiKey;
              if(req.query.session!=null) {
                  apiKey = req.query.session
              }else if(req.body.session!=null){
                  apiKey = req.body.session
              }else if(req.body.apiKey!=null){
                  apiKey = req.body.apiKey
              }else if(req.query.apiKey!=null){
                  apiKey = req.query.apiKey
              }
              session.validateSession(apiKey.toString(), (isValid) => {
                  if (isValid) {
                      session.reactivateSession(apiKey);
                      session.getUserUUID(apiKey.toString(), (uuid) => {
                          if (uuid) {
                            resolve(uuid);


                          } else {
                              res.status(400).json({error:"No valid account!",errorcode:"006"})
                              resolve(undefined);

                          }

                      });

                  } else {
                      res.status(401).json({error:"No valid session!",errorcode:"006"})
                      resolve(undefined);

                  }
              });
          } else {
              res.status(400).json({error:"No valid inputs!",errorcode:"002"})
              resolve(undefined);

          }

      }))
    },

    generateAPIKey: generateAPIKey


};

module.exports = session;


