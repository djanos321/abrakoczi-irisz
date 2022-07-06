const { sequelize, tanszekek, szakok } = require("../models");
const db = require("../models");
const Diakok_szama = db.diakok_szama;
const Op = db.Sequelize.Op;


// az oldalak számolásához
const oldalszamozas = (oldal, meret) => {
    const limit = meret ? +meret : 3;
    const offset = oldal ? oldal * limit : 0;

    return { limit, offset };
};

const oldalszamozasiAdatok = (data, oldal, limit) => {
    const { count: osszesElem, rows: diakok_szama } = data;
    const jelenlegiOldal = oldal ? +oldal : 0;
    const osszesOldal = Math.ceil(osszesElem / limit);

    return { osszesElem, diakok_szama, osszesOldal, jelenlegiOldal };
};

//Minden adat listázása
exports.diakokSzamaListazasa = (req, res) => {
    const { oldal, meret, szakokId, kezdes_ev, tanszekekId } = req.body;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            {
                [Op.or]: [
                    {
                        [Op.and]:
                            [
                                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                                sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `MSc` }),
                            ]
                    },

                    {
                        [Op.and]:
                            [
                                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                                sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `BSc` }),
                            ],
                    }],
            },
        ]
    };
    const { limit, offset } = oldalszamozas(oldal, meret);
    Diakok_szama.findAndCountAll({
        where: condition, limit, offset,
        attributes: {
            exclude: ['createdAt', 'updatedAt'],
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
            ],
        },
        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [{ attributes: { exclude: ['createdAt', 'updatedAt'] }, model: tanszekek, as: "tanszekek" }]
        }],
        order: [[{ model: szakok, as: "szakok" }, 'szak_nev'], [{ model: szakok, as: "szakok" }, 'kepzesi_szint'], ['kezdes_ev', 'DESC']]
    })
        .then(data => {
            const response = oldalszamozasiAdatok(data, oldal, limit);
            res.send(response);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a diákok számának a keresése közben."
            });
        });
};


//Minden adat listázása
exports.diakokSzamaOsszegBscEgybenListazasa = (req, res) => {
    const { szakokId, tanszekekId, kezdes_ev } = req.body;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
            {
                [Op.and]:
                    [
                        sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                        sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `BSc` }),
                    ],
            },
        ],
    };
    Diakok_szama.findAll({
        where: condition,
        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev'] },
        }],
        attributes: {
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
                [sequelize.fn("SUM", sequelize.col("db_nappali")), "nappalis_diakok_szama_osszeg_bsc"],
                [sequelize.fn("SUM", sequelize.col("db_levelezo")), "levelezos_diakok_szama_osszeg_bsc"],
            ],
            exclude: ['createdAt', 'updatedAt', 'db_nappali', 'db_levelezo'],
        },
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a diákok számának a keresése közben."
            });
        });
};

//Minden adat listázása
exports.diakokSzamaOsszegMscEgybenListazasa = (req, res) => {
    const { szakokId, tanszekekId, kezdes_ev } = req.body;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
            {
                [Op.and]:
                    [
                        sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                        sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `MSc` }),
                    ],
            },
        ],
    };
    Diakok_szama.findAll({
        where: condition,
        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev'] },
        }],
        attributes: {
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
                [sequelize.fn("SUM", sequelize.col("db_nappali")), "nappalis_diakok_szama_osszeg_msc"],
                [sequelize.fn("SUM", sequelize.col("db_levelezo")), "levelezos_diakok_szama_osszeg_msc"],
            ],
            exclude: ['createdAt', 'updatedAt', 'db_nappali', 'db_levelezo'],
        },
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a diákok számának a keresése közben."
            });
        });
};

//Minden adat listázása
exports.diakokSzamaOsszegBscListazasa = (req, res) => {
    const { szakokId, tanszekekId } = req.body;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            {
                [Op.and]:
                    [
                        sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.between]: [1, 4], }),
                        sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `BSc` }),
                    ],

            },
        ],
    };
    Diakok_szama.findAll({
        where: condition,
        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev'] },
        }],
        attributes: {
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
                [sequelize.fn("SUM", sequelize.col("db_nappali")), "nappalis_diakok_szama_osszeg_bsc"],
                [sequelize.fn("SUM", sequelize.col("db_levelezo")), "levelezos_diakok_szama_osszeg_bsc"],
            ],
            exclude: ['createdAt', 'updatedAt', 'db_nappali', 'db_levelezo'],
        },
        group: ['kezdes_ev'],
        order: [['kezdes_ev', 'DESC']],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a diákok számának a keresése közben."
            });
        });
};

//Minden adat listázása
exports.diakokSzamaOsszegMscListazasa = (req, res) => {
    const { szakokId, tanszekekId } = req.body;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            {
                [Op.and]:
                    [
                        sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                        sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `MSc` }),
                    ],
            },
        ],
    };
    Diakok_szama.findAll({
        where: condition,
        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev'] },
        }],
        attributes: {
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
                [sequelize.fn("SUM", sequelize.col("db_nappali")), "nappalis_diakok_szama_osszeg_msc"],
                [sequelize.fn("SUM", sequelize.col("db_levelezo")), "levelezos_diakok_szama_osszeg_msc"],
            ],
            exclude: ['createdAt', 'updatedAt', 'db_nappali', 'db_levelezo'],
        },
        group: ['kezdes_ev'],
        order: [['kezdes_ev', 'DESC']],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a diákok számának a keresése közben."
            });
        });
};

exports.diakKezdesiEvListazasa = (req, res) => {
    const { szakokId, tanszekekId } = req.body;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            {
                [Op.or]: [
                    {
                        [Op.and]:
                            [
                                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 2 }),
                                sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `MSc` }),
                            ]
                    },

                    {
                        [Op.and]:
                            [
                                sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), { [Op.lt]: 4 }),
                                sequelize.where(sequelize.literal('szakok.kepzesi_szint'), { [Op.like]: `BSc` }),
                            ],
                    }],
            },
        ],
    };
    Diakok_szama.findAll({
        where: condition,
        distinct: true,
        include: [{
            model: szakok, as: "szakok",
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'szak_nev', 'kepzesi_szint'],
            },
        }],
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'db_levelezo', 'db_nappali'],
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
            ],
        },
        order: [['kezdes_ev', 'DESC']],
        group: ['kezdes_ev'],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a kezdési év keresése közben."
            });
        });
};


