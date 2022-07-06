const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/tanarok.tanszek.controller");
module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  // Minden tanszékhez tartozó tanár lapozással
  utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.tanarListazasaLapozassal);

  // Minden tanszékhez tartozó tanár legörülő listába
  utvonal.post("/lista", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.tanarListazasaLapozasNelkul);

  app.use('/api/tanar/tanszek', utvonal);
};