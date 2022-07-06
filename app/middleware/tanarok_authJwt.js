const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const { szerepkor } = require("../models");
const db = require("../models");
const Tanarok = db.munkatarsak;

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
    req.tanarokId = decoded.id;
    next();
  });
};

isTeacher = (req, res, next) => {
  Tanarok.findByPk(req.tanarokId).then(tanarok => {
    tanarok.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "teacher") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Tanári szerepkör szükséges!"
      });
    });
  });
};


const tanarok_authJwt = {
  verifyToken: verifyToken,
  isTeacher: isTeacher,
};
module.exports = tanarok_authJwt;