const { sequelize, tanszekek, szakok } = require("../models");
const db = require("../models");
const Diakok = db.diakok;
const Op = db.Sequelize.Op;


// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: diakok } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, diakok, osszesOldal, jelenlegiOldal };
};


//Minden diák listázása lapozás nélkül
exports.diakListazaLapozasNelkul = (req, res) => {

  const tanszekekId = req.query.tanszekekId;
  var condition = {
    [Op.and]:
      [
        tanszekekId ? { '$szak.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
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

//Minden diák listázása lapozás nélkül képzési forma kereséssel
exports.diakListazaLapozasNelkulKF = (req, res) => {
  const { tanszekekId, szakokId, kepzesi_forma, kezdes_ev } = req.query;
  var condition = {
    [Op.and]:
      [
        tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
        szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
        kepzesi_forma? { kepzesi_forma: { [Op.like]: `${kepzesi_forma}` } } : null,
        kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
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

//Diákok kezdésének éveit listázza ki
exports.diakKezdesiEvListazas = (req, res) => {
  const { szakokId, tanszekekId, kepzesi_forma } = req.query;
  var condition = {
    [Op.and]: [
      szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
      tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
      kepzesi_forma? { kepzesi_forma: { [Op.like]: `${kepzesi_forma}` } } : null,
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
    ],
  };

  Diakok.findAll({
    where: condition,
    distinct: true,

    include: [{
      model: szakok, as: "szakok",
      attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev', 'kepzesi_szint'] },
    }
    ],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'diak_nev', 'email', 'jelszo', 'kepzesi_forma'],
      include: [
        [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
      ],
    },

    order: [['kezdes_ev', 'DESC']],
    group: ['kezdes_ev'],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel keresés közben."
      });
    });
};

// Minden diák listázása az adatbázisból.
exports.diakListazasaLapozassal = (req, res) => {
  const { oldal, meret, szakokId, diak_nev, kepzesi_szint, kepzesi_forma, kezdes_ev, tanszekekId } = req.query;
  var condition = {
    [Op.and]: [
      tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
      diak_nev ? { diak_nev: { [Op.like]: `%${diak_nev}%` } } : null,
      szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
      kepzesi_szint ? { '$szakok.kepzesi_szint$': { [Op.like]: `%${kepzesi_szint}%` } } : null,
      kepzesi_forma ? { kepzesi_forma: { [Op.like]: `%${kepzesi_forma}%` } } : null,
      kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
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
  };
  const { limit, offset } = oldalszamozas(oldal, meret);
  Diakok.findAndCountAll({
    where: condition, limit, offset,
    attributes: {
      exclude: ['jelszo', 'createdAt', 'updatedAt'],
      include: [
        [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
      ],
    },
    include: [{
      model: szakok, as: "szakok",
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include: [{ attributes: { exclude: ['createdAt', 'updatedAt'] }, model: tanszekek, as: "tanszekek" }]
    }],
    order: [[{ model: szakok, as: "szakok" }, 'szak_nev'],[{ model: szakok, as: "szakok" }, 'kepzesi_szint'], ['kezdes_ev', 'DESC'], 'kepzesi_forma', 'diak_nev']
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a diák keresése közben."
      });
    });
};

// Diák keresése azonosítója alapján
exports.egyDiakListzasa = (req, res) => {
  const id = req.params.id;

  Diakok.findByPk(id, {
    attributes: {
      exclude: ['jelszo', 'createdAt', 'updatedAt'], include: [
        [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
      ],
    },
    include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a diák keresése közben, a diák azonosítója: " + id
      });
    });
};

// Diák módosítása azonosítója alapján
exports.frissites = (req, res) => {
  // Kérés validálása
  if (!req.body.diak_nev || !req.body.kepzesi_forma || !req.body.email || !req.body.kezdes_ev || !req.body.szakokId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  req.body.kezdes_ev = (req.body.kezdes_ev + '-09-01');
  const id = req.params.id;

  Diakok.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A diák sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet a diák adatait frissíteni, azonosító: ${id}. Lehetséges, hogy a diák nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a diák adatainak a frissítése közben, azonosító: " + id
      });
    });
};

// Diák törlése azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Diakok.destroy({
    where: { id: id }

  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A diák sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült a diák törlése, azonsító:${id}. Lehetséges, hogy a diák nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a diák törlése közben, azonosító: " + id
      });
    });
};

// Minden diák törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Diakok.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} diák sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a diák törlése közben."
      });
    });
};