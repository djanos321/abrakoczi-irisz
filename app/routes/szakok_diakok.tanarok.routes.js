const { tanarok_authJwt } = require("../middleware");
const controller = require("../controllers/szakok_diakok.tanarok.controller");


module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
  
    var router = require("express").Router();
  
    // Minden eredmény listázása
    router.post("/", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], controller.findOsszesBejegyzes);

    router.post("/tanar_tantargyai", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], controller.findTanarTantargyai);
    router.post("/szakok_es_tantargyak", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], controller.findSzakokEsTantargyak);
  
    router.post("/szakok", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], controller.findSzakok);

    router.post("/kepzesi_forma", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], controller.findKepzesiForma);

    router.post("/felev", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], controller.findFelev);

    app.use('/api/szakok_diakok/tanarok', router);
  };