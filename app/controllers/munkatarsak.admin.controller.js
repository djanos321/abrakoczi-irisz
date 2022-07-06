const { tanszekek } = require("../models");
const db = require("../models");
const Munkatarsak = db.munkatarsak;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: munkatarsak } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, munkatarsak, osszesOldal, jelenlegiOldal };
};

//Minden munkatárs listázása lapozás nélkül, csak a tanárokra van szükség
exports.munkatarsakListazasaLapozasNelkul = (req, res) => {
  const tanszekekId = req.query.tanszekekId;

  var condition = {
    [Op.and]: [
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      { tanszekekId: { [Op.not]: null } },
    ]
  };

  Munkatarsak.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] } }],
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'nev'],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a munkatársak keresése közben."
      });
    });
};


// Minden munkatárs listázása az adatbázisból.
exports.munkatarsakListazasaLapozassal = (req, res) => {
  const { oldal, meret, nev, tanszekekId } = req.query;
  var condition = {
    [Op.and]: [
      nev ? { nev: { [Op.like]: `%${nev}%` } } : null,
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
    ]
  };

  const { limit, offset } = oldalszamozas(oldal, meret);

  Munkatarsak.findAndCountAll({
    where: condition, limit, offset,
    attributes: { exclude: ['createdAt', 'updatedAt', 'jelszo'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'nev'],
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a munkatársak keresése közben."
      });
    });
};

// Munkatárs keresése azonosítója alapján
exports.egyMunkatarsListazasa = (req, res) => {
  const id = req.params.id;

  Munkatarsak.findByPk(id,
    {
      attributes: { exclude: ['createdAt', 'updatedAt', 'jelszo'] },
      include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
    })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a munkatárs keresése közben, a munkatárs azonosítója: " + id
      });
    });
};

// Munkatars módosítása azonosítója alapján
exports.frissites = (req, res) => {
  // Kérés validálása
  if (!req.body.nev) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  const id = req.params.id;

  Munkatarsak.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A munkatárs adatai sikeresen frissítve lettek."
        });
      } else {
        res.send({
          message: `Nem lehet a munkatárs adatait frissíteni, azonosító: ${id}. Lehetséges, hogy a munkatárs nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a munkatárs adatainak a frissítése közben, azonosító: " + id
      });
    });
};

// Munkatárs törlése azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Munkatarsak.destroy({
    where: { id: id }

  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A munkatárs adatai sikeresen törölve lettek!"
        });
      } else {
        res.send({
          message: `Nem sikerült a munkatárs törlése, azonsító:${id}. Lehetséges, hogy a munkatárs nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a munkakatárs adataianak a törlése közben, azonosító: " + id
      });
    });
};

// Minden munkatárs törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Munkatarsak.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} munkatárs sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a munkatársak törlése közben."
      });
    });
};
