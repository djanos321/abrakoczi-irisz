const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/tantargyak.admin.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.letrehozas);

  utvonal.get("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.tantargyListazasaLapozassal);

  // Minden tantárgy listázása
  utvonal.get("/lista", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.tantargyListazasaLapozasNelkul);

  // Minden tantárgy listázása szűréssel
  //utvonal.get("/lista_szuressel", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdmin], vezerlo.tantargyListazasaLapozasNelkulSzuressel);

  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.egyTantargyListazasa);

  utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.frissites);

  utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.torles);

  utvonal.delete("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.mindenTorlese);

  app.use('/api/tantargy/admin', utvonal);
};