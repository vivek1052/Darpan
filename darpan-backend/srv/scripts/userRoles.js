const cds = require("@sap/cds");

module.exports.User = class extends cds.User {
    is(_role) {
        if (_role.toLowerCase() == `user`) return true;
        else return false;
    }
}

module.exports.Admin = class extends cds.User {
    is(_role) {
        if (_role.toLowerCase() == `admin`) return true;
        else return false;
    }
}