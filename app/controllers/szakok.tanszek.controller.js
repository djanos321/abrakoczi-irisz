const { tanszekek } = require("../models");
const db = require("../models");
const Szakok = db.szakok;
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

//Minden szak listázása lapozás nélkül
exports.szakListazasaLapozasNelkul = (req, res) => {
  const tanszekekId = req.body.tanszekekId;
  var condition = tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null;

  Szakok.findAll({
    where: condition,
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    order: [[{ model: tanszekek, as: "tanszekek" }, 'tanszek_nev'], 'szak_nev', 'kepzesi_szint'],
    include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
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
  const { oldal, meret, tanszekekId, szak_nev } = req.body;
  var condition = {
    [Op.and]: [
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      szak_nev ? { szak_nev: { [Op.like]: `%${szak_nev}%` } } : null]
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
