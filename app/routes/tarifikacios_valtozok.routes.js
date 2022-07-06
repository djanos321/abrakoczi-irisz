const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/tarifikacios_valtozok.controller");
module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
    
    var utvonal = require("express").Router();
  
    // Új érték létrehozása
    utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.letrehozas);
  
    // Minden érték megjelenítése
    utvonal.get("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrDepartmentAdminOrStudyDepartment], vezerlo.tarifikaciosValtozokListazasa);

    // Érték keresése azonosítója alapján
    utvonal.get("/:id",  [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.egyTarifikaciosValtozoListazasa);
  
    // Érték frissítése azonosítója alapján
    utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.frissites);
  
    // Érték törlése azonosítója alapján
    utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.torles);
    
    app.use('/api/tarifikacios_valtozok', utvonal);
  };