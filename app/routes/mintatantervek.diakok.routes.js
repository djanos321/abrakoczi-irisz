const { diakok_authJwt } = require("../middleware");
const vezerlo = require("../controllers/mintatantervek.diakok.controller");
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
  utvonal.post("/", [diakok_authJwt.verifyToken, diakok_authJwt.isStudent], vezerlo.mintatantervListazasa);

  app.use('/api/mintatanterv/diak', utvonal);
};