const db = require("../models");
const SZEREPKOR = db.SZEREPKOR;
const Diakok = db.diakok;

checkDuplicateEmail = (req, res, next) => {

    // Email
    Diakok.findOne({
      where: {
        email: req.body.email
      }
    }).then(diakok => {
      if (diakok) {
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

const diakok_verifySignUp = {
  checkDuplicateEmail: checkDuplicateEmail,
  checkSzerepkorExisted: checkSzerepkorExisted
};

module.exports = diakok_verifySignUp;