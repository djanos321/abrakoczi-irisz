const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/eredmenyek.admin.controller");


module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  // Új bejegyzés létrehozésa
  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.letrehozas);

  // Eredmények -> Diák eredményei -> Eredmények (Nagy táblázat)
  utvonal.get("/diak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakEredmenyeinekListazasa);

  // Eredmények -> Diák eredményei -> Eredmények (Kis táblázat)
  utvonal.get("/diak_atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakAtlagainakListazasa);

  // Eredmények -> Diák eredményei -> Átlag (Nagy táblázat)
  utvonal.get("/diak_felevek_atlaga", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakFelevekAtlagainakListazasa);

  // Eredmények -> Diák eredményei -> Átlag (Kis táblázat)
  utvonal.get("/diak_felevek_atlaga_osszes", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakFelevekAtlagainakListazasaOsszesitve);

  // Eredmények -> Csoport eredményei -> Eredmények (Nagy táblázat)
  utvonal.get("/csoport", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.csoportEredmenyeinekListazasa);

  // Eredmények -> Csoport eredményei -> Eredmények (Kis táblázat)
  utvonal.get("/csoport_atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.csoportAtlagainakListazasa);

  // Eredmények -> Csoport eredményei -> Átlag (Nagy táblázat)
  utvonal.get("/atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.csoportFelevekAtlagainakListazasa);

  // Eredmények -> Csoport eredményei -> Átlag (Kis táblázat)
  utvonal.get("/osszes_atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.csoportFelevekAtlagainakListazasaOsszesitve);

  // Adat keresése azonosító alapján
  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.egyEredmenyListazasa);

  // Adat frissítése
  utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.frissites);

  // Adat törlése
  utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.torles);

  // Minden adat törlése
  utvonal.delete("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.mindenTorlese);

  app.use('/api/eredmeny/admin', utvonal);
};