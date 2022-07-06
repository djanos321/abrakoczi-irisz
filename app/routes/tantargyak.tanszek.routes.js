const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/tantargyak.tanszek.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  utvonal.post("/letrehozas", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.letrehozas);

  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.tantargyListazasaLapozassal);

  // Minden tantárgy listázása
  utvonal.post("/lista", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.tantargyListazasaLapozasNelkul);
  utvonal.post("/lista_k", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.tantargyListazasaLapozasNelkulK);

  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.egyTantargyListazasa);

  utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.frissites);

  utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.torles);

  app.use('/api/tantargy/tanszek', utvonal);
};