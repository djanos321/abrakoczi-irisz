const { tanarok_authJwt } = require("../middleware");
const vezerlo = require("../controllers/diakok.tanarok.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  utvonal.post("/lista", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.diakListazasaLapozasNelkul);

  app.use('/api/diak/tanarok', utvonal);
};