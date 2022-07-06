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

// Új diákok száma sor létrehozása és mentése
exports.letrehozas = (req, res) => {
    // Kérés validálása
    if (!req.body.szakokId || !req.body.kezdes_ev) {
        res.status(400).send({
            message: "A mező tartalma nem lehet üres!"
        });
        return;
    }

    if (!req.body.db_nappali) {
        req.body.db_nappali = 0;
    }

    if (!req.body.db_levelezo) {
        req.body.db_levelezo = 0;
    }

    if (req.body.db_nappali < 0 || req.body.db_levelezo < 0) {
        res.status(400).send({
            message: "A mező tartalma nem lehet negatív szám!"
        });
        return;
    }

    req.body.kezdes_ev = (req.body.kezdes_ev + '-09-01');

    // Diákok száma sor létrehozása
    const diakok_szama = {
        szakokId: req.body.szakokId,
        db_nappali: req.body.db_nappali,
        db_levelezo: req.body.db_levelezo,
        kezdes_ev: req.body.kezdes_ev,
    };

    // Diákok számának mentése az adatbázisba
    Diakok_szama.create(diakok_szama)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a diákok számának a felvétele közben."
            });
        });
};

//Minden adat listázása
exports.diakokSzamaListazasa = (req, res) => {
    const { oldal, meret, szakokId, kezdes_ev, tanszekekId } = req.query;
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
        order: [[{ model: szakok, as: "szakok" }, 'szak_nev'], [{ model: szakok, as: "szakok" }, 'kepzesi_szint'], ['kezdes_ev', 'DESC'],]
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

//BSC 2, 3, 4 évfolyammunka és szakdolgozat
exports.diakokSzamaOsszegBscListazasa = (req, res) => {
    const { szakokId, tanszekekId } = req.query;
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

//MSc 1, 2 diplomamunkához
exports.diakokSzamaOsszegMscListazasa = (req, res) => {
    const { szakokId, tanszekekId } = req.query;
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

//Minden adat listázása
exports.diakokSzamaOsszegBscEgybenListazasa = (req, res) => {
    const { szakokId, tanszekekId, kezdes_ev } = req.query;
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
    const { szakokId, tanszekekId, kezdes_ev } = req.query;
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

exports.diakKezdesiEvListazasa = (req, res) => {
    const { szakokId, tanszekekId } = req.query;
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
            attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev', 'kepzesi_szint'] },
        }
        ],

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

// Diák keresése azonosítója alapján
exports.egyDiakokSzamaListazasa = (req, res) => {
    const id = req.params.id;
    Diakok_szama.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt'],
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
            ]
        },
        include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: "Hiba lépett fel a diákok száma keresése közben, a bejegyzés azonosítója: " + id
            });
        });
};

// Diák számának módosítása azonosítója alapján
exports.frissites = (req, res) => {
    // Kérés validálása
    if (!req.body.szakokId || !req.body.kezdes_ev) {
        res.status(400).send({
            message: "A mező tartalma nem lehet üres!"
        });
        return;
    }

    if (!req.body.db_nappali) {
        req.body.db_nappali = 0;
    }

    if (!req.body.db_levelezo) {
        req.body.db_levelezo = 0;
    }

    if (req.body.db_nappali < 0 || req.body.db_levelezo < 0) {
        res.status(400).send({
            message: "A mező tartalma nem lehet negatív szám!"
        });
        return;
    }
    req.body.kezdes_ev = (req.body.kezdes_ev + '-09-01');
    const id = req.params.id;

    Diakok_szama.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "A diákok száma sor sikeresen frissítve lett."
                });
            } else {
                res.send({
                    message: `Nem lehet a diákok száma sort frissíteni, azonosító: ${id}. Lehetséges, hogy a sor nem található vagy üres a lekérdezés mező!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Hiba lépett fel a diákok számának a frissítése közben, azonosító: " + id
            });
        });
};

// Diákok száma sor törlése azonosítója alapján
exports.torles = (req, res) => {
    const id = req.params.id;

    Diakok_szama.destroy({
        where: { id: id }

    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "A diákok száma sor sikeresen törölve lett!"
                });
            } else {
                res.send({
                    message: `Nem sikerült a diákok számának a törlése, azonsító:${id}. Lehetséges, hogy a diákok száma sor nem található!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Hiba lépett fel a diákok számának a törlése közben, azonosító: " + id
            });
        });
};

// Minden diákok száma adat törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
    Diakok_szama.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} diákok száma adat sikeresen törölve!` });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a diákok számának a törlése közben."
            });
        });
};