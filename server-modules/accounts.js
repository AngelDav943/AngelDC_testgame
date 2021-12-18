let fs = require('fs');
let firebase = require('firebase-admin');

let cookiemanager = require(`${__dirname}/cookies.js`);
let hash = require("sha256");
let saved_userdata = [];
let change_data_cooldown = false;

firebase.initializeApp({
    credential: firebase.credential.cert({
        "type": process.env['type'],
        "project_id": process.env['project_id'],
        "private_key_id": process.env['private_key_id'],
        "private_key": process.env['private_key'],
        "client_email": process.env['client_email'],
        "client_id": process.env['client_id'],
        "auth_uri": process.env['auth_uri'],
        "token_uri": process.env['token_uri'],
        "auth_provider_x509_cert_url": process.env['auth_provider_x509_cert_url'],
        "client_x509_cert_url": process.env['client_x509_cert_url']
    })
});

const firestore = firebase.firestore();

String.prototype.hashCode = function(seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i=0, ch; i<this.length; i++) {
        ch=this.charCodeAt(i);
        h1=Math.imul(h1^ch,2654435761);
        h2=Math.imul(h2^ch,1597334677);
    }
    h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
    return 4294967296*(2097151 & h2)+(h1>>>0);
};

module.exports = { // password needs to be already hashed
    reloaduserdata() {
        saved_userdata = [];
        Object.keys(require.cache).forEach(key => { 
            delete require.cache[key]
        })
    },

    changeuserdata(uid,newdata) {
        return new Promise(function(resolve, reject) {
            if (!change_data_cooldown) {
                change_data_cooldown = true
                module.exports.verifyuser(uid).then(user => {
                    var user_newdata = user;
                    for (let index in newdata) {
                        let datavalue = newdata[index]
                        datavalue = datavalue.replace(/<LINEBREAK>/g,"°&br°&")
                        datavalue = datavalue.replace(/[^\u0000-\u00ff]/g,"").replace(/</g,"").replace(/>/g,"").replace(/\//g,"")
                        if (index == "description") datavalue = datavalue.replace(/°&br°&/g,"<br>")
                        if ((index == "displayname" || index == "description") && datavalue != "") {
                            if (index == "displayname") datavalue = datavalue.substring(0,20)
                            user_newdata[index] = datavalue
                        }
                    }
                    firestore.collection("users").doc(user.documentid).set(user_newdata).then(doc => {
                        module.exports.reloaduserdata();
                        resolve(user_newdata)
                    })
                })
                setInterval(() => {
                    change_data_cooldown = false
                },5000)
            }
        });
    },

    verifyuser(uid) {
        return new Promise(function(resolve, reject) {
            module.exports.getAllUsers().then(users => {
                let u;
                if (uid && uid != "") users.forEach(user => {
                    var idusr = hash(user.name.toString() + user.pass.toString() + user.invkey.toString()) + hash( "n" + user.id) + hash(user.invkey)
                    if (uid == idusr) {
                        let userreturn = user
                        u = userreturn
                    }
                })
                resolve(u)
            })
        });
    },
    
    loginUser(req, name, pass) { // this login
        return new Promise(function(resolve, reject) {
            let uid
            pass = hash(pass.hashCode().toString());

            module.exports.getUser(name).then(user => {
                if (user) {
                    console.log("user found. trying to log in");
                    uid = hash(name.toString() + pass.toString() + user.invkey.toString()) + hash("n" + user.id) + hash(user.invkey)
                    
                    module.exports.verifyuser(uid, name, pass, user.id).then(verifieduser => {
                        if (verifieduser) {
                            console.log(user.name + " user logged in!");
                            resolve("uid=" + uid + ";");
                        } else {
                            console.log("user didnt log in")
                        }
                    })
                }
            });
        })
    },

    async getUserByUID(uid) {
        return new Promise(function(resolve, reject) {
            let returnuser
            module.exports.getAllUsers().then(usercontent => {
                if (uid && uid != "") usercontent.forEach( (user, index) => {
                    if (user.pass) var idusr = hash(user.name.toString() + user.pass.toString() + user.invkey.toString()) + hash( "n" + user.id) + hash(user.invkey)
                    if (uid == idusr) {
                        returnuser = user;
                        return user;
                    }
                });
            }).then( user => {
                resolve(returnuser)
            });
        })
    },

    async getUserByID(userid) {
        return new Promise(function(resolve, reject) {
            module.exports.getAllUsers().then(users => {
                users.forEach(currentuser => {
                    if (currentuser.id == userid) {
                        resolve(currentuser)
                    }
                })
            });
        });
    },

    async getUser(name) {
        return new Promise(function(resolve, reject) {
            module.exports.getAllUsers().then(users => {
                users.forEach(currentuser => {
                    if (currentuser.name == name) {
                        let user = currentuser;
                        resolve(user)
                    }
                })
            });
        });
    },

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            if (saved_userdata.length == 0) {
                firestore.collection("users").listDocuments().then(documentRefs => {
                    return firestore.getAll(...documentRefs);
                }).then(documentSnapshots => {
                    let users = [];
                    for (let documentSnapshot of documentSnapshots) {
                        if (documentSnapshot.exists) {
                            let user = documentSnapshot.data();
                            user.documentid = documentSnapshot.id
                            users[user.id] = (user);
                        }
                    }
                    saved_userdata = users
                    resolve(users)
                });
            }
            if (saved_userdata.length > 0) resolve(saved_userdata)
        })
    }
}