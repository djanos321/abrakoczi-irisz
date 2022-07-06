const { sequelize, tantargyak, munkatarsak, tanszekek } = require("../models");
const db = require("../models");
const Tantargy_tarifikaciok = db.tantargy_tarifikaciok;
const Munkatarsak = db.munkatarsak;
const Op = db.Sequelize.Op;
const QueryTypes = db.Sequelize.QueryTypes;

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
  const { count: osszesElem, rows: tantargy_tarifikaciok } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, tantargy_tarifikaciok, osszesOldal, jelenlegiOldal };
};

// Új tantárgy_tarifikáció létrehozása és mentése
exports.letrehozas = (req, res) => {
  if (!req.body.felev || !req.body.kredit || !req.body.tipus ||
    !req.body.kepzesi_forma || !req.body.hallgatok_szama ||
    !req.body.tantargyakId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  if (req.body.hallgatok_szama < 0 || req.body.eloadas < 0 ||
    req.body.szeminarium < 0 || req.body.laboratoriumi < 0 ||
    req.body.kredit < 0) {
    res.status(400).send({
      message: "A mező értéke nem lehet negatív!"
    });
    return;
  }
  if(!req.body.munkatarsakId){
    req.body.munkatarsakId = null;
  }
  if(!req.body.szeminarium_munkatarsakId){
    req.body.szeminarium_munkatarsakId = null;
  }
    if(!req.body.eloadas){
    req.body.eloadas = 0;
  }
  if(!req.body.szeminarium){
    req.body.szeminarium = 0;
  }
  if(!req.body.laboratoriumi){
    req.body.laboratoriumi = 0;
  }
  // Tanterv létrehozása
  const tantargy_tarifikaciok = {
    tantargyakId: req.body.tantargyakId,
    felev: req.body.felev,
    kredit: req.body.kredit,
    tipus: req.body.tipus,
    kepzesi_forma: req.body.kepzesi_forma,
    hallgatok_szama: req.body.hallgatok_szama,
    eloadas: req.body.eloadas,
    laboratoriumi: req.body.laboratoriumi,
    szeminarium: req.body.szeminarium,
    munkatarsakId: req.body.munkatarsakId,
    szeminarium_munkatarsakId: req.body.szeminarium_munkatarsakId
  };

  // Tarifikacio mentése az adatbázisba
  Tantargy_tarifikaciok.create(tantargy_tarifikaciok)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgy tarifikáció létrehozása közben."
      });
    });
};

// Minden tantárgy tarifikáció listázása az adatbázisból.
exports.tantargyTarifiakcioListazasa = (req, res) => {
  const { tanszekekId, oldal, meret, tantargyakId, munkatarsakId, felev, kepzesi_forma } = req.query;
  var condition = {
    [Op.and]: [
      tanszekekId ? { '$tantargyak.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
      tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
      munkatarsakId ? {
        [Op.or]: [
          { munkatarsakId: { [Op.like]: `${munkatarsakId}` } },
          { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } },
        ]
      } : null,
      felev ? { felev: { [Op.like]: `${felev}` } } : null,
      kepzesi_forma ? { kepzesi_forma: { [Op.like]: `${kepzesi_forma}` } } : null,
    ]
  };
  const { limit, offset } = oldalszamozas(oldal, meret);

  Tantargy_tarifikaciok.findAndCountAll({
    where: condition, limit, offset,
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
    include: [
      { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] } },
      { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
      { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },

    ],
    order: [
      'felev',
      'kepzesi_forma',
      'tipus',
      [{ model: tantargyak, as: "tantargyak" }, 'tantargy_nev'],

    ],
  })
    .then(data => {
      const response = oldalszamozasiAdatokTarifikacio(data, oldal, limit);
      res.send(response);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgy tarifikáció keresése közben."
      });
    });
};

exports.terhelesOsszegListazasa = (req, res) => {
  const { tanszekekId } = req.query;
  var condition = {
    [Op.and]: [
      tanszekekId ? { '$tantargyak.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
    ]
  };
  sequelize.query(`SELECT 
  (SELECT SUM(tarifikacios_valtozok.beszamolo) FROM tarifikacios_valtozok, tantargy_tarifikaciok 
  LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.tipus LIKE 'beszámoló') 
  AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_beszamolo_osszeg,

  (SELECT SUM(tantargy_tarifikaciok.szeminarium) FROM tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_osszeg,

  (SELECT SUM(tarifikacios_valtozok.onallo_munka * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.szeminarium != 0)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_onallo_munka_osszeg,

  (SELECT SUM(tarifikacios_valtozok.dolgozatjavitas_szeminarium * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.szeminarium != 0)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_dolgozatjavitas_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga_konzultacio) FROM tarifikacios_valtozok, tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND (tantargy_tarifikaciok.eloadas != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS eloadas_vizsga_konzultacio_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND (tantargy_tarifikaciok.eloadas != 0)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS eloadas_vizsga_osszeg,


  (SELECT SUM(tarifikacios_valtozok.beszamolo) FROM tarifikacios_valtozok, tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.tipus LIKE 'beszámoló') 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_beszamolo_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga_konzultacio) FROM tarifikacios_valtozok, tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_vizsga_konzultacio_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_vizsga_osszeg,

  (SELECT SUM(tarifikacios_valtozok.onallo_munka * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_onallo_munka_osszeg,

  (SELECT SUM(tarifikacios_valtozok.dolgozatjavitas_levelezo * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_dolgozatjavitas_osszeg,

  (SELECT SUM(tantargy_tarifikaciok.kredit) FROM tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.kredit MOD 2 = 0) 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS paros_kredit_osszeg,

  (SELECT SUM(tantargy_tarifikaciok.kredit + 1) FROM tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.kredit MOD 2 = 1) 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS paratlan_kredit_osszeg,

  SUM(tantargy_tarifikaciok.eloadas) AS eloadas_osszeg,
  SUM(tantargy_tarifikaciok.hallgatok_szama * tarifikacios_valtozok.onallo_munka) AS eloadas_onallo_munka_osszeg,
  SUM(tantargy_tarifikaciok.hallgatok_szama * tarifikacios_valtozok.dolgozatjavitas_eloadas) AS eloadas_dolgozatjavitas_osszeg
  FROM tarifikacios_valtozok,  tantargy_tarifikaciok
  LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali' 
  AND tantargy_tarifikaciok.eloadas != 0 
  AND ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1})
  `, { type: QueryTypes.SELECT })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az összeg keresése közben."
      });
    });
};

exports.felhasznalatlanTerhelesOsszegListazasa = (req, res) => {
  const { tanszekekId } = req.query;
  var condition = {
    [Op.and]: [
      tanszekekId ? { '$tantargyak.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
    ]
  };
  sequelize.query(`SELECT 
  (SELECT SUM(tarifikacios_valtozok.beszamolo) FROM tarifikacios_valtozok, tantargy_tarifikaciok 
  LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.tipus LIKE 'beszámoló') 
  AND (tantargy_tarifikaciok.szeminarium_munkatarsakId IS null)
  AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_beszamolo_osszeg,

  (SELECT SUM(tantargy_tarifikaciok.szeminarium) FROM tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.szeminarium_munkatarsakId IS null)
  AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_osszeg,

  (SELECT SUM(tarifikacios_valtozok.onallo_munka * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.szeminarium_munkatarsakId IS null)
  AND (tantargy_tarifikaciok.szeminarium != 0)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_onallo_munka_osszeg,

  (SELECT SUM(tarifikacios_valtozok.dolgozatjavitas_szeminarium * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.szeminarium != 0)
  AND (tantargy_tarifikaciok.szeminarium_munkatarsakId IS null)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS szeminarium_dolgozatjavitas_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga_konzultacio) FROM tarifikacios_valtozok, tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND (tantargy_tarifikaciok.eloadas != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS eloadas_vizsga_konzultacio_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND (tantargy_tarifikaciok.eloadas != 0)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS eloadas_vizsga_osszeg,



  (SELECT SUM(tarifikacios_valtozok.beszamolo) FROM tarifikacios_valtozok, tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND (tantargy_tarifikaciok.tipus LIKE 'beszámoló') 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_beszamolo_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga_konzultacio) FROM tarifikacios_valtozok, tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_vizsga_konzultacio_osszeg,

  (SELECT SUM(tarifikacios_valtozok.vizsga * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_vizsga_osszeg,

  (SELECT SUM(tarifikacios_valtozok.onallo_munka * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_onallo_munka_osszeg,

  (SELECT SUM(tarifikacios_valtozok.dolgozatjavitas_levelezo * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok,tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS levelezo_dolgozatjavitas_osszeg,

  (SELECT SUM(tantargy_tarifikaciok.kredit) FROM tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND (tantargy_tarifikaciok.kredit MOD 2 = 0) 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS paros_kredit_osszeg,

  (SELECT SUM(tantargy_tarifikaciok.kredit + 1) FROM tantargy_tarifikaciok LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező') 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND (tantargy_tarifikaciok.kredit MOD 2 = 1) 
  AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) ) 
  AS paratlan_kredit_osszeg,

  SUM(tantargy_tarifikaciok.eloadas) AS eloadas_osszeg,
  SUM(tantargy_tarifikaciok.hallgatok_szama * tarifikacios_valtozok.onallo_munka) AS eloadas_onallo_munka_osszeg,
  SUM(tantargy_tarifikaciok.hallgatok_szama * tarifikacios_valtozok.dolgozatjavitas_eloadas) AS eloadas_dolgozatjavitas_osszeg
  FROM tarifikacios_valtozok,  tantargy_tarifikaciok
  LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id
  WHERE (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali' 
  AND (tantargy_tarifikaciok.munkatarsakId IS null)
  AND tantargy_tarifikaciok.eloadas != 0 
  AND ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1})
  `, { type: QueryTypes.SELECT })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az összeg keresése közben."
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

  Munkatarsak.findAndCountAll({
    where: condition, limit, offset,
    include: [
      { model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] } },],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev', 'tanszekekId'],
      //(Select SUM(tantargy_tarifikaciok.hallgatok_szama * tarifikacios_valtozok.onallo_munka) FROM tantargy_tarifikaciok as tantargy_tarifikacio, tarifikacios_valtozok as tarifikacios_valtozok WHERE tantargy_tarifikaciok.tanarokId = munkatarsak.id )  AS `onallo_munka_osszeg`,
      include: [

        [sequelize.literal(`(SELECT SUM(tantargy_tarifikaciok.szeminarium) FROM tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.szeminarium_munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'szeminarium_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.beszamolo) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.szeminarium_munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.tipus LIKE 'beszámoló') 
        AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'szeminarium_beszamolo_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.onallo_munka * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.szeminarium_munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'szeminarium_onallo_munka_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.dolgozatjavitas_szeminarium * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.szeminarium_munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.szeminarium != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'szeminarium_dolgozatjavitas_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.vizsga_konzultacio) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.eloadas != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'eloadas_vizsga_konzultacio_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.vizsga * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.eloadas != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'eloadas_vizsga_osszeg'],

        [sequelize.literal(`(SELECT SUM(tantargy_tarifikaciok.eloadas) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.eloadas != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'eloadas_osszeg'],

        [sequelize.literal(`(SELECT SUM(tantargy_tarifikaciok.hallgatok_szama * tarifikacios_valtozok.onallo_munka) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.eloadas != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'eloadas_onallo_munka_osszeg'],

        [sequelize.literal(`(SELECT SUM(tantargy_tarifikaciok.hallgatok_szama * tarifikacios_valtozok.dolgozatjavitas_eloadas) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'nappali') 
        AND (tantargy_tarifikaciok.eloadas != 0) AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'eloadas_dolgozatjavitas_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.beszamolo) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.tipus LIKE 'beszámoló') 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező')  
        AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'levelezo_beszamolo_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.vizsga_konzultacio) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező')  
        AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'levelezo_vizsga_konzultacio_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.vizsga * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.tipus LIKE 'vizsga') 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező')  
        AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'levelezo_vizsga_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.onallo_munka * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező')  
        AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'levelezo_onallo_munka_osszeg'],

        [sequelize.literal(`(SELECT SUM(tarifikacios_valtozok.dolgozatjavitas_levelezo * tantargy_tarifikaciok.hallgatok_szama) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező')  
        AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'levelezo_dolgozatjavitas_osszeg'],

        [sequelize.literal(`(SELECT SUM(tantargy_tarifikaciok.kredit) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező')
        AND (tantargy_tarifikaciok.kredit MOD 2 = 0)   
        AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'paros_kredit_osszeg'],

        [sequelize.literal(`(SELECT SUM(tantargy_tarifikaciok.kredit + 1) FROM tarifikacios_valtozok, tantargy_tarifikaciok as tantargy_tarifikaciok
        LEFT OUTER JOIN tantargyak AS tantargyak ON tantargy_tarifikaciok.tantargyakId = tantargyak.id 
        WHERE tantargy_tarifikaciok.munkatarsakId = munkatarsak.id 
        AND (tantargy_tarifikaciok.kepzesi_forma LIKE 'levelező')
        AND (tantargy_tarifikaciok.kredit MOD 2 = 1)   
        AND ( ${tanszekekId ? `tantargyak.tanszekekId = ${tanszekekId}` : 1}) )`), 'paratlan_kredit_osszeg'],

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

//[sequelize.literal('(Select COUNT(*) FROM (Select tantargy_tarifikaciok.tantargyakId FROM tantargy_tarifikaciok as tantargy_tarifikaciok WHERE tantargy_tarifikaciok.tanarokId = tanarok.id) as tantargyak_szama)'), 'eloadas_tanar_tantargyak_szama'],

// Tanterv módosítása azonosítója alapján
exports.frissites = (req, res) => {
  // Kérés validálása
  if (!req.body.felev || !req.body.kredit || !req.body.tipus || !req.body.kepzesi_forma || !req.body.hallgatok_szama || !req.body.tantargyakId) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  if (req.body.hallgatok_szama < 0 || req.body.eloadas < 0 || req.body.szeminarium < 0 || req.body.laboratoriumi < 0 || req.body.kredit < 0) {
    res.status(400).send({
      message: "A mező értéke nem lehet negatív!"
    });
    return;
  }

  const id = req.params.id;

  Tantargy_tarifikaciok.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tantárgy tarifikáció sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet a tantárgy tarifikációt frissíteni, azonosító: ${id}. Lehetséges, hogy a tantárgy tarifikáció nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tantárgy tarifikáció frissítése közben, azonosító: " + id
      });
    });
};


// Tantárgy tarifikació keresése azonosítója alapján
exports.egyTantargyTarifikacioListazasa = (req, res) => {
  const id = req.params.id;

  Tantargy_tarifikaciok.findByPk(id, {
    include: [
      { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] } },
      { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
      { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },

    ],
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tanterv keresése közben, a Tanterv azonosítója: " + id
      });
    });
};

// Törlés azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;

  Tantargy_tarifikaciok.destroy({
    where: { id: id }

  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "A tantárgy tarifikáció sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült a tantárgy tarifikáció törlése, azonsító:${id}. Lehetséges, hogy az elem nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel a tantárgy tarifikáció törlése közben, azonosító: " + id
      });
    });
};

// Minden Tantárgy tarifikáció törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
  Tantargy_tarifikaciok.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Tantárgy tarifikációs adat sikeresen törölve!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a Tantárgy tarifikációs adatok törlése közben."
      });
    });
};
