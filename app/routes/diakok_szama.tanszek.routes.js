const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/diakok_szama.tanszek.controller");
module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    var utvonal = require("express").Router();

    // Minden adat listázása
    utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakokSzamaListazasa);

    // Minden kezdési év listázása
    utvonal.post("/kezdes_ev", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakKezdesiEvListazasa);

    // Minden kezdési év listázása
    utvonal.post("/osszeg_bsc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakokSzamaOsszegBscListazasa);

    // Minden kezdési év listázása
    utvonal.post("/osszeg_msc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakokSzamaOsszegMscListazasa);

    // Minden kezdési év listázása
    utvonal.post("/egyben_osszeg_bsc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakokSzamaOsszegBscEgybenListazasa);

    // Minden kezdési év listázása
    utvonal.post("/egyben_osszeg_msc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.diakokSzamaOsszegMscEgybenListazasa);

    app.use('/api/diakok_szama/tanszek', utvonal);
};