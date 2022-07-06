const {diakok, szakok} = require("../models");
const db = require("../models");
const config = require("../config/auth.config");
const Diakok = db.diakok;
const Szerepkor = db.szerepkor;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

//A diák regisztrálására szolgál
exports.signup = (req, res) => {
  // Hallgató mentése az adatbázisba
  Diakok.create({
    diak_nev: req.body.diak_nev,
    email: req.body.email,
    jelszo: bcrypt.hashSync(req.body.jelszo, 8),
    kepzesi_forma: req.body.kepzesi_forma,
    kezdes_ev: (req.body.kezdes_ev+'-09-01'),
    szakokId: req.body.szakokId
  })
    .then(diakok => {
      if (req.body.szerepkor) {
        Szerepkor.findAll({
          where: {
            nev: {
              [Op.or]: req.body.szerepkor
            }
          }
        }).then(szerepkor => {
          diakok.addSzerepkor(szerepkor).then(() => {
            res.send({ message: "A felhasználó sikeresen regisztrálva lett!" });
          });
        });
      } else {
        // Ha nem adunk meg külön szerepkört, akkor automatikusan az 1-es id-jú szerepkört kapja a felhasználó
        diakok.addSzerepkor([1]).then(() => {
          res.send({ message: "A felhasználó sikeresen regisztrálva lett!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  Diakok.findOne({
    where: {
      email: req.body.email
    }, include:[{model: szakok, as: "szakok"}],
  })
    .then(diakok => {
      if (!diakok) {
        return res.status(404).send({ message: "A felhasználó nem található." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.jelszo,
        diakok.jelszo
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Hibás jelszó!"
        });
      }

      var token = jwt.sign({ id: diakok.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];
      // a getSzerepkors a modell miatt kell a plural forma
      diakok.getSzerepkors().then(szerepkor => {
        for (let i = 0; i < szerepkor.length; i++) {
          authorities.push("SZEREPKOR_" + szerepkor[i].nev.toUpperCase());
        }
        res.status(200).send({
          id: diakok.id,
          email: diakok.email,
          szerepkor: authorities,
          accessToken: token,
          diak_nev: diakok.diak_nev,
          kepzesi_forma: diakok.kepzesi_forma,
          kezdes_ev: diakok.kezdes_ev,
          szakokId: diakok.szakokId,
          szakok: diakok.szakok,
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};