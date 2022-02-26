import {v4 as uuidV4} from "uuid";

const generateAPIKey = function generateAPIToken(userUUID, usedBy, callback) {

    const sessionUUID = uuidV4();
    const session = global.database.collection("session");
    session.insertOne({
        uuid: sessionUUID,
        user: userUUID,
        timeout: Date.now()+1000*60*10,
        isToken: true,
        usedBy: usedBy

    }).then(()=> {
        callback(sessionUUID);

    })


};
export const session = {
    startsession: function (user,interval = 30) {

      return new Promise((resolve,reject) => {

          const sessionUUID = uuidV4();
          const session = global.database.collection("session");

          const account = global.database.collection("account")

          account.findOne({uuid: user}).then((userEntry)=> {
              if (userEntry) {
                  if(userEntry.verified) {
                      session.insertOne({
                          uuid: sessionUUID,
                          user:user,
                          timeout: Date.now()+interval*60*1000
                      })

                      resolve({success: true,session:sessionUUID});
                  }else{
                      resolve({success: false,error:"016"});

                  }
              }
          })


      })


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


    isUserDeveloper: function(accountUUID) {
        return new Promise(((resolve, reject) => {

            const account = global.database.collection("account");
            account.findOne({uuid: accountUUID}).then((account)=>{

                if(account!=null&&account.developer!=null&&account.developer===true) {
                    resolve(true);
                }else{
                    resolve(false);
                }

            })

        }));
    },

    transformSecurelySessionToUserUUID: function(res, req) {
      return new Promise((resolve => {

          if (req.query.session!=null||req.body.session!=null||req.body.apiKey!=null||req.query.apiKey!=null||req.cookies.session!=null||req.cookies.apiKey!=null) {
              let apiKey;
              if(req.query.session!=null) {
                  apiKey = req.query.session
              }else if(req.body.session!=null){
                  apiKey = req.body.session
              }else if(req.body.apiKey!=null){
                  apiKey = req.body.apiKey
              }else if(req.query.apiKey!=null){
                  apiKey = req.query.apiKey
              }else if(req.cookies.session!=null) {
                  apiKey = req.cookies.session
              }else if(req.cookies.apiKey!=null) {
                  apiKey = req.cookies.apiKey
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




