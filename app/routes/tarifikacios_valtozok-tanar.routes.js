const { tanarok_authJwt } = require("../middleware");
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
  
    // Minden érték megjelenítése
    utvonal.get("/", [tanarok_authJwt.verifyToken, tanarok_authJwt.isTeacher], vezerlo.tarifikaciosValtozokListazasa);

    app.use('/api/tanar/tarifikacios_valtozok', utvonal);
  };