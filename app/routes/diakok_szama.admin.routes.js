const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo= require("../controllers/diakok_szama.admin.controller");
module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    var utvonal = require("express").Router();

    // Új sor létrehozása
    utvonal.post("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.letrehozas);

    // Minden adat listázása
    utvonal.get("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakokSzamaListazasa);

    // Minden kezdési év listázása
    utvonal.get("/kezdes_ev", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakKezdesiEvListazasa);

    // Minden kezdési év listázása
    utvonal.get("/osszeg_bsc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakokSzamaOsszegBscListazasa);

    // Minden kezdési év listázása
    utvonal.get("/osszeg_msc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakokSzamaOsszegMscListazasa);

    // Minden kezdési év listázása
    utvonal.get("/egyben_osszeg_bsc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakokSzamaOsszegBscEgybenListazasa);

    // Minden kezdési év listázása
    utvonal.get("/egyben_osszeg_msc", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isBossOrAdminOrStudyDepartment], vezerlo.diakokSzamaOsszegMscEgybenListazasa);

    // Id alapján való keresés
    utvonal.get("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdminOrStudyDepartment], vezerlo.egyDiakokSzamaListazasa);

    // Frissités
    utvonal.put("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdminOrStudyDepartment], vezerlo.frissites);

    // Egy sor törlése
    utvonal.delete("/:id", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.torles);

    // Minden törlése
    utvonal.delete("/", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isAdmin], vezerlo.mindenTorlese);

    app.use('/api/diakok_szama/admin', utvonal);
};