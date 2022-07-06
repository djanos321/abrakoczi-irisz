const { sequelize, szakok, tanszekek, munkatarsak } = require("../models");
const db = require("../models");
const Szakdolgozat_evfolyammunka_tarifikaciok = db.szakdolgozat_evfolyammunka_tarifikaciok;
const Tanarok = db.munkatarsak;
const Diakok_szama = db.diakok_szama;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatokTanarok = (data, oldal, limit) => {
  const { count: osszesElem, rows: tanar_tarifikaciok } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, tanar_tarifikaciok, osszesOldal, jelenlegiOldal };
};

const oldalszamozasiAdatokTarifikacio = (data, oldal, limit) => {
  const { count: osszesElem, rows: szakdolgozat_evfolyammunka_tarifikaciok } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, szakdolgozat_evfolyammunka_tarifikaciok, osszesOldal, jelenlegiOldal };
};

// Új szakdolgozat_évfolyammunka_tarifikáció létrehozása és mentése
exports.letrehozas = (req, res) => {
  // Kérés validálása, jelenleg amit számolunk azt nem kötelező megadni
  if (!req.body.szakokId || !req.body.munkatarsakId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }

  if (req.body.b2 < 0 || req.body.b3 < 0 || req.body.b4 < 0 || req.body.m1 < 0 || req.body.m2 < 0) {
    res.status(400).send({
      message: "A mező tartalma nem lehet negatív szám!"
    });
    return;
  }
  // Szakdolgozat_evfolyammunka_tarifikacio létrehozása
  const szakdolgozat_evfolyammunka_tarifikaciok = {
    munkatarsakId: req.body.munkatarsakId,
    szakokId: req.body.szakokId,
    b2: req.body.b2,
    b3: req.body.b3,
    b4: req.body.b4,
    m1: req.body.m1,
    m2: req.body.m2,
  };

  // Tarifikacio mentése az adatbázisba
  Szakdolgozat_evfolyammunka_tarifikaciok.create(szakdolgozat_evfolyammunka_tarifikaciok)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tarifikáció létrehozása közben."
      });
    });
};

// Minden tantárgy tarifikáció listázása az adatbázisból.
exports.szakdolgozatEvfolyammunkaTarifikacioListazasa = (req, res) => {
  const { tanszekekId, oldal, meret, szakokId, munkatarsakId } = req.query;
  var condition = {
    [Op.and]: [
      tanszekekId ? { '$munkatarsak.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
      szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
      munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
    ]
  };
  const { limit, offset } = oldalszamozas(oldal, meret);

  Szakdolgozat_evfolyammunka_tarifikaciok.findAndCountAll({
    where: condition, limit, offset,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      { model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] } },
      { model: munkatarsak, as: "munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
    ],
    order: [
      [{ model: szakok, as: "szakok" }, 'szak_nev'],
      [{ model: szakok, as: "szakok" }, 'kepzesi_szint'],
      [{ model: munkatarsak, as: "munkatarsak" }, 'nev'],
    ],

  })
    .then(data => {
      const response = oldalszamozasiAdatokTarifikacio(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tarifikáció keresése közben."
      });
    });
};

//A tanárok terhelését keresi meg, amit táblázat formában lehet megjeleníteni
exports.tanarTerhelesListazasa = (req, res) => {
  const { oldal, meret, id, tanszekekId } = req.query;
  var condition = {
    [Op.and]: [
      id ? { id: { [Op.like]: `${id}` } } : null,
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      { '$tanszekek.tanszek_tipus$': { [Op.not]: null } },
    ]
  };
  const { limit, offset } = oldalszamozas(oldal, meret);

  Tanarok.findAndCountAll({
    where: condition, limit, offset,
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev'],

      include: [
        [sequelize.literal('(Select SUM(szakdolgozat_evfolyammunka_tarifikaciok.b2) FROM szakdolgozat_evfolyammunka_tarifikaciok as szakdolgozat_evfolyammunka_tarifikaciok WHERE szakdolgozat_evfolyammunka_tarifikaciok.munkatarsakId = munkatarsak.id ) '), 'tanar_terheles_osszeg_b2'],
        [sequelize.literal('(Select SUM(szakdolgozat_evfolyammunka_tarifikaciok.b3) FROM szakdolgozat_evfolyammunka_tarifikaciok as szakdolgozat_evfolyammunka_tarifikaciok WHERE szakdolgozat_evfolyammunka_tarifikaciok.munkatarsakId = munkatarsak.id ) '), 'tanar_terheles_osszeg_b3'],
        [sequelize.literal('(Select SUM(szakdolgozat_evfolyammunka_tarifikaciok.b4) FROM szakdolgozat_evfolyammunka_tarifikaciok as szakdolgozat_evfolyammunka_tarifikaciok WHERE szakdolgozat_evfolyammunka_tarifikaciok.munkatarsakId = munkatarsak.id ) '), 'tanar_terheles_osszeg_b4'],
        [sequelize.literal('(Select SUM(szakdolgozat_evfolyammunka_tarifikaciok.m1) FROM szakdolgozat_evfolyammunka_tarifikaciok as szakdolgozat_evfolyammunka_tarifikaciok WHERE szakdolgozat_evfolyammunka_tarifikaciok.munkatarsakId = munkatarsak.id ) '), 'tanar_terheles_osszeg_m1'],
        [sequelize.literal('(Select SUM(szakdolgozat_evfolyammunka_tarifikaciok.m2) FROM szakdolgozat_evfolyammunka_tarifikaciok as szakdolgozat_evfolyammunka_tarifikaciok WHERE szakdolgozat_evfolyammunka_tarifikaciok.munkatarsakId = munkatarsak.id ) '), 'tanar_terheles_osszeg_m2'],
      ]
    },
    order: ['nev'],
    distinct: true,

  })
    .then(data => {
      const response = oldalszamozasiAdatokTanarok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az összeg keresése közben."
      });
    });
};

//Minden adat listázása
exports.kiosztottDiakokSzamaBsc = (req, res) => {
  const { szakokId, tanszekekId } = req.query;
  var condition = {
    [Op.and]: [
      szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
      tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
    ],
    '$szakok.kepzesi_szint$': { [Op.like]: `BSc` }
  };
  Szakdolgozat_evfolyammunka_tarifikaciok.findAll({
    where: condition,
    include: [
      {
        model: szakok, as: "szakok",
        attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev'] },
      },],
    attributes: {
      include: [
        [sequelize.fn("SUM", sequelize.col("b2")), "b2_osszeg"],
        [sequelize.fn("SUM", sequelize.col("b3")), "b3_osszeg"],
        [sequelize.fn("SUM", sequelize.col("b4")), "b4_osszeg"],
      ],
      exclude: ['createdAt', 'updatedAt', 'b2', 'b3', 'b4', 'm1', 'm2', 'munkatarsakId'],
    },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a diákok számának a keresése közben."
      });
    });
};

//Minden adat listázása
exports.kiosztottDiakokSzamaMsc = (req, res) => {
  const { szakokId, tanszekekId } = req.query;
  var condition = {
    [Op.and]: [
      szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
      tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
    ],
    '$szakok.kepzesi_szint$': { [Op.like]: `MSc` }
  };
  Szakdolgozat_evfolyammunka_tarifikaciok.findAll({
    where: condition,
    include: [
      {
        model: szakok, as: "szakok",
        attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev'] },
      },],
    attributes: {
      include: [
        [sequelize.fn("SUM", sequelize.col("m1")), "m1_osszeg"],
        [sequelize.fn("SUM", sequelize.col("m2")), "m2_osszeg"],
      ],
      exclude: ['createdAt', 'updatedAt', 'b2', 'b3', 'b4', 'm1', 'm2', 'munkatarsakId'],
    },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a diákok számának a keresése közben."
      });
    });
};

// Tarifikáció módosítása azonosítója alapján
exports.frissites = (req, res) => {
  // Kérés validálása
  if (!req.body.szakokId || !req.body.munkatarsakId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }

  if (req.body.b2 < 0 || req.body.b3 < 0 || req.body.b4 < 0 || req.body.m1 < 0 || req.body.m2 < 0) {
    res.status(400).send({
      message: "A mező tartalma nem lehet negatív szám!"
    });
    return;
  }
  if (!req.body.b2) {
    req.body.b2 = 0;
  }
  if (!req.body.b3) {
    req.body.b3 = 0;
  }
  if (!req.body.b4) {
    req.body.b4 = 0;
  }
  if (!req.body.m1) {
    req.body.m1 = 0;
  }
  if (!req.body.m2) {
    req.body.m2 = 0;
  }
  const id = req.params.id;

  Szakdolgozat_evfolyammunka_tarifikaciok.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tarifikáció sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet a tarifikációt frissíteni, azonosító: ${id}. Lehetséges, hogy a  tarifikáció nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tarifikáció frissítése közben, azonosító: " + id
      });
    });
};


// Tarifikació keresése azonosítója alapján
exports.egyTarifiakcioListazasa = (req, res) => {
  const id = req.params.id;

  Szakdolgozat_evfolyammunka_tarifikaciok.findByPk(id, {
    attributes: { exclude: ['createdAt', 'updatedAt',] },
    include: [
      { model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] } },
      { model: munkatarsak, as: "munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },

    ],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a keresés közben, a Tarifikáció azonosítója: " + id
      });
    });
};

// Törlés azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Szakdolgozat_evfolyammunka_tarifikaciok.destroy({
    where: { id: id }

  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tarifikáció sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült a tarifikáció törlése, azonsító:${id}. Lehetséges, hogy az elem nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tarifikáció törlése közben, azonosító: " + id
      });
    });
};

// Minden Tantárgy tarifikáció törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Szakdolgozat_evfolyammunka_tarifikaciok.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} tarifikációs adat sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tarifikációs adatok törlése közben."
      });
    });
};

