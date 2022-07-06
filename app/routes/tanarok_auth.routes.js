const { tanarok_verifySignUp } = require("../middleware");
const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const controller = require("../controllers/tanarok_auth.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var router = require("express").Router();
  app.post(
    "/api/auth/tanar/regisztracio",
    [
      tanarok_verifySignUp.checkDuplicateEmail,
      tanarok_verifySignUp.checkSzerepkorExisted,
      adminisztracios_munkatarsak_authJwt.verifyToken, 
      adminisztracios_munkatarsak_authJwt.isAdmin,
    ],
    controller.signup
  );

  app.post("/api/auth/tanar/bejelentkezes", controller.signin);
};