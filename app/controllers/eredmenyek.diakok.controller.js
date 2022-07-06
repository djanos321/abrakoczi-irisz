const { sequelize, szakok, tantargyak, munkatarsak, diakok } = require("../models");
const db = require("../models");
const Eredmenyek = db.eredmenyek;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: eredmenyek } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, eredmenyek, osszesOldal, jelenlegiOldal };
};

// Diák eredményei menüpont *Eredmények, azaz érdemjegyek
// Minden eredmény listázása az adatbázisból ami megfelel a diakId és felev feltételeknek
exports.diakEredmenyekListazasa = (req, res) => {
  const { diakokId, felev, pontszam, tanszekekId, oldal, meret } = req.body;

  var condition = {
    [Op.and]: [
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      tanszekekId ? { "$diakok.szakok.tanszekekId$": { [Op.like]: `${tanszekekId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      pontszam == 60 ? { pontszam: { [Op.gte]: 60 } } : null,
      pontszam == 0 ? { pontszam: { [Op.lt]: 60 } } : null,
      pontszam == 'null' ? { pontszam: { [Op.is]: null } } : null,
    ]
  };

  if (!req.body.diakokId) {
    res.status(400).send({
      message: "A diák megadása kötelező!"
    });
    return;
  }

  const { limit, offset } = oldalszamozas(oldal, meret);

  Eredmenyek.findAndCountAll({
    where: condition, limit, offset,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [{
      model: diakok, as: "diakok", attributes: {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'],
        include: [
          [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
          [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        ],
      },
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
    },
    { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] }, },
    { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
    { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
    ],
    order: [
      'felev',
      'tipus',
      [{ model: tantargyak, as: "tantargyak" }, 'tantargy_nev'],
    ],
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az eredmény keresése közben."
      });
    });
};

// Diák eredményei menüpont *Átlag, az adott félév átlagai
//Diák félévének átlaga
exports.diakAtlaganakListazasaOsszesitve = (req, res) => {
  const { diakokId, felev, tanszekekId } = req.body;

  var condition = {
    [Op.and]: [
      tanszekekId ? { "$diakok.szakok.tanszekekId$": { [Op.like]: `${tanszekekId}` } } : null,
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
    ]

  };
  if (!req.body.diakokId) {
    res.status(400).send({
      message: "A diák megadása kötelező!"
    });
    return;
  }
  Eredmenyek.findAll({
    where: condition,
    include: [{
      model: diakok, as: "diakok", attributes: {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'kezdes_ev'],
      },
      include: [{
        model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] },

      }]
    },
    ],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'datum', 'pontszam', 'kredit', 'tipus', 'tantargyakId', 'munkatarsakId', 'szeminarium_munkatarsakId', 'vizsgahoz_engedve'],
      include: [
        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        [sequelize.fn("AVG", sequelize.col("pontszam")), "atlag"],
        [sequelize.fn("SUM", sequelize.literal("pontszam*kredit")), "eredmeny_osszeg"],

        [sequelize.fn("SUM", sequelize.col("kredit")), "kredit_osszeg"],
        [sequelize.literal(`(SELECT COUNT(eredmenyek2.pontszam) AS potok_szama FROM eredmenyek AS eredmenyek2 
        WHERE eredmenyek2.diakokId=eredmenyek.diakokId 
        AND eredmenyek2.pontszam < 60 
        AND eredmenyek2.pontszam IS NOT NULL 
        AND ${felev ? `eredmenyek2.felev=${felev}` : 1})`), "potok_szama"],
      ],
    },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az eredmény keresése közben."
      });
    });
};

// Eredmények -> Átlagok -> Átlagok (Nagy táblázat)
//Diák félévének átlaga
exports.diakFelevekAtlaganakListazasa = (req, res) => {
  const { diakokId, felev } = req.body;
  var condition =
  {
    [Op.and]: [
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
    ]
  }

  if (!req.body.diakokId) {
    res.status(400).send({
      message: "A diák megadása kötelező!"
    });
    return;
  }

  Eredmenyek.findAll({
    where: condition,
    include: [{
      model: diakok, as: "diakok", attributes: { exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'] },
      include: [{
        model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] },

      }]
    }],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'kredit', 'tipus', 'pontszam', 'vizsgahoz_engedve', 'datum', 'tantargyakId', 'munkatarsakId', 'szeminarium_munkatarsakId'],
      include: [
        [sequelize.fn("AVG", sequelize.col("pontszam")), "atlag"],
        [sequelize.fn("SUM", sequelize.literal("pontszam*kredit")), "eredmeny_osszeg"],
        [sequelize.fn("SUM", sequelize.col("kredit")), "kredit_osszeg"],
        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        [sequelize.literal(`(SELECT COUNT(eredmenyek2.pontszam) AS potok_szama FROM eredmenyek AS eredmenyek2 
        WHERE eredmenyek2.diakokId = eredmenyek.diakokId  
        AND eredmenyek2.felev = eredmenyek.felev 
        AND eredmenyek2.pontszam < 60 
        AND eredmenyek2.pontszam IS NOT NULL 
        AND ${felev ? `eredmenyek2.felev=${felev}` : 1})`), "potok_szama"],
      ],
    },
    group: ["diakokId", "felev"],
    order: ['felev'],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az átlag keresése közben."
      });
    });
};

// Eredmények -> Átlagok -> Átlagok (Kis táblázat)
// Átlag keresése adminnak diáké, diák átlagok átlaga átlaga
exports.diakFelevekAtlaganakListazasaOsszesitve = (req, res) => {
  const { diakokId, felev } = req.body;
  var condition =
  {
    [Op.and]: [
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
    ]
  }

  if (!req.body.diakokId) {
    res.status(400).send({
      message: "A diák megadása kötelező!"
    });
    return;
  }

  Eredmenyek.findAll({
    where: condition,
    include: [{
      model: diakok, as: "diakok", attributes: { exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'] },
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
    },],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'kredit', 'tipus', 'pontszam', 'vizsgahoz_engedve', 'datum', 'tantargyakId', 'munkatarsakId', 'szeminarium_munkatarsakId'],
      include: [
        [sequelize.fn("AVG", sequelize.col("pontszam")), "atlag"],
        [sequelize.fn("SUM", sequelize.literal("pontszam*kredit")), "eredmeny_osszeg"],
        [sequelize.fn("SUM", sequelize.col("kredit")), "kredit_osszeg"],
        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        [sequelize.literal(`(SELECT COUNT(eredmenyek2.pontszam) AS potok_szama 
        FROM eredmenyek AS eredmenyek2 
        WHERE eredmenyek2.diakokId=eredmenyek.diakokId  
        AND eredmenyek2.pontszam < 60 
        AND eredmenyek2.pontszam IS NOT NULL 
        AND ${felev ? `eredmenyek2.felev=${felev}` : 1})`), "potok_szama"],
      ],
    },
    group: ['diakokId'],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az eredmény keresése közben."
      });
    });
};