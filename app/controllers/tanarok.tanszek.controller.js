const { tanszekek } = require("../models");
const db = require("../models");
const Tanarok = db.munkatarsak;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
  const limit = meret ? +meret : 3;
  const offset = oldal ? oldal * limit : 0;

  return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: tanarok } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, tanarok, osszesOldal, jelenlegiOldal };
};

//Minden tanár listázása lapozás nélkül
exports.tanarListazasaLapozasNelkul = (req, res) => {
  const tanszekekId = req.body.tanszekekId;
  var condition = {
    [Op.and]: [
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      { tanszekekId: { [Op.not]: null } },
    ]
  };

  Tanarok.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, },],
    order: ['nev'],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tanárok keresése közben."
      });
    });
};

// Minden tanár listázása az adatbázisból.
exports.tanarListazasaLapozassal = (req, res) => {
  const { oldal, meret, tanszekekId, nev } = req.body;
  var condition = {
    [Op.and]: [
      nev ? { nev: { [Op.like]: `%${nev}%` } } : null,
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      { tanszekekId: { [Op.not]: null } },
    ]
  };

  const { limit, offset } = oldalszamozas(oldal, meret);

  Tanarok.findAndCountAll({
    where: condition, limit, offset,
    attributes: { exclude: ['createdAt', 'updatedAt', 'jelszo'] },
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, },],
    order: ['nev'],
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tanárok keresése közben."
      });
    });
};




