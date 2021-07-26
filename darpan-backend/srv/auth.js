const cds = require("@sap/cds");

class User extends cds.User {
  is(_role) {
    if (_role.toLowerCase() == `user`) return true;
    else return false;
  }
}

class Admin extends cds.User {
  is(_role) {
    if (_role.toLowerCase() == `admin`) return true;
    else return false;
  }
}

module.exports = (req, res, next) => {
  if (req.JWTpayload && req.JWTpayload.admin)
    req.user = new Admin(req.JWTpayload.username);
  else req.user = new User(req.JWTpayload.username);
  next();
};
