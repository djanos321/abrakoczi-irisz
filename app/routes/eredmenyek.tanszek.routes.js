const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/eredmenyek.tanszek.controller");

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
  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.letrehozas);

  // Eredmények -> Diák eredményei -> Eredmények (Nagy táblázat)
  utvonal.post("/diak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakEredmenyeinekListazasa);

  // Eredmények -> Diák eredményei -> Eredmények (Kis táblázat)
  utvonal.post("/diak_atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakAtalagainakListazasa);

  // Eredmények -> Diák eredményei -> Átlag (Nagy táblázat)
  utvonal.post("/diak_felevek_atlaga", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakFelevekAtlaga);

  // Eredmények -> Diák eredményei -> Átlag (Kis táblázat)
  utvonal.post("/diak_felevek_atlaga_osszes", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakFelevekAtlagaOsszesitve);

  // Eredmények -> Csoport eredményei -> Eredmények (Nagy táblázat)
  utvonal.post("/csoport", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.csoportEredmenyeinekListazasa);

  // Eredmények -> Csoport eredményei -> Eredmények (Kis táblázat)
  utvonal.post("/csoport_atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.csoportAtlagainakListazasa);

  // Eredmények -> Csoport eredményei -> Átlag (Nagy táblázat)
  utvonal.post("/atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.csoportFelevekAtlaganakListazasa);

  // Eredmények -> Csoport eredményei -> Átlag (Kis táblázat)
  utvonal.post("/osszes_atlag", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.csoportFelevekAtlaganakListazasaOsszesitve);

  // Adat keresése azonosító alapján
  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.egyEredmenyListazasa);

  // Adat frissítése
  utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.frissites);

  // Adat törlése
  utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.torles);

  app.use('/api/eredmeny/tanszek', utvonal);
};