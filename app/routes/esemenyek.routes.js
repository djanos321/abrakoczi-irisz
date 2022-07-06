const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/esemenyek.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();


  utvonal.get("/diakok_szama", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.ujTaneviDiakokSzamaAdatok);
  utvonal.get("/kotelezo_tantargyak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.kotelezoTantargyakLeckekonyvbeIrasa);
  utvonal.get("/tarifikacio_tantargy", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.kotelezoTantargyakTarifikacioba);
  utvonal.get("/tarifikacio_sz_tantargy", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.szabadonValaszthatoTantargyakTarifikacioba);

  utvonal.get("/uj_mintatanterv", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.ujMintatanterv);
  utvonal.get("/szabadon_valaszthato_tantargyak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.szabadonValaszthatoTantargyak);


  app.use('/api/esemenyek', utvonal);
};