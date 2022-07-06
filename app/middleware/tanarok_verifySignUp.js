const db = require("../models");
const SZEREPKOR = db.SZEREPKOR;
const Tanarok = db.tanarok;

checkDuplicateEmail = (req, res, next) => {

    // Email
    Tanarok.findOne({
        where: {
            email: req.body.email
        }
    }).then(tanarok => {
        if (tanarok) {
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

const tanarok_verifySignUp = {
    checkDuplicateEmail: checkDuplicateEmail,
    checkSzerepkorExisted: checkSzerepkorExisted
};

module.exports = tanarok_verifySignUp;