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
    generateAPIKey: generateAPIKey


};

module.exports = session;


