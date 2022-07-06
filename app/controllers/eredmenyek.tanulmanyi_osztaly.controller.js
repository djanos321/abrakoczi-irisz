const { sequelize, szakok, tantargyak, munkatarsak, diakok } = require("../models");
const db = require("../models");
const Eredmenyek = db.eredmenyek;
const Op = db.Sequelize.Op;


// A paraméterben megadott félév eredményeinek a listázása a bejelntkezett diáknak (id szerint van azonosítva)
exports.osszesEredmenyListazasa = (req, res) => {
  const { tantargyakId, szakokId, kepzesi_forma, felev } = req.query;
  if (!req.query.tantargyakId) {
    res.status(400).send({
      message: "A tantárgy megadása kötelező!"
    });
    return;
  }
  if (!req.query.szakokId) {
    res.status(400).send({
      message: "A szak megadása kötelező!"
    });
    return;
  }
  if (!req.query.kepzesi_forma) {
    res.status(400).send({
      message: "A képzési forma megadása kötelező!"
    });
    return;
  }
  if (!req.query.felev) {
    res.status(400).send({
      message: "A félév megadása kötelező!"
    });
    return;
  }
  var condition = {
    [Op.and]: [
      tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
      szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
      kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      felev ? sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: `${Math.round(felev / 2) - 1}` }) : null,
      { pontszam: { [Op.is]: null } },
    ],
  };

  Eredmenyek.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [{
      model: diakok, as: "diakok", attributes:
      {
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
    { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },],
    order: [
      [{ model: diakok, as: "diakok" }, 'diak_nev'],
      'datum',
    ],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az adatok keresése közben!"
      });
    });
};

// Azokat a tantárgyakat keresi meg, amelyekben null a ponsztám értéke
exports.tantargyakListazasa = (req, res) => {
  var condition = {
    [Op.and]: [
      { pontszam: { [Op.is]: null } },
      sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
    ]
  };
  Eredmenyek.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'felev', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
    include: [
      {
        model: diakok, as: "diakok", attributes:
        {
          exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kepzesi_forma'],
          include: [
            [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
            [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
          ],
        },
        include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
      },
      { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt', 'kepzesi_szint', 'tanszekekId'] }, },
    ],
    group: ['tantargyakId'],
    order: [
      [{ model: tantargyak, as: "tantargyak" }, 'tantargy_nev'],
    ],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgy keresése közben!"
      });
    });
};

// Az adott tanár és a kiválasztott tantárgy alapján megjelenített szakok listáját adja vissza
exports.szakokListazasa = (req, res) => {
  const { tantargyakId } = req.query;
  var condition =
  {
    [Op.and]: [
      { pontszam: { [Op.is]: null } },
      sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
      tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
    ]
  };
  Eredmenyek.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'felev', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
    include: [{
      model: diakok, as: "diakok", attributes:
      {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kepzesi_forma', 'kezdes_ev', 'id'],
        include: [
          [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
          [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        ],
      },
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt', 'tanszekId'] }, }]
    },],
    group: [
      'szakokId'
    ],
    order: [
      [{ model: diakok, as: "diakok" }, { model: szakok, as: "szakok" }, 'szak_nev'],
    ],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a szak keresése közben!"
      });
    });
};

// A képzési formákat listázza ki
exports.kepzesiFormaListazasa = (req, res) => {
  const { tantargyakId, szakokId } = req.query;
  var condition =

  {
    [Op.and]: [
      { pontszam: { [Op.is]: null } },
      sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
      tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
      szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
    ]
  };
  Eredmenyek.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'felev', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
    include: [{
      model: diakok, as: "diakok", attributes:
      {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kezdes_ev', 'id'],
        include: [
          [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
          [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        ],
      },
    },],

    group: [
      'kepzesi_forma',
    ],
    order: [
      [{ model: diakok, as: "diakok" }, 'kepzesi_forma'],
    ],

  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az képzési forma keresése közben!"
      });
    });
};

// A megfelelő féléveket listázza ki
exports.felevListazasa = (req, res) => {
  const { tantargyakId, szakokId, kepzesi_forma } = req.query;
  var condition =
  {
    [Op.and]: [
      { pontszam: { [Op.is]: null } },
      sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
      tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
      szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
      kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
    ]
  };
  Eredmenyek.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
    include: [{
      model: diakok, as: "diakok", attributes:
      {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kezdes_ev', 'id'],
        include: [
          [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
          [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        ],
      },
    },],

    group: [
      'felev',
    ],
    order: [
      'felev',
    ],

  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az képzési forma keresése közben!"
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

  const id = req.params.id;

  Eredmenyek.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A sor sikeresen frissítve lett: "
        });
      } else {
        res.send({
          message: `Nem lehet az adatot frissíteni, azonosító: ${id}. Lehetséges, hogy az adat nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az adat frissítése közben, azonosító: " + id
      });
    });
};