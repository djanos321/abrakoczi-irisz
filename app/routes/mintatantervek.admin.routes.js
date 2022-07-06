const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/mintatantervek.admin.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  // Új tantervelem létrehozása
  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.letrehozas);

  //Évfolyam tanterve
  utvonal.get("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.mintatantervListazasa);

  // Szakok listazasa
  utvonal.get("/szak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.szakListazasa);

  // Kezdési évek listázása
  utvonal.get("/kezdes_ev", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.kezdesiEvListazasa);

  //Félévek listázása
  utvonal.get("/felev", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.felevekListazasa);

  //Tantárgy keresése
  utvonal.get("/kereses_tantargy", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.tantargyListazaMintatantervbol);

  // Mintatanterv elem keresése id alapján
  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.egyMintatantervListazasa);

  // Mintatanterv elem frissítése azonosító alapján
  utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.frissites);

  // Mintatanterv elem törlése id alapján
  utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.torles);

  // Minde adat törlése
  utvonal.delete("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.mindenTorlese);

  app.use('/api/mintatanterv/admin', utvonal);
};