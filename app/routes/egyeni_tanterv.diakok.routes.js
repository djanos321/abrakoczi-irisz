const { diakok_authJwt } = require("../middleware");
const controller = require("../controllers/egyeni_tanterv.diakok.controller");


module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    var router = require("express").Router();

    // A felhasználó minden eredményének listázása
    router.post("/", [diakok_authJwt.verifyToken], controller.findEgyeniTantervDiak);

    app.use('/api/egyeni_tanterv/diakok', router);
};