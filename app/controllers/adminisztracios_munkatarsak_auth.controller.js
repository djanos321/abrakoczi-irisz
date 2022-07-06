const {tanszekek} = require("../models");
const db = require("../models");
const config = require("../config/auth.config");
const Adminisztracios_munkatarsak = db.munkatarsak;
const Szerepkor = db.szerepkor;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

//A munkatars regisztrálására szolgál
exports.signup = (req, res) => {
  // Munkatárs mentése az adatbázisba
  Adminisztracios_munkatarsak.create({
    nev: req.body.nev,
    email: req.body.email,
    jelszo: bcrypt.hashSync(req.body.jelszo, 8),
    beosztas: req.body.beosztas,
    kezdes_ev: req.body.kezdes_ev,
    tanszekekId: req.body.tanszekekId,
  })
    .then(adminisztracios_munkatarsak => {
      if (req.body.szerepkor) {
        Szerepkor.findAll({
          where: {
            nev: {
              [Op.or]: req.body.szerepkor
            }
          }
        }).then(szerepkor => {
          adminisztracios_munkatarsak.addSzerepkor(szerepkor).then(() => {
            res.send({ message: "A felhasználó sikeresen regisztrálva lett!" });
          });
        });
      } else {
        // Ha nem adunk meg külön szerepkört, akkor automatikusan az 1-es id-jú szerepkört kapja a felhasználó
        adminisztracios_munkatarsak.addSzerepkor([1]).then(() => {
          res.send({ message: "A felhasználó sikeresen regisztrálva lett!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  Adminisztracios_munkatarsak.findOne({
    where: {
      email: req.body.email
    }, include:[{model: tanszekek, as: "tanszekek"}],
  })
    .then(adminisztracios_munkatarsak => {
      if (!adminisztracios_munkatarsak) {
        return res.status(404).send({ message: "A felhasználó nem található." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.jelszo,
        adminisztracios_munkatarsak.jelszo
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Hibás jelszó!"
        });
      }

      var token = jwt.sign({ id: adminisztracios_munkatarsak.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];
      // a getSzerepkors a modell miatt kell a plural forma
      adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
        for (let i = 0; i < szerepkor.length; i++) {
          if(szerepkor[i].nev != "teacher"){
            authorities.push("SZEREPKOR_" + szerepkor[i].nev.toUpperCase());
          }
          
        }
        res.status(200).send({
          id: adminisztracios_munkatarsak.id,
          email: adminisztracios_munkatarsak.email,
          beosztas: adminisztracios_munkatarsak.beosztas,
          szerepkor: authorities,
          accessToken: token,
          nev: adminisztracios_munkatarsak.nev,
          kezdes_ev: adminisztracios_munkatarsak.kezdes_ev,
          tanszekekId: adminisztracios_munkatarsak.tanszekekId,
          tanszekek: adminisztracios_munkatarsak.tanszekek,
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};