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

//szakok
exports.szakListazasa = (req, res) => {
    const { tanszekekId } = req.query;
    var condition = {
        [Op.and]: [
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

    Mintatantervek.findAll({
        where: condition,
        distinct: true,

        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        }
        ],
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'felev', 'eloadas', 'laboratoriumi', 'gyakorlati', 'onallo_munka', 'tipus', 'kredit', 'tantargyakId'],
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
            ],
        },

        order: [[{ model: szakok, as: "szakok" }, 'szak_nev'],[{ model: szakok, as: "szakok" }, 'kepzesi_szint'], ],
        group: ['szakokId'],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a keresés közben."
            });
        });
};

//Kezdési év
exports.kezdesiEvListazasa = (req, res) => {
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

    Mintatantervek.findAll({
        where: condition,
        distinct: true,

        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev', 'kepzesi_szint'] },
        }
        ],
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'felev', 'eloadas', 'laboratoriumi', 'gyakorlati', 'onallo_munka', 'tipus', 'kredit', 'tantargyakId'],
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
                    err.message || "Hiba lépett fel a keresés közben."
            });
        });
};

//Félév
exports.felevekListazasa = (req, res) => {
    const { szakokId, tanszekekId, kezdes_ev } = req.query;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
            kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
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

    Mintatantervek.findAll({
        where: condition,
        distinct: true,

        include: [{
            model: szakok, as: "szakok",
            attributes: { exclude: ['createdAt', 'updatedAt', 'szak_nev', 'kepzesi_szint'] },
        }
        ],
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'eloadas', 'laboratoriumi', 'gyakorlati', 'onallo_munka', 'tipus', 'kredit', 'tantargyakId'],
            include: [
                [sequelize.fn("YEAR", sequelize.col("kezdes_ev")), "kezdes_ev"],
                [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('kezdes_ev'), sequelize.fn("NOW")), 'evfolyam'],
            ],
        },

        order: ['felev'],
        group: ['felev'],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a keresés közben."
            });
        });
};

// Új tanterv létrehozása és mentése
exports.letrehozas = (req, res) => {
    // Kérés validálása
    if (!req.body.felev || !req.body.tipus || !req.body.szakokId || !req.body.tantargyakId || !req.body.kezdes_ev) {
        res.status(400).send({
            message: "A mező tartalma nem lehet üres!"
        });
        return;
    }
    if (req.body.eloadas < 0 || req.body.kredit < 0 || req.body.laboratoriumi < 0
        || req.body.onallo_munka < 0 || req.body.gyakorlati < 0) {
        res.status(400).send({
            message: "A mező tartalma nem lehet negatív szám!"
        });
        return;
    }

    if (!req.body.laboratoriumi) {
        req.body.laboratoriumi = 0;
    }

    if (!req.body.gyakorlati) {
        req.body.gyakorlati = 0;
    }

    if (!req.body.eloadas) {
        req.body.eloadas = 0;
    }
    if (!req.body.onallo_munka) {
        req.body.onallo_munka = 0;
    }

    req.body.kezdes_ev = (req.body.kezdes_ev + '-09-01');

    // Mintatanterv létrehozása
    const mintatantervek = {
        felev: req.body.felev,
        kredit: req.body.kredit,
        eloadas: req.body.eloadas,
        laboratoriumi: req.body.laboratoriumi,
        gyakorlati: req.body.gyakorlati,
        onallo_munka: req.body.onallo_munka,
        tipus: req.body.tipus,
        szakokId: req.body.szakokId,
        tantargyakId: req.body.tantargyakId,
        kezdes_ev: req.body.kezdes_ev,
    };

    // Tanterv mentése az adatbázisba
    Mintatantervek.create(mintatantervek)
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a mintatanterv létrehozása közben."
            });
        });
};

//Mintatanterv listázása kezdési év alapján (évfolyam)
exports.mintatantervListazasa = (req, res) => {
    const { szakokId, kezdes_ev, felev, oldal, meret } = req.query;
    var condition = {
        [Op.and]: [
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
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

    if (!req.query.szakokId && !req.query.kezdes_ev) {
        res.status(400).send({
            message: "A szak és az évfolyam (kezdési év) megadása kötelező!"
        });
        return;
    }

    if (!req.query.szakokId && req.query.kezdes_ev) {
        res.status(400).send({
            message: "A szak megadása kötelező!"
        });
        return;
    }

    if (!req.query.kezdes_ev && req.query.szakokId) {
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
        },
        ],
        order: [
            'felev',
            'tipus',
            [{ model: tantargyak, as: "tantargyak" }, 'tantargy_nev'],
        ],
    })
        .then(data => {
            const response = oldalszamozasiAdatok(data, oldal, limit);
            res.send(response);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a mintatanterv keresése közben."
            });
        });
};


// Tantárgy keresése a tantervben
exports.tantargyListazaMintatantervbol = (req, res) => {
    const { oldal, meret, tantargyakId, szakokId, felev, kezdes_ev } = req.query;
    var condition = {
        [Op.and]: [
            tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
            szakokId ? { szakokId: { [Op.like]: `${szakokId}` } } : null,
            kezdes_ev ? { kezdes_ev: { [Op.like]: `${kezdes_ev + '-09-01'}` } } : null,
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
    if (!req.query.tantargyakId) {
        res.status(400).send({
            message: "A tantárgy megadása kötelező!"
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
        include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] } },
        { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] } },
        ],
        order: [
            [{ model: szakok, as: "szakok" }, 'szak_nev'],
            [{ model: szakok, as: "szakok" }, 'kepzesi_szint'],
            ['kezdes_ev', 'DESC'],
            'felev',
            'tipus',
            [{ model: tantargyak, as: "tantargyak" }, 'tantargy_nev'],
        ],
    })
        .then(data => {
            const response = oldalszamozasiAdatok(data, oldal, limit);
            res.send(response);
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a tantárgy keresése közben."
            });
        });
};

// Tanterv keresése azonosítója alapján
exports.egyMintatantervListazasa = (req, res) => {
    const id = req.params.id;

    Mintatantervek.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt'],
            include: [
                [sequelize.fn("YEAR", sequelize.col("`mintatantervek`.`kezdes_ev`")), "kezdes_ev"],
            ]
        },
        include: [
            { model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] } },
            { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] } },

        ],
    })
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: "Hiba lépett fel a mintatanterv keresése közben, a mintatanterv elem azonosítója: " + id
            });
        });
};

// Tanterv módosítása azonosítója alapján
exports.frissites = (req, res) => {
    // Kérés validálása
    if (!req.body.felev || !req.body.tipus || !req.body.szakokId || !req.body.tantargyakId || !req.body.kezdes_ev) {
        res.status(400).send({
            message: "A mező tartalma nem lehet üres!"
        });
        return;
    }
    if (req.body.eloadas < 0 || req.body.kredit < 0 || req.body.laboratoriumi < 0
        || req.body.onallo_munka < 0 || req.body.gyakorlati < 0) {
        res.status(400).send({
            message: "A mező tartalma nem lehet negatív szám!"
        });
        return;
    }

    if (!req.body.laboratoriumi) {
        req.body.laboratoriumi = 0;
    }

    if (!req.body.gyakorlati) {
        req.body.gyakorlati = 0;
    }

    if (!req.body.eloadas) {
        req.body.eloadas = 0;
    }
    if (!req.body.onallo_munka) {
        req.body.onallo_munka = 0;
    }

    req.body.kezdes_ev = (req.body.kezdes_ev + '-09-01');
    const id = req.params.id;

    Mintatantervek.update(req.body, {
        where: { id: id }
    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "A mintatanterv sikeresen frissítve lett."
                });
            } else {
                res.send({
                    message: `Nem lehet a mintatantervet frissíteni, azonosító: ${id}. Lehetséges, hogy a mintatanterv elem nem található vagy üres a lekérdezés mező!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Hiba lépett fel a mintatanterv frissítése közben, azonosító: " + id
            });
        });
};

// Tanterv törlése azonosítója alapján
exports.torles = (req, res) => {
    const id = req.params.id;

    Mintatantervek.destroy({
        where: { id: id }

    })
        .then(num => {
            if (num == 1) {
                res.send({
                    message: "A mintatanterv sikeresen törölve lett!"
                });
            } else {
                res.send({
                    message: `Nem sikerült a mintatanterv elem törlése, azonsító:${id}. Lehetséges, hogy a mintatanterv elem nem található!`
                });
            }
        })
        .catch(err => {
            res.status(500).send({
                message: "Hiba lépett fel a mintatanterv törlése közben, azonosító: " + id
            });
        });
};

// Minden mintatanterv törlése az adatbázisból.
exports.mindenTorlese = (req, res) => {
    Mintatantervek.destroy({
        where: {},
        truncate: false
    })
        .then(nums => {
            res.send({ message: `${nums} darab mintatanterv egység sikeresen törölve!` });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a mintatanterv egységek törlése közben."
            });
        });
};
