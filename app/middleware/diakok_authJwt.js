const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const { szerepkor } = require("../models");
const db = require("../models");
const Diakok = db.diakok;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "Nincs token megadva!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Jogosulatlan!"
      });
    }
    req.diakokId = decoded.id;
    next();
  });
};

isStudent = (req, res, next) => {
  Diakok.findByPk(req.diakokId).then(diakok => {
    diakok.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "student") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Regisztráció szükséges!"
      });
      return;
    });
  });
};

const diakok_authJwt = {
  verifyToken: verifyToken,
  isStudent: isStudent,
};
module.exports = diakok_authJwt;