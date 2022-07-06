const { tanszekek, szakok } = require("../models");
const db = require("../models");
const Tantargyak = db.tantargyak;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: tantargyak } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, tantargyak, osszesOldal, jelenlegiOldal };
};

// Új tantárgy létrehozása és mentése
exports.letrehozas = (req, res) => {
  // Kérés validálása
  if (!req.body.tantargy_nev || !req.body.tipus || !req.body.tanszekekId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  // Tantárgy létrehozása
  const tantargyak = {
    tantargy_nev: req.body.tantargy_nev,
    tipus: req.body.tipus,
    tanszekekId: req.body.tanszekekId,
  };

  // Tantárgy mentése az adatbázisba
  Tantargyak.create(tantargyak)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgy létrehozása közben."
      });
    });
};

//Minden tantargy listázása lapozás nélkül a legördülő listához //Ha alapból minden tantárgy kell.
exports.tantargyListazasaLapozasNelkul = (req, res) => {
  const tanszekekId = req.query.tanszekekId;
  if (req.query.tanszekekId) {
    var condition = {
      [Op.or]:
        [
          { tanszekekId: { [Op.like]: `${tanszekekId}` } },
          {
            [Op.and]: [
              { tipus: { [Op.notLike]: `szakmai felkészítés` } },
              { tipus: { [Op.notLike]: `szakmai felkészítés osztott` } },
              { tipus: { [Op.notLike]: `gyakorlat` } },
            ]
          },
        ]
    }
  }
  if (!req.query.tanszekekId) {
    var condition = tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` }, } : null;
  }

  Tantargyak.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'tipus', 'tantargy_nev'],
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] } }]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgyak keresése közben."
      });
    });
};

/*
//Minden tantargy listázása lapozás nélkül a legördülő listához szűréssel
exports.tantargyListazasaLapozasNelkulSzuressel = (req, res) => {
  const tanszekekId = req.query.tanszekekId;
  var condition = {
    [Op.or]:
      [
        tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
        {
          [Op.and]: [
            { tipus: { [Op.notLike]: `szakmai felkészítés` } },
            { tipus: { [Op.notLike]: `szakmai felkészítés osztott` } },
            { tipus: { [Op.notLike]: `gyakorlat` } },
          ]
        },
      ]
  }
  Tantargyak.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'tipus', 'tantargy_nev'],
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] } }]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgyak keresése közben."
      });
    });
};
*/

// Minden tantárgy listázása az adatbázisból.
exports.tantargyListazasaLapozassal = (req, res) => {
  const { oldal, meret, tantargy_nev, tanszekekId, tipus } = req.query;
  var condition = {
    [Op.and]: [
      tantargy_nev ? { tantargy_nev: { [Op.like]: `%${tantargy_nev}%` } } : null,
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      tipus ? { tipus: { [Op.like]: `${tipus}` } } : null,
    ]
  };

  const { limit, offset } = oldalszamozas(oldal, meret);

  Tantargyak.findAndCountAll({
    where: condition, limit, offset,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'tipus', 'tantargy_nev'],
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgy keresése közben."
      });
    });
};

// Tantárgy keresése azonosítója alapján
exports.egyTantargyListazasa = (req, res) => {
  const id = req.params.id;

  Tantargyak.findByPk(id, {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tantárgy keresése közben, a tantárgy azonosítója: " + id
      });
    });
};

// Tantárgy módosítása azonosítója alapján
exports.frissites = (req, res) => {
  if (!req.body.tantargy_nev || !req.body.tipus || !req.body.tanszekekId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  const id = req.params.id;

  Tantargyak.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tantárgy sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet a tantárgyat frissíteni, azonosító: ${id}. Lehetséges, hogy a tantárgy nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a Tantárgy frissítése közben, azonosító: " + id
      });
    });
};

// Tantárgy törlése azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Tantargyak.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tantárgy sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült a tantárgy törlése, azonsító:${id}. Lehetséges, hogy a tantárgy nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tantárgy törlése közben, azonosító: " + id
      });
    });
};

// Minden Tantárgy törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Tantargyak.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} tantárgy sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgyak törlése közben."
      });
    });
};
