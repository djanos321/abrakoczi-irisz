const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/szakdolgozat_evfolyammunka_tarifikaciok.tanszek.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  // Új tarifikáció létrehozása
  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.letrehozas);

  // Minden tarifikáció megjelenítése
  utvonal.post("/lista", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.szakdolgozatEvfolyammunkaTarifikacioListazasa);

  utvonal.post("/osszeg_bsc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.kiosztottDiakokSzamaBsc);

  utvonal.post("/osszeg_msc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.kiosztottDiakokSzamaMsc);

  utvonal.post("/tanar_terheles_osszeg", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.tanarTerhelesListazasa);
  
  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.egyTarifiakcioListazasa);

  // Tarifikáció frissítése
  utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.frissites);

  // Egy elem törlése
  utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.torles);

  app.use('/api/szakdolgozat_evfolyammunka_tarifikacio/tanszek', utvonal);
};