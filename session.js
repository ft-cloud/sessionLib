var uuid = require('uuid');
const generateAPIKey = function generateAPIToken(user, usedBy, callback) {

    const session = uuid.v4();

    var sql = `INSERT INTO session (uuid,user,timeout,token,usedBy) VALUES (?, ?, DATE_ADD(now(),interval 10 minute),1,?)`;
    global.connection.query(sql,[session,user,usedBy], function (err, result) {
        if (err) throw err;
        callback(session);
    });

};
var session = {
    startsession: function (user,interval = 10) {

        const session = uuid.v4();
        var newDateObj = new Date(Date.now() + interval*60000);
        console.log(newDateObj.toISOString().slice(0, 19).replace('T', ' '))

        var sql = `INSERT INTO session (uuid,user,timeout) VALUES (?, ?, ?)`;
        global.connection.query(sql,[session,user,newDateObj.toISOString().slice(0, 19).replace('T', ' ')], function (err, result) {
            if (err) throw err;
        });
        console.log(sql)
        return session;

    },

    reactivateSession: function (session) {

        var sql = `UPDATE session SET timeout = DATE_ADD(now(),interval 10 minute) WHERE uuid = ?`;
        global.connection.query(sql,[session], function (err, result) {
            if (err) throw err;
        });
    },


    getUserUUID: function (session, callback) {


        var sql = `SELECT user FROM session WHERE uuid=?;`;
        global.connection.query(sql,[session], function (err, result) {

            if (result && result[0]) {
                callback(result[0].user);

            } else {

                callback(undefined);

            }


        });


    },


    deleteSession: function (session) {

        return new Promise((resolve) => {
            var sql = `delete from session where uuid=?`;

            global.connection.query(sql,[session], function (err, result) {
                if (err) throw err;

                resolve(`{\"success\":\"loged out\"}`);

                //TODO return error when no session is available

            });
        })



    },


    validateSession: function (session, callback) {

        var sql = `SELECT * FROM session WHERE uuid = ?;`;

        global.connection.query(sql,[session.toString()], function (err, result) {
            if (result && result[0]) {
                callback(true);

            } else {

                callback(false);

            }


        });


    },
    generateAPIKey: generateAPIKey


};

module.exports = session;


