const { tanszekek, sequelize } = require("../models");
const db = require("../models");
const Szakok = db.szakok;
const Tanszekek = db.tanszekek;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: szakok } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, szakok, osszesOldal, jelenlegiOldal };
};

// Új szak létrehozása és mentése
exports.letrehozas = (req, res) => {
  // Kérés validálása
  if (!req.body.szak_nev || !req.body.kepzesi_szint || !req.body.tanszekekId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }

  // Szak létrehozása
  const szakok = {
    szak_nev: req.body.szak_nev,
    kepzesi_szint: req.body.kepzesi_szint,
    tanszekekId: req.body.tanszekekId,
  };

  // Szak mentése az adatbázisba
  Szakok.create(szakok)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a szak létrehozása közben."
      });
    });
};

//Minden szak listázása lapozás nélkül
exports.szakListazasaLapozasNelkul = (req, res) => {
  const tanszekekId = req.query.tanszekekId;
  var condition = tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null;

  Szakok.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'szak_nev', 'kepzesi_szint'],
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] } }],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a szakok keresése közben."
      });
    });
};

// Minden szak listázása az adatbázisból.
exports.szakListazasaLapozassal = (req, res) => {
  const { oldal, meret, szak_nev, tanszekekId, kepzesi_szint } = req.query;
  var condition = {
    [Op.and]: [
      szak_nev ? { szak_nev: { [Op.like]: `%${szak_nev}%` } } : null,
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      kepzesi_szint ? { kepzesi_szint: { [Op.like]: `%${kepzesi_szint}%` } } : null,
    ]
  };

  const { limit, offset } = oldalszamozas(oldal, meret);

  Szakok.findAndCountAll({
    where: condition, limit, offset,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'szak_nev', 'kepzesi_szint'],
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a szak keresése közben."
      });
    });
};

// Szak keresése azonosítója alapján
exports.egySzakListazasa = (req, res) => {
  const id = req.params.id;

  Szakok.findByPk(id, {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a szak keresése közben, a szak azonosítója: " + id
      });
    });
};

// Szak módosítása azonosítója alapján
exports.frissites = (req, res) => {
  if (!req.body.szak_nev || !req.body.kepzesi_szint || !req.body.tanszekekId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  const id = req.params.id;

  Szakok.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A szak sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet a szakot frissíteni, azonosító: ${id}. Lehetséges, hogy a szak nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a szak frissítése közben, azonosító: " + id
      });
    });
};

// Szak törlése azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Szakok.destroy({
    where: { id: id }

  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A szak sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült a szak törlése, azonsító: ${id}. Lehetséges, hogy a szak nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a szak törlése közben, azonosító: " + id
      });
    });
};

// Minden szak törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Szakok.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} szak sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a szakek törlése közben."
      });
    });
};