const { diakok_authJwt } = require("../middleware");
const vezerlo = require("../controllers/eredmenyek.diakok.controller");


module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  var utvonal = require("express").Router();

  // Eredmény -> E-leckeköny (Nagy táblázat)
  utvonal.post("/", [diakok_authJwt.verifyToken], vezerlo.diakEredmenyekListazasa);

  // Eredmény -> E-leckeköny (Kis táblázat)
  utvonal.post("/atlag", [diakok_authJwt.verifyToken], vezerlo.diakAtlaganakListazasaOsszesitve);

  // Eredmény -> Átlag (Nagy táblázat)
  utvonal.post("/diak_felevek_atlaga", [diakok_authJwt.verifyToken], vezerlo.diakFelevekAtlaganakListazasa);

  // Eredmény -> Átlag (Kis táblázat)
  utvonal.post("/diak_felevek_atlaga_osszes", [diakok_authJwt.verifyToken], vezerlo.diakFelevekAtlaganakListazasaOsszesitve);

  app.use('/api/eredmeny/diakok', utvonal);
};