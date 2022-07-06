const { sequelize, tantargyak, munkatarsak, tanszekek } = require("../models");
const db = require("../models");
const Tantargy_tarifikaciok = db.tantargy_tarifikaciok;
const Tanarok = db.munkatarsak;
const Op = db.Sequelize.Op;


// Minden tantárgy tarifikáció listázása az adatbázisból.
exports.tantargytarifikacioListazasa = (req, res) => {
  const { tanarokId } = req.body;
  var condition = {
    [Op.and]: [
      tanarokId ? {
        [Op.or]: [
          { munkatarsakId: { [Op.like]: `${tanarokId}` } },
          { szeminarium_munkatarsakId: { [Op.like]: `${tanarokId}` } },
        ]
      } : null,
    ]
  };

  Tantargy_tarifikaciok.findAll({
    where: condition,
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
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a tantárgy tarifikáció keresése közben."
      });
    });
};

//A tanárok terhelését keresi meg, amit táblázat formában lehet megjeleníteni
exports.findTanarTerheles = (req, res) => {
  const { tanarokId, tanszekekId } = req.body;
  var condition = {
    [Op.and]: [
      tanarokId ? { id: { [Op.like]: `${tanarokId}` } } : null,
      tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
    ]
  };

  Tanarok.findAll({
    where: condition, 
    include: [
      { model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] } },],
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'email', 'jelszo', 'kezdes_ev', 'tanszekekId'],
      //(Select SUM(tantargy_tarifikacio.hallgatok_szama * tarifikacios_valtozok.onallo_munka) FROM tantargy_tarifikacio as tantargy_tarifikacio, tarifikacios_valtozok as tarifikacios_valtozok WHERE tantargy_tarifikacio.tanarokId = munkatarsak.id )  AS `onallo_munka_osszeg`,
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
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az összeg keresése közben."
      });
    });
};





