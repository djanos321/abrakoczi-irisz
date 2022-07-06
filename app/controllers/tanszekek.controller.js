const db = require("../models");
const Tanszekek = db.tanszekek;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: tanszekek } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, tanszekek, osszesOldal, jelenlegiOldal };
};

// Új tanszékek létrehozása és mentése
exports.letrehozas = (req, res) => {
  // Kérés validálása
  if (!req.body.tanszek_nev || !req.body.tanszek_tipus) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  // Tanszék létrehozása
  const tanszekek = {
    tanszek_nev: req.body.tanszek_nev,
    tanszek_tipus: req.body.tanszek_tipus
  };

  // Tanszék mentése az adatbázisba
  Tanszekek.create(tanszekek)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tanszék létrehozása közben."
      });
    });
};

//Minden tanszék listázása lapozás nélkül
exports.tanszekListazasLapozasNelkul = (req, res) => {
  const tanszek_nev = req.query.tanszek_nev;
  var condition = {
    [Op.and]: [
      tanszek_nev ? { tanszek_nev: { [Op.like]: `%${tanszek_nev}%` } } : null,
    ],
  };
  Tanszekek.findAll({ where: condition, attributes: { exclude: ['createdAt', 'updatedAt'] }, order: ['tanszek_nev'], })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tanszékek keresése közben."
      });
    });
};

// Minden tanszék listázása az adatbázisból lapozással
exports.tanszekListazasLapozassal = (req, res) => {
  const { oldal, meret, tanszek_nev } = req.query;
  var condition = tanszek_nev ? { tanszek_nev: { [Op.like]: `%${tanszek_nev}%` } } : null;

  const { limit, offset } = oldalszamozas(oldal, meret);

  Tanszekek.findAndCountAll({
    where: condition, limit, offset,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: ['tanszek_nev'],
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tanszékek keresése közben."
      });
    });
};

// Tanszék keresése azonosítója alapján
exports.egyTanszekListazasa = (req, res) => {
  const id = req.params.id;

  Tanszekek.findByPk(id, {
    attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tanszék keresése közben, a tanszék azonosítója: " + id
      });
    });
};

// Tanszék módosítása azonosítója alapján
exports.frissites = (req, res) => {
  if (!req.body.tanszek_nev || !req.body.tanszek_tipus) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  const id = req.params.id;

  Tanszekek.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tanszék sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet a tanszéket frissíteni, azonosító: ${id}. Lehetséges, hogy a tanszék nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tanszék frissítése közben, azonosító: " + id
      });
    });
};

// Tanszék törlése azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Tanszekek.destroy({
    where: { id: id }

  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tanszék sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült a tanszék törlése, azonsító:${id}. Lehetséges, hogy a tanszék nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tanszék törlése közben, azonosító: " + id
      });
    });
};

// Minden tanszék törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Tanszekek.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} tanszék sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tanszékek törlése közben."
      });
    });
};
