const db = require("../models");
const SZEREPKOR = db.SZEREPKOR;
const Adminisztracios_munkatarsak = db.munkatarsak;

checkDuplicateEmail = (req, res, next) => {

    // Email
    Adminisztracios_munkatarsak.findOne({
      where: {
        email: req.body.email
      }
    }).then(adminisztracios_munkatarsak => {
      if (adminisztracios_munkatarsak) {
        res.status(400).send({
          message: "Hiba! Az email cím foglalt!"
        });
        return;
      }

      next();
    });
};

checkSzerepkorExisted = (req, res, next) => {
  if (req.body.szerepkor) {
    for (let i = 0; i < req.body.szerepkor.length; i++) {
      if (!SZEREPKOR.includes(req.body.szerepkor[i])) {
        res.status(400).send({
          message: "Hiba! A szerepkör nem létezik = " + req.body.szerepkor[i]
        });
        return;
      }
    }
  }
  
  next();
};

const adminisztracios_munkatarsak_verifySignUp = {
  checkDuplicateEmail: checkDuplicateEmail,
  checkSzerepkorExisted: checkSzerepkorExisted
};

module.exports = adminisztracios_munkatarsak_verifySignUp;