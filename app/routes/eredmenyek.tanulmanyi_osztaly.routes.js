const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/eredmenyek.tanulmanyi_osztaly.controller");


module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });
  
  
    var utvonal = require("express").Router();
  
    // Minden eredmény listázása
    utvonal.get("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isStudyDepartment], vezerlo.osszesEredmenyListazasa);

    utvonal.get("/tantargyak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isStudyDepartment], vezerlo.tantargyakListazasa);

    utvonal.get("/szakok", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isStudyDepartment], vezerlo.szakokListazasa);

    utvonal.get("/kepzesi_forma", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isStudyDepartment], vezerlo.kepzesiFormaListazasa);

    utvonal.get("/felev", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isStudyDepartment], vezerlo.felevListazasa);

    //ID szerinti azonosítás
    utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isStudyDepartment], vezerlo.egyEredmenyListazasa);

    //Frissítés ID alapján
    utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isStudyDepartment], vezerlo.frissites);
  
    app.use('/api/eredmeny/tanulmanyi_osztaly', utvonal);
  };