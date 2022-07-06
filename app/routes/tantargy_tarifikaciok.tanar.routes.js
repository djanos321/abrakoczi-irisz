const { tanarok_authJwt } = require("../middleware");
const vezerlo = require("../controllers/tantargy_tarifikaciok.tanar.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  // Minden tantárgy tarifikáció megjelenítése
  utvonal.post("/", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.tantargytarifikacioListazasa);

  utvonal.post("/tanar_terheles_osszeg", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.findTanarTerheles);
  
  app.use('/api/tantargy_tarifikacio/tanar', utvonal);
};