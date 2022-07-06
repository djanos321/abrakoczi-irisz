const { szakok, tantargyak, tanszekek, sequelize } = require("../models");
const db = require("../models");
const Mintatantervek = db.mintatantervek;
const Op = db.Sequelize.Op;

// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
    const limit = meret ? +meret : 3;
    const offset = oldal ? oldal * limit : 0;

    return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
    const { count: osszesElem, rows: mintatantervek } = data;
    const jelenlegiOldal = oldal ? +oldal : 0;
    const osszesOldal = Math.ceil(osszesElem / limit);

    return { osszesElem, mintatantervek, osszesOldal, jelenlegiOldal };
};

//Mintatanterv listázása kezdési év alapján (évfolyam)
exports.mintatantervListazasa = (req, res) => {
    const { tanszekekId, szakokId, kezdes_ev, felev, oldal, meret } = req.body;
    var condition = {
        [Op.and]: [
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev}` } } : null,
            felev ? { felev: { [Op.like]: `${felev}` } } : null,
            {
                [Op.or]: [
                    {
                        [Op.and]:
                            [
                                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`mintatantervek`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                                sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `MSc` }),
                            ]
                    },

                    {
                        [Op.and]:
                            [
                                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`mintatantervek`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                                sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `BSc` }),
                            ],
                    }],
            },
        ]
    };

    if (!req.body.szakokId && !req.body.kezdes_ev) {
        res.status(400).send({
            message: "A szak és az évfolyam (kezdési év) megadása kötelező!"
        });
        return;
    }

    if (!req.body.szakokId && req.body.kezdes_ev) {
        res.status(400).send({
            message: "A szak megadása kötelező!"
        });
        return;
    }

    if (!req.body.kezdes_ev && req.body.szakokId) {
        res.status(400).send({
            message: "Az évfolyam (kezdési év) megadása kötelező!"
        });
        return;
    }

    const { limit, offset } = oldalszamozas(oldal, meret);
    Mintatantervek.findAndCountAll({
        where: condition, limit, offset,
        attributes: {
            exclude: ['createdAt', 'updatedAt'],
            include: [
                [sequelize.fn("YEAR", sequelize.col("`mintatantervek`.`kezdes_ev`")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`mintatantervek`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
            ],
        },
        include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, },
        {
            model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [{ model: tanszekek, as: "tanszekek", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
        }],
        order: [
            'felev',
            'tipus',
            [{ model: tantargyak, as: "tantargyak" }, 'tantargy_nev'],

        ],
    })
        .then(data => {
            const response = oldalszamozasiAdatok(data,  oldal, limit);
            res.send(response);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a mintatanterv keresése közben."
            });
        });
};
