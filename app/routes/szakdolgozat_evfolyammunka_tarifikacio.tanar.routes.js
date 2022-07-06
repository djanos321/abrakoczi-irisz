const { tanarok_authJwt } = require("../middleware");
const controller = require("../controllers/szakdolgozat_evfolyammunka_tarifikacio.tanar.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var router = require("express").Router();

  router.post("/tanar_terheles_osszeg", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], controller.tanarTerhelesListazasa);
  

  app.use('/api/szakdolgozat_evfolyammunka_tarifikacio/tanar', router);
};