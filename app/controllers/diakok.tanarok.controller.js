const { sequelize, szakok } = require("../models");
const db = require("../models");
const Diakok = db.diakok;
const Op = db.Sequelize.Op;


//Minden diák listázása lapozás nélkül
exports.diakListazasaLapozasNelkul = (req, res) => {

  const tanszekekId = req.body.tanszekekId;
  var condition = {
    [Op.and]:
      [
        tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
        {
          [Op.or]: [
            {
              [Op.and]:
                [
                  sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                  sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `MSc` }),
                ]
            },

            {
              [Op.and]:
                [
                  sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                  sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `BSc` }),
                ],
            }],
        },
      ]
  }

  Diakok.findAll({
    where: condition,
    attributes: { exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'kezdes_ev'] },
    include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
    order: [[{ model: szakok, as: "szakok" }, 'szak_nev'], [{ model: szakok, as: "szakok" }, 'kepzesi_szint'], 'kepzesi_forma', 'diak_nev']
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a diákok keresése közben."
      });
    });
};