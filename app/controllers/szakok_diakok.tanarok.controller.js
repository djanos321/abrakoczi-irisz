const { sequelize, szak, tantargy, munkatarsak, diakok } = require("../models");
const db = require("../models");
const Eredmeny = db.eredmeny;
const Tantargy = db.tantargy;
const Op = db.Sequelize.Op;

// A paraméterben megadott félév eredményeinek a listázása a bejelntkezett diáknak (id szerint van azonosítva)
exports.findOsszesBejegyzes = (req, res) => {
    const { munkatarsakId, tantargyId, szakId, kepzesi_forma, felev,} = req.body;

    var condition = {
        [Op.or]: [
            {
                [Op.and]: [
                    tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
                    szakId ? { '$diakok.szakId$': { [Op.like]: `${szakId}` } } : null,
                    kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
                    felev ? { felev: { [Op.like]: `${felev}` } } : null,
                    felev ? sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: `${Math.round(felev / 2) - 1}` }) : null,
                    //felev ? { '$diakok.evfolyam$': { [Op.like]: `${Math.round(felev/2)-1}` } } : null,
                    munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
                    sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
                ],
            },
            {
                [Op.and]: [
                    tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
                    szakId ? { '$diakok.szakId$': { [Op.like]: `${szakId}` } } : null,
                    kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
                    felev ? { felev: { [Op.like]: `${felev}` } } : null,
                    felev ? sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: `${Math.round(felev / 2) - 1}` }) : null,
                    munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
                    sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
                ],
            },
        ]
    };

    Eredmeny.findAll({
        where: condition,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{
            model: diakok, as: "diakok", attributes:
            {
                exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'],
                include: [
                    [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
                    [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
                ],
            },
            include: [{ model: szak, as: "szak", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
        },
        { model: tantargy, as: "tantargy", attributes: { exclude: ['createdAt', 'updatedAt'] }, },
        { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
        { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },],
        order: [
            [{ model: diakok, as: "diakok" }, 'diak_nev'],
            'datum',
        ],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel az eredmény keresése közben!"
            });
        });
};

// Azoknak a tantárgyaknak a megkeresése amiket az adott tanár oktat
exports.findTanarTantargyai = (req, res) => {
    const { munkatarsakId, felev } = req.body;
    var condition = {
        [Op.or]: [
            {
                [Op.and]: [
                    munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
                    sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
                ]
            },
            {
                [Op.and]: [
                    munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
                    sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
                ]
            }

        ]
    };

    Eredmeny.findAll({
        where: condition,
        attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'felev', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
        include: [
            {
                model: diakok, as: "diakok", attributes:
                {
                    exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kepzesi_forma'],
                    include: [
                        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
                        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
                    ],
                },
                include: [{ model: szak, as: "szak", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
            },
            { model: tantargy, as: "tantargy", attributes: { exclude: ['createdAt', 'updatedAt', 'kepzesi_szint', 'tipus', 'tanszekId'] }, },
        ],
        group: ['tantargyId'],
        order: [
            [{ model: tantargy, as: "tantargy" }, 'tantargy_nev'],
        ],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a tantárgy keresése közben!"
            });
        });
};

// Azoknak a tantárgyaknak a megkeresése amiket az adott tanár oktat
exports.findSzakokEsTantargyak = (req, res) => {
    const { munkatarsakId, felev } = req.body;
    var condition = {
        [Op.or]: [
            {
                [Op.and]: [
                    munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
                    sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
                ]
            },
            {
                [Op.and]: [
                    munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
                    sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
                ]
            }

        ]
    };

    Eredmeny.findAll({
        where: condition,
        attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'felev', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
        include: [
            {
                model: diakok, as: "diakok", attributes:
                {
                    exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kepzesi_forma'],
                    include: [
                        [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
                        [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
                    ],
                },
                include: [{ model: szak, as: "szak", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
            },
            { model: tantargy, as: "tantargy", attributes: { exclude: ['createdAt', 'updatedAt', 'kepzesi_szint', 'tanszekId'] }, },
        ],
        group: ['tantargyId', 'szakId'],
        order: [
            [{ model: tantargy, as: "tantargy" }, 'tantargy_nev'],
        ],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a tantárgy keresése közben!"
            });
        });
};

// Az adott tanár és a kiválasztott tantárgy alapján megjelenített szakok listáját adja vissza
exports.findSzakok = (req, res) => {
    const { munkatarsakId, tantargyId } = req.body;
    var condition =
    {
      [Op.or]: [
        {
          [Op.and]: [
            munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
            sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
            tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
          ]
        },
        {
          [Op.and]: [
            munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
            sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
            tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
          ]
        }
  
      ]
    };
  
    Eredmeny.findAll({
      where: condition,
      attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'felev', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
      include: [{
        model: diakok, as: "diakok", attributes:
        {
          exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kepzesi_forma', 'kezdes_ev', 'id'],
          include: [
            [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
            [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
          ],
        },
        include: [{ model: szak, as: "szak", attributes: { exclude: ['createdAt', 'updatedAt', 'tanszekId'] }, }]
      },],
  
      group: [
        'szakId'
      ],
      order: [
        [{ model: diakok, as: "diakok" }, { model: szak, as: "szak" }, 'szak_nev'],
      ],
  
    })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel a szak keresése közben!"
        });
      });
  };
  
  // A képzési formákat listázza ki
  exports.findKepzesiForma = (req, res) => {
    const { munkatarsakId, tantargyId, szakId } = req.body;
    var condition =
  
    {
      [Op.or]: [
        {
          [Op.and]: [
            munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
            sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
            tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
            szakId ? { '$diakok.szakId$': { [Op.like]: `${szakId}` } } : null,
          ]
        },
        {
          [Op.and]: [
            munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
            sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
            tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
            szakId ? { '$diakok.szakId$': { [Op.like]: `${szakId}` } } : null,
          ]
        }
  
      ]
    };
  
    Eredmeny.findAll({
      where: condition,
      attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'felev', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
      include: [{
        model: diakok, as: "diakok", attributes:
        {
          exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kezdes_ev', 'id'],
          include: [
            [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
            [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
          ],
        },
      },],
  
      group: [
        'kepzesi_forma',
      ],
      order: [
        [{ model: diakok, as: "diakok" }, 'kepzesi_forma'],
      ],
  
    })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel az képzési forma keresése közben!"
        });
      });
  };
  
  // A megfelelő féléveket listázza ki
  exports.findFelev = (req, res) => {
    const { munkatarsakId, tantargyId, szakId, kepzesi_forma } = req.body;
  
    var condition =
    {
      [Op.or]: [
        {
          [Op.and]: [
            munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
            sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
            tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
            szakId ? { '$diakok.szakId$': { [Op.like]: `${szakId}` } } : null,
            kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
  
          ]
        },
        {
          [Op.and]: [
            munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
            sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
            tantargyId ? { tantargyId: { [Op.like]: `${tantargyId}` } } : null,
            szakId ? { '$diakok.szakId$': { [Op.like]: `${szakId}` } } : null,
            kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
          ]
        }
  
      ]
    };
  
    Eredmeny.findAll({
      where: condition,
      attributes: { exclude: ['createdAt', 'updatedAt', 'vizsgahoz_engedve', 'kredit', 'tipus', 'pontszam', 'datum', 'diakokId', 'id'] },
      include: [{
        model: diakok, as: "diakok", attributes:
        {
          exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kezdes_ev', 'id'],
          include: [
            [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
            [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
          ],
        },
      },],
  
      group: [
        'felev',
      ],
      order: [
        'felev',
      ],
  
    })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel az képzési forma keresése közben!"
        });
      });
  };
