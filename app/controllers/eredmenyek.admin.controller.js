const { sequelize, diakok, szakok, tantargyak, munkatarsak } = require("../models");
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

// Új eredmeny létrehozása és mentése
exports.letrehozas = (req, res) => {
  // Kérés validálása
  if (!req.body.diakokId || !req.body.tantargyakId || !req.body.felev || !req.body.kredit ||
    !req.body.tipus) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }

  // Kérés validálása
  if (req.body.kredit < 0 || req.body.pontszam < 0) {
    res.status(400).send({
      message: "A mező értéke nem lehet negatív!"
    });
    return;
  }

  // Kérés validálása
  if (req.body.pontszam > 100) {
    res.status(400).send({
      message: "Hiba! Maximum 100 pont adható!"
    });
    return;
  }

  if (!req.body.munkatarsakId) {
    req.body.munkatarsakId = null;
  }

  if (!req.body.szeminarium_munkatarsakId) {
    req.body.szeminarium_munkatarsakId = null;
  }

  if ((req.body.vizsgahoz_engedve == "true" && !req.body.pontszam) || (req.body.vizsgahoz_engedve == "false" && !req.body.pontszam)) {
    req.body.pontszam = null;
  }

  if (req.body.vizsgahoz_engedve == "false" && req.body.pontszam <= 100 && req.body.pontszam != null) {
    res.status(400).send({
      message: "Hiba! Ha nincs a diák vizsgához engedve, akkor nem lehet pontszámot megadni!"
    });
    return;
  }

  // Eredmeny létrehozása
  const eredmenyek = {
    diakokId: req.body.diakokId,
    tantargyakId: req.body.tantargyakId,
    felev: req.body.felev,
    kredit: req.body.kredit,
    tipus: req.body.tipus,
    munkatarsakId: req.body.munkatarsakId,
    szeminarium_munkatarsakId: req.body.szeminarium_munkatarsakId,
    pontszam: req.body.pontszam,
    vizsgahoz_engedve: req.body.vizsgahoz_engedve,
    datum: req.body.datum,
  };

  // Eredmény mentése az adatbázisba
  Eredmenyek.create(eredmenyek)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az eredmény bevitele közben."
      });
    });
};

// Eredmények -> Diák Eredményei -> Eredmények (Nagy táblázat)
// Minden eredmény listázása az adatbázisból ami megfelel a diakId és felev feltételeknek
exports.diakEredmenyeinekListazasa = (req, res) => {
  const { diakokId, felev, pontszam, oldal, meret } = req.query;

  var condition = {
    [Op.and]: [
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      pontszam == 60 ? { pontszam: { [Op.gte]: 60 } } : null,
      pontszam == 0 ? { pontszam: { [Op.lt]: 60 } } : null,
      pontszam == 'null' ? { pontszam: { [Op.is]: null } } : null,
    ]
  };

  if (!req.query.diakokId) {
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


// Eredmények -> Diák Eredményei -> Eredmények (Kis táblázat)
//Diák félévének átlaga
exports.diakAtlagainakListazasa = (req, res) => {
  const { diakokId, felev } = req.query;

  var condition = {
    [Op.and]: [
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
    ]

  };
  if (!req.query.diakokId) {
    res.status(400).send({
      message: "A diák megadása kötelező!"
    });
    return;
  }
  Eredmenyek.findAll({
    where: condition,
    include: [{
      model: diakok, as: "diakok", attributes: {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'],
      },
      include: [{
        model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] },

      }]
    },
    { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] }, },
    { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev'] } },
    { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev'] } },
    ],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'datum', 'kredit', 'tipus', 'tantargyakId', 'munkatarsakId', 'szeminarium_munkatarsakId', 'vizsgahoz_engedve'],
      include: [
        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        [sequelize.fn("AVG", sequelize.col("pontszam")), "atlag"],
        [sequelize.fn("SUM", sequelize.literal("pontszam*kredit")), "eredmeny_osszeg"],

        [sequelize.fn("SUM", sequelize.col("kredit")), "kredit_osszeg"],
        [sequelize.literal(`(SELECT COUNT(eredmenyek2.pontszam) AS potok_szama 
        FROM eredmenyek AS eredmenyek2 
        WHERE eredmenyek2.diakokId = eredmenyek.diakokId  
        AND 
        eredmenyek2.pontszam < 60 
        AND 
        eredmenyek2.pontszam IS NOT NULL 
        AND 
        ${felev ? `eredmenyek2.felev=${felev}` : 1})`), "potok_szama"],
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

// Eredmények -> Csoport Eredményei -> Eredmények (Nagy táblázat)
// Minden eredmény listázása az adatbázisból ami megfelel a szakokId, félév és tantárgyId feltételeknek
exports.csoportEredmenyeinekListazasa = (req, res) => {
  const { oldal, meret, szakokId, tantargyakId, felev, kezdes_ev, kepzesi_forma, pontszam } = req.query;

  var condition = {
    [Op.and]: [
      szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
      kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
      tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      kezdes_ev ? { '$diakok.kezdes_ev$': { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
      pontszam == 60 ? { pontszam: { [Op.gte]: 60 } } : null,
      pontszam == 0 ? { pontszam: { [Op.lt]: 60 } } : null,
      pontszam == 'null' ? { pontszam: { [Op.is]: null } } : null,
      {
        [Op.or]: [
          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `MSc` }),
              ]
          },

          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `BSc` }),
              ],
          }],
      },
    ]
  };
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
    { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev'] } },
    { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev'] } },

    ],
    order: [
      [{ model: diakok.szakok, as: "szakok" }, 'diakok.szakok.szak_nev'],
      [{ model: diakok.szakok, as: "szakok" }, 'diakok.szakok.kepzesi_szint'],
      [{ model: diakok, as: "diakok" }, 'kepzesi_forma'],
      [{ model: diakok, as: "diakok" }, 'diak_nev'],
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

// Eredmények -> Csoport Eredményei -> Eredmények (Kis táblázat)
exports.csoportAtlagainakListazasa = (req, res) => {
  const { szakokId, tantargyakId, felev, kezdes_ev, kepzesi_forma } = req.query;

  var condition = {
    [Op.and]: [
      szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
      tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
      kezdes_ev ? { '$diakok.kezdes_ev$': { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
      {
        [Op.or]: [
          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `MSc` }),
              ]
          },

          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `BSc` }),
              ],
          }],
      },
    ],

  };

  Eredmenyek.findAll({
    where: condition,
    include: [{
      model: diakok, as: "diakok", attributes: {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'],
      },
      include: [{
        model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] },

      }]
    },
    { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] }, },
    { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev'] } },
    { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev'] } },
    ],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'datum', 'kredit', 'tipus', 'tantargyakId', 'munkatarsakId', 'szeminarium_munkatarsakId', 'vizsgahoz_engedve'],
      include: [
        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        [sequelize.fn("AVG", sequelize.col("pontszam")), "atlag"],
        [sequelize.fn("SUM", sequelize.literal("pontszam*kredit")), "eredmeny_osszeg"],

        [sequelize.fn("SUM", sequelize.col("kredit")), "kredit_osszeg"],
        [sequelize.literal(`(SELECT COUNT(eredmenyek2.pontszam) AS potok_szama 
        FROM eredmenyek AS eredmenyek2  LEFT OUTER JOIN diakok AS diakok2 ON eredmenyek2.diakokId = diakok2.id 
        WHERE 
        eredmenyek2.pontszam < 60 
        AND 
        eredmenyek2.pontszam IS NOT NULL 
        AND 
        ${szakokId ? `diakok2.szakokId=${szakokId}` : 1} 
        AND 
        ${kepzesi_forma ? `diakok2.kepzesi_forma LIKE '${kepzesi_forma}'` : 1} 
        AND 
        ${tantargyakId ? `tantargyakId=${tantargyakId}` : 1}
        AND 
        ${felev ? `eredmenyek2.felev=${felev}` : 1}
        AND 
        ${kezdes_ev ? `diakok2.kezdes_ev="${kezdes_ev + '-09-01'}"` : 1})`), "potok_szama"],
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

// Eredmények -> Diák eredményei -> Átlagok (Nagy táblázat)
//Diák félévének átlaga
exports.diakFelevekAtlagainakListazasa = (req, res) => {
  const { diakokId, felev } = req.query;
  var condition =
  {
    [Op.and]: [
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
    ]
  }

  if (!req.query.diakokId) {
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
        [sequelize.literal(`(SELECT COUNT(eredmenyek2.pontszam) AS potok_szama 
        FROM eredmenyek AS eredmenyek2 
        WHERE eredmenyek2.diakokId = eredmenyek.diakokId  AND eredmenyek2.felev = eredmenyek.felev
        AND 
        eredmenyek2.pontszam < 60 
        AND 
        eredmenyek2.pontszam IS NOT NULL 
        AND 
        ${felev ? `eredmenyek2.felev=${felev}` : 1})`), "potok_szama"],
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

// Eredmények -> Diák eredményei -> Átlagok (Kis táblázat)
// Átlag keresése adminnak diáké, diák átlagok átlaga átlaga
exports.diakFelevekAtlagainakListazasaOsszesitve = (req, res) => {
  const { diakokId, felev } = req.query;
  var condition =
  {
    [Op.and]: [
      diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
    ]
  }

  if (!req.query.diakokId) {
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
        WHERE eredmenyek2.diakokId = eredmenyek.diakokId  
        AND 
        eredmenyek2.pontszam < 60 
        AND 
        eredmenyek2.pontszam IS NOT NULL 
        AND 
        ${felev ? `eredmenyek2.felev=${felev}` : 1})`), "potok_szama"],
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


// Eredmények -> Csoport eredményei -> Átlagok (Nagy táblázat)
// Átlag keresése adminnak csoport diákonként
exports.csoportFelevekAtlagainakListazasa = (req, res) => {
  const { szakokId, felev, kezdes_ev, kepzesi_forma } = req.query;

  var condition = {
    [Op.and]: [
      szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
      kezdes_ev ? { '$diakok.kezdes_ev$': { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
      {
        [Op.or]: [
          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `MSc` }),
              ]
          },

          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `BSc` }),
              ],
          }],
      },
    ]
  };

  if (!req.query.szakokId && !req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "A szak, az évfolyam (kezdési év) és a félév megadása kötelező!"
    });
    return;
  }

  if (!req.query.szakokId && !req.query.kezdes_ev && req.query.felev) {
    res.status(400).send({
      message: "A szak és az évfolyam (kezdési év) megadása kötelező!"
    });
    return;
  }

  if (!req.query.szakokId && req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "A szak és a félév megadása kötelező!"
    });
    return;
  }

  if (req.query.szakokId && !req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "Az évfolyam (kezdési év) és a félév megadása kötelező!"
    });
    return;
  }

  if (!req.query.szakokId && req.query.kezdes_ev && req.query.felev) {
    res.status(400).send({
      message: "A szak megadása kötelező!"
    });
    return;
  }

  if (req.query.szakokId && !req.query.kezdes_ev && req.query.felev) {
    res.status(400).send({
      message: "Az évfolyam (kezdési év) megadása kötelező!"
    });
    return;
  }

  if (req.query.szakokId && req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "A félév megadása kötelező!"
    });
    return;
  }

  Eredmenyek.findAll({
    where: condition,
    include: [{
      model: diakok, as: "diakok", attributes: { exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'] },
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] } }]
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
        FROM eredmenyek AS eredmenyek2 LEFT OUTER JOIN diakok AS diakok2 ON eredmenyek2.diakokId = diakok2.id 
        WHERE 
        eredmenyek2.diakokId = eredmenyek.diakokId
        AND
        eredmenyek2.pontszam < 60 
        AND 
        eredmenyek2.pontszam IS NOT NULL 
        AND 
        ${szakokId ? `diakok2.szakokId=${szakokId}` : 1} 
        AND 
        ${felev ? `eredmenyek2.felev=${felev}` : 1}
        AND 
        ${kezdes_ev ? `diakok2.kezdes_ev="${kezdes_ev + '-09-01'}"` : 1}) `), "potok_szama"],
      ],
    },
    group: ["diakokId", 'felev'],
    order: [
      [{ model: diakok, as: "diakok" }, 'kepzesi_forma'],
      [{ model: diakok, as: "diakok" }, 'diak_nev'],
    ],
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

// Eredmények -> Csoport eredményei -> Átlagok (Kis táblázat)
// Átlag keresése adminnak csoporté, csoport átlaga
exports.csoportFelevekAtlagainakListazasaOsszesitve = (req, res) => {
  const { szakokId, felev, kezdes_ev, kepzesi_forma } = req.query;

  var condition = {
    [Op.and]: [
      szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
      kezdes_ev ? { '$diakok.kezdes_ev$': { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
      { pontszam: { [Op.gte]: 60 } },
      {
        [Op.or]: [
          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `MSc` }),
              ]
          },

          {
            [Op.and]:
              [
                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                sequelize.where(sequelize.literal('`kepzesi_szint`'), { [Op.like]: `BSc` }),
              ],
          }],
      },
    ]
  };

  if (!req.query.szakokId && !req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "A szak, az évfolyam (kezdési év) és a félév megadása kötelező!"
    });
    return;
  }

  if (!req.query.szakokId && !req.query.kezdes_ev && req.query.felev) {
    res.status(400).send({
      message: "A szak és az évfolyam (kezdési év) megadása kötelező!"
    });
    return;
  }

  if (!req.query.szakokId && req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "A szak és a félév megadása kötelező!"
    });
    return;
  }

  if (req.query.szakokId && !req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "Az évfolyam (kezdési év) és a félév megadása kötelező!"
    });
    return;
  }

  if (!req.query.szakokId && req.query.kezdes_ev && req.query.felev) {
    res.status(400).send({
      message: "A szak megadása kötelező!"
    });
    return;
  }

  if (req.query.szakokId && !req.query.kezdes_ev && req.query.felev) {
    res.status(400).send({
      message: "Az évfolyam (kezdési év) megadása kötelező!"
    });
    return;
  }

  if (req.query.szakokId && req.query.kezdes_ev && !req.query.felev) {
    res.status(400).send({
      message: "A félév megadása kötelező!"
    });
    return;
  }

  Eredmenyek.findAll({
    where: condition,
    include: [{
      model: diakok, as: "diakok", attributes: { exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'] },
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] } }]
    },],
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
      include: [
        [sequelize.fn("AVG", sequelize.col("pontszam")), "atlag"],
        [sequelize.fn("SUM", sequelize.literal("pontszam*kredit")), "eredmeny_osszeg"],
        [sequelize.fn("SUM", sequelize.col("kredit")), "kredit_osszeg"],
        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        [sequelize.literal(`(SELECT COUNT(eredmenyek2.pontszam) AS potok_szama 
        FROM eredmenyek AS eredmenyek2  LEFT OUTER JOIN diakok AS diakok2 ON eredmenyek2.diakokId = diakok2.id 
        WHERE 
        eredmenyek2.pontszam < 60 
        AND 
        eredmenyek2.pontszam IS NOT NULL 
        AND 
        ${szakokId ? `diakok2.szakokId=${szakokId}` : 1} 
        AND 
        ${kepzesi_forma ? `diakok2.kepzesi_forma LIKE '${kepzesi_forma}'` : 1} 
        AND 
        ${felev ? `eredmenyek2.felev=${felev}` : 1}
        AND 
        ${kezdes_ev ? `diakok2.kezdes_ev="${kezdes_ev + '-09-01'}"` : 1})`), "potok_szama"],
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

// Eredmény keresése azonosítója alapján
exports.egyEredmenyListazasa = (req, res) => {
  const id = req.params.id;

  Eredmenyek.findByPk(id, {
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
    ]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az eredmény keresése közben, az eredmény azonosítója: " + id
      });
    });
};

// Eredmeny módosítása azonosítója alapján
exports.frissites = (req, res) => {

  // Ha ezek a mezők nincsenek kitöltve, akkor hibaüzenettel visszatér
  if (!req.body.diakokId || !req.body.tantargyakId || !req.body.felev || !req.body.kredit ||
    !req.body.tipus) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }


  // Kérés validálása
  if (req.body.kredit < 0 || req.body.pontszam < 0 && req.body.pontszam_ellenorzes != -1) {
    res.status(400).send({
      message: "A mező értéke nem lehet negatív!"
    });
    return;
  }

  // Kérés validálása
  if (req.body.pontszam > 100) {
    res.status(400).send({
      message: "Hiba! Maximum 100 pont adható!"
    });
    return;
  }

  if (req.body.vizsgahoz_engedve == false && req.body.megjelent) {
    res.status(400).send({
      message: "Ha nincs a hallgató vizsgához engedve, kérem válassza ki, hogy nem jelent meg!"
    });
    return;
  }

  if (!req.body.megjelent) {
    req.body.pontszam = -1;
  }

  if (!req.body.pontszam) {
    req.body.pontszam == null;
  }

  if (!req.body.munkatarsakId) {
    req.body.munkatarsakId = null;
  }

  if (!req.body.szeminarium_munkatarsakId) {
    req.body.szeminarium_munkatarsakId = null;
  }

  if (
    //ellenőrzésre '' ad vissza nem null-t, tehát a null-os ellenörzés eseteket nem kell vizsgálni
    // Ha előtte 34 < pontszám < 60 aztán pedig 60 <= pont <= 100
    (req.body.pontszam <= 100 && req.body.pontszam >= 60 && req.body.pontszam_ellenorzes > 34 && req.body.pontszam_ellenorzes < 60) ||
    // Ha előtte 34 < pontszám < 60 aztán pedig 0 <= pont <= 34
    (req.body.pontszam <= 34 && req.body.pontszam >= 0 && req.body.pontszam_ellenorzes > 34 && req.body.pontszam_ellenorzes < 60) ||
    // Ha előtte -1 aztán pedig 0 <= pont <= 34
    (req.body.pontszam <= 34 && req.body.pontszam >= 0 && req.body.pontszam_ellenorzes == -1) ||
    // Ha előtte -1 aztán pedig 60 <= pont <= 100
    (req.body.pontszam <= 100 && req.body.pontszam >= 60 && req.body.pontszam_ellenorzes == -1)
  ) {
    var condition1 = {
      [Op.and]: [
        { diakokId: { [Op.like]: `${req.body.diakokId}` } },
        { tantargyakId: { [Op.like]: `${req.body.tantargyakId}` } },
        { felev: { [Op.like]: `${req.body.felev}` } },
        { kredit: { [Op.like]: `${req.body.kredit}` } },
        { tipus: { [Op.like]: `${req.body.tipus}` } },
        { pontszam: { [Op.is]: null } },
        { vizsgahoz_engedve: { [Op.is]: false } },
      ]
    };
    Eredmenyek.destroy({
      where: condition1,
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Az eredmény sikeresen törölve lett!"
          });
        } else {
          res.send({
            message: `Nem sikerült az eredmény törlés. Lehetséges, hogy az eredmény nem található!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Hiba lépett fel az eredmény törlés közben, azonosító: " + id
        });
      });
  }

  const id = req.params.id;

  Eredmenyek.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Az eredmény sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet az eredményt frissíteni, azonosító: ${id}. Lehetséges, hogy az eredmény nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az eredmény frissítése közben, azonosító: " + id
      });
    });

  var condition2 = {
    [Op.and]: [
      req.body.diakokId ? { diakokId: { [Op.like]: `${req.body.diakokId}` } } : null,
      req.body.tantargyakId ? { tantargyakId: { [Op.like]: `${req.body.tantargyakId}` } } : null,
      req.body.felev ? { felev: { [Op.like]: `${req.body.felev}` } } : null,
    ],
  }
  Eredmenyek.findAndCountAll({
    where: condition2
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data);
      const osszeg = response.osszesElem;
      if (osszeg < 3 && (
        //Az első két feltétel igazából teljesen értelmetlen, mert ellenőrzésre '' ad vissza nem null-t
        //Ha előtte a pontszám null volt és kapott egy olyan pontot ami pótvizsgát von maga után (34 < pont < 60)
        (req.body.pontszam < 60 && req.body.pontszam > 34 && req.body.pontszam_ellenorzes == null) ||
        //Ha előtte a pontszám null volt és nem jelent meg a vzsgán (pont = -1)
        (req.body.pontszam == -1 && req.body.pontszam_ellenorzes == null) ||
        //Ha előtte a pont 0 <= pontszám <= 34, és aztán kapott 34 < pont < 60 pontot (ha előtt -1 pont volt, azaz megbukás, akkor nem érvényes)
        (req.body.pontszam < 60 && req.body.pontszam > 34 && req.body.pontszam_ellenorzes <= 34 && req.body.pontszam_ellenorzes != -1) ||
        //Ha előtte a pont 0 <= pontszám <= 34, és aztán pontszám = -1
        (req.body.pontszam == -1 && req.body.pontszam_ellenorzes <= 34 && req.body.pontszam_ellenorzes != -1) ||
        //Ha előtte 60 <= pontszám <= 100 és utánna kapott 34 < pont < 60
        (req.body.pontszam < 60 && req.body.pontszam > 34 && req.body.pontszam_ellenorzes >= 60 && req.body.pontszam_ellenorzes <= 100) ||
        //Ha előtte 60 <= pontszám <= 100 és pontszám = -1
        (req.body.pontszam == -1 && req.body.pontszam_ellenorzes >= 60 && req.body.pontszam_ellenorzes <= 100)
      )) {

        req.body.pontszam = null;
        req.body.vizsgahoz_engedve = false;
        req.body.datum = '0000-00-00';

        // Eredmeny létrehozása
        const eredmeny = {
          diakokId: req.body.diakokId,
          tantargyakId: req.body.tantargyakId,
          felev: req.body.felev,
          kredit: req.body.kredit,
          tipus: req.body.tipus,
          munkatarsakId: req.body.munkatarsakId,
          szeminarium_munkatarsakId: req.body.szeminarium_munkatarsakId,
          pontszam: req.body.pontszam,
          vizsgahoz_engedve: req.body.vizsgahoz_engedve,
          datum: req.body.datum,
        };
        // Eredmény mentése az adatbázisba
        Eredmenyek.create(eredmeny)
          .then(data => {
            res.send(data);
          })
          .catch(err => {
            res.status(500).send({
              message:
                err.message || "Hiba lépett fel!"
            });
          });
      }
    })
};

// Eredmény törlése azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Eredmenyek.destroy({
    where: { id: id }

  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Az eredmény sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült az eredmény törlése, azonsító:${id}. Lehetséges, hogy az eredmény nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a Tanterv törlése közben, azonosító: " + id
      });
    });
};

// Minden eredmény törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Eredmenyek.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} eredmény sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az eredmények törlése közben."
      });
    });
};
