const { tanszekek } = require("../models");
const db = require("../models");
const config = require("../config/auth.config");
const Tanarok = db.munkatarsak;
const Szerepkor = db.szerepkor;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

//A tanár regisztrálására szolgál
exports.signup = (req, res) => {
  // Tanár mentése az adatbázisba
  Tanarok.create({
    nev: req.body.nev,
    email: req.body.email,
    jelszo: bcrypt.hashSync(req.body.jelszo, 8),
    kezdes_ev: req.body.kezdes_ev,
    tanszekId: req.body.tanszekId
  })
    .then(tanarok => {
      if (req.body.szerepkor) {
        Szerepkor.findAll({
          where: {
            nev: {
              [Op.or]: req.body.szerepkor
            }
          }
        }).then(szerepkor => {
          tanarok.addSzerepkor(szerepkor).then(() => {
            res.send({ message: "A tanár sikeresen regisztrálva lett!" });
          });
        });
      } else {
        // Ha nem adunk meg külön szerepkört, akkor automatikusan az 2-es id-jú szerepkört kapja a felhasználó
        tanarok.addSzerepkor([5]).then(() => {
          res.send({ message: "A tanár sikeresen regisztrálva lett!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  Tanarok.findOne({
    where: {
      email: req.body.email
    }, include: [{ model: tanszekek, as: "tanszekek" }],
  })
    .then(tanarok => {
      if (!tanarok) {
        return res.status(404).send({ message: "A tanár nem található!" });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.jelszo,
        tanarok.jelszo
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Hibás jelszó!"
        });
      }

      var token = jwt.sign({ id: tanarok.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];
      // a getSzerepkors a modell miatt kell a plural forma
      tanarok.getSzerepkors().then(szerepkor => {
        for (let i = 0; i < szerepkor.length; i++) {
          if (szerepkor[i].nev == "teacher") {
            authorities.push("SZEREPKOR_" + szerepkor[i].nev.toUpperCase());
          }
        }
        res.status(200).send({
          id: tanarok.id,
          email: tanarok.email,
          szerepkor: authorities,
          accessToken: token,
          nev: tanarok.nev,
          kezdes_ev: tanarok.kezdes_ev,
          tanszekId: tanarok.tanszekekId,
          tanszek: tanarok.tanszekek,
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};