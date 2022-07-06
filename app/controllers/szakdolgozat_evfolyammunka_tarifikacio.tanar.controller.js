const { sequelize, tanszekek} = require("../models");
const db = require("../models");
const Tanarok = db.munkatarsak;
const Op = db.Sequelize.Op;

//A tanárok terhelését keresi meg, amit táblázat formában lehet megjeleníteni
exports.tanarTerhelesListazasa = (req, res) => {
    const { id, tanszekekId } = req.body;
    var condition = {
      [Op.and]: [
        id ? { id: { [Op.like]: `${id}` } } : null,
        tanszekekId ? { tanszekekId: { [Op.like]: `${tanszekekId}` } } : null,
      ]
    };
  
    Tanarok.findAll({
      where: condition,
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
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel az összeg keresése közben."
        });
      });
  };