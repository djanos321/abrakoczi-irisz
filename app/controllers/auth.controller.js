const {diak, szak} = require("../models");
const db = require("../models");
const config = require("../config/auth.config");
const Felhasznalo = db.felhasznalo;
const Szerepkor = db.szerepkor;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  // Felhasznaló mentése az adatbázisba
  Felhasznalo.create({
    felhasznalo_nev: req.body.felhasznalo_nev,
    email: req.body.email,
    jelszo: bcrypt.hashSync(req.body.jelszo, 8),
    diakId: req.body.diakId
  })
    .then(felhasznalo => {
      if (req.body.szerepkor) {
        Szerepkor.findAll({
          where: {
            nev: {
              [Op.or]: req.body.szerepkor
            }
          }
        }).then(szerepkor => {
          felhasznalo.addSzerepkor(szerepkor).then(() => {
            res.send({ message: "A felhasználó sikeresen regisztrálva lett!" });
          });
        });
      } else {
        // Ha nem adunk meg külön szerepkört, akkor automatikusan az 1-es id-jú szerepkört kapja a felhasználó
        felhasznalo.addSzerepkor([1]).then(() => {
          res.send({ message: "A felhasználó sikeresen regisztrálva lett!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  Felhasznalo.findOne({
    where: {
      email: req.body.email
    }, include: [{model: diak, as: "diak", include:[{model: szak, as: "szak"}]}],
  })
    .then(felhasznalo => {
      if (!felhasznalo) {
        return res.status(404).send({ message: "A felhasználó nem található." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.jelszo,
        felhasznalo.jelszo
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Hibás jelszó!"
        });
      }

      var token = jwt.sign({ id: felhasznalo.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];
      // a getSzerepkors a modell miatt kell a plural forma
      felhasznalo.getSzerepkors().then(szerepkor => {
        for (let i = 0; i < szerepkor.length; i++) {
          authorities.push("SZEREPKOR_" + szerepkor[i].nev.toUpperCase());
        }
        res.status(200).send({
          id: felhasznalo.id,
          felhasznalo_nev: felhasznalo.felhasznalo_nev,
          email: felhasznalo.email,
          szerepkor: authorities,
          accessToken: token,
          diakId: felhasznalo.diakId,
          diak: felhasznalo.diak,
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};