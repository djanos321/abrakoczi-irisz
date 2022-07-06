const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/szakok.tanszek.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  // Minden szak listázása lapozással
  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.szakListazasaLapozassal);

  // Minden szak listázása
  utvonal.post("/lista", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.szakListazasaLapozasNelkul);

  utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.egySzakListazasa);

  app.use('/api/szak/tanszek', utvonal);
};