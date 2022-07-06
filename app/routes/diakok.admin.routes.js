const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/diakok.admin.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  utvonal.get("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakListazasaLapozassal);

  // Minden diák listázása
  utvonal.get("/lista", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakListazaLapozasNelkul);
  utvonal.get("/lista_kf", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakListazaLapozasNelkulKF);

  // Minden kezdési év listázása
  utvonal.get("/kezdes_ev", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakKezdesiEvListazas);

  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdminOrStudyDepartment], vezerlo.egyDiakListzasa);

  utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdminOrStudyDepartment], vezerlo.frissites);

  utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdminOrStudyDepartment], vezerlo.torles);

  utvonal.delete("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.mindenTorlese);

  app.use('/api/diak/admin', utvonal);
};