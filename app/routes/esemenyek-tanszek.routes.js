const { adminisztracios_munkatarsak_authJwt } = require("../middleware");
const vezerlo = require("../controllers/esemenyek-tanszek.controller");
module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    var utvonal = require("express").Router();

    utvonal.post("/kotelezo_tantargyak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.kotelezoTantargyakLeckekonyvbeIrasa);

    utvonal.post("/uj_mintatanterv", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.ujMintatanterv);
    utvonal.post("/szabadon_valaszthato_tantargyak", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.szabadonValaszthatoTantargyak);
    utvonal.post("/tarifikacio_tantargy", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.kotelezoTantargyakTarifikacioba);
    utvonal.get("/tarifikacio_sz_tantargy", [adminisztracios_munkatarsak_authJwt.verifyToken, adminisztracios_munkatarsak_authJwt.isDepartmentAdmin], vezerlo.szabadonValaszthatoTantargyakTarifikacioba);

    app.use('/api/tanszek_esemenyek', utvonal);
};