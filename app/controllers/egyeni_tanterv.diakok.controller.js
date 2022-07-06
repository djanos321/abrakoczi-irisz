const { sequelize, szak, tantargy, munkatarsak, diakok } = require("../models");
const db = require("../models");
const Eredmeny = db.eredmeny;
const Op = db.Sequelize.Op;

// az oldalak számolásához, valószínűleg nem lesz felhasználva
const getPagination = (page, size) => {
    const limit = size ? +size : 3;
    const offset = page ? page * limit : 0;

    return { limit, offset };
};

const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: eredmeny } = data;

    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return { totalItems, eredmeny, totalPages, currentPage };
};

// A megfelelő féléveket listázza ki
exports.findFelev = (req, res) => {
    const { diakokId } = req.body;
    var condition = {
        [Op.and]: [
            diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
        ]
    };

    Eredmeny.findAll({
        where: condition,
        attributes: { exclude: ['createdAt', 'updatedAt', 'kredit', 'tipus', 'eredmeny', 'potok_szama', 'datum', 'id'] },
        include: [{
            model: diakok, as: "diakok", attributes: { exclude: ['email', 'jelszo', 'createdAt', 'updatedAt', 'diak_nev', 'kezdes_ev', 'id'] },
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

// Egyéni tanterv diáknak
exports.findEgyeniTantervDiak = (req, res) => {
    const { diakokId, felev, pontszam, tanszekId, page, size } = req.body;

    var condition = {
        [Op.and]: [
            diakokId ? { diakokId: { [Op.like]: `${diakokId}` } } : null,
            tanszekId ? { "$diakok.szak.tanszekId$": { [Op.like]: `${tanszekId}` } } : null,
            felev ? { felev: { [Op.like]: `${felev}` } } : null,
            pontszam == 60 ? { pontszam: { [Op.gte]: 60 } } : null,
            pontszam == 'null' ? { pontszam: { [Op.is]: null } } : null,
            
            {
                [Op.or]: [
                    { pontszam: { [Op.gte]: 60 } },
                    {[Op.and]:[
                        { pontszam: { [Op.lte]: 34 } },
                        { pontszam: { [Op.ne]: -1 } },
                    ]},
                    { pontszam: { [Op.is]: null } },
                ]
            },

        ]
    };

    if (!req.body.diakokId) {
        res.status(400).send({
            message: "A diák megadása kötelező!"
        });
        return;
    }

    const { limit, offset } = getPagination(page, size);

    Eredmeny.findAndCountAll({
        where: condition, limit, offset,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [{
            model: diakok, as: "diakok", attributes: {
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
        { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
        ],
        order: [
            [{ model: diakok.szak, as: "szak" }, 'diakok.szak.szak_nev'],
            [{ model: diakok.szak, as: "szak" }, 'diakok.szak.kepzesi_szint'],
            [{ model: diakok, as: "diakok" }, 'diak_nev'],
            'felev',
            [{ model: tantargy, as: "tantargy" }, 'tantargy_nev'],
            'tipus'
        ],
    })
        .then(data => {
            const response = getPagingData(data, page, limit);
            res.send(response);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel az eredmény keresése közben."
            });
        });
};