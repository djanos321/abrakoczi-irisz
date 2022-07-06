const { tanarok_authJwt } = require("../middleware");
const vezerlo = require("../controllers/eredmenyek.tanarok.controller");


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
    utvonal.post("/", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.osszesEredmenyListazasas);

    utvonal.post("/tanar_tantargyai", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.tanarTantargyainakListazasa);

    utvonal.post("/szakok", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.szakokListazasa);

    utvonal.post("/gyorsitas", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.gyorsitas);

    utvonal.post("/kepzesi_forma", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.kepzesiFormaListazasa);

    utvonal.post("/felev", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.felevListazasa);

    //ID szerinti azonosítás
    utvonal.get("/:id", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.egyEredmenyListazasa);

    //Frissítés ID alapján
    utvonal.put("/:id", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.frissites);
  
    app.use('/api/eredmeny/tanarok', utvonal);
  };