const cds = require("@sap/cds");
const jwt = require(`jsonwebtoken`);
const cookieParser = require(`cookie-parser`);

function verifyJWT(req, res, next) {
  try {
    req.JWTpayload = jwt.verify(
      req.cookies && req.cookies.Token,
      process.env.SECRET
    );

    next();
  } catch (err) {
    res.status(401).send(err.message);
  }
}

cds.on("bootstrap", (app) => {
  app.use(cookieParser());
  app.use(verifyJWT);
});

module.exports = cds.server;
