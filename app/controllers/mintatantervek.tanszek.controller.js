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
    const { tanszekekId } = req.body;
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

        order: [[{ model: szakok, as: "szakok" }, 'szak_nev'], [{ model: szakok, as: "szakok" }, 'kepzesi_szint'],],
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
                    err.message || "Hiba lépett fel a szakok keresése közben."
            });
        });
};

//Félév
exports.felevekListazasa = (req, res) => {
    const { szakokId, tanszekekId, kezdes_ev } = req.body;
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
    const { tanszekekId, szakokId, kezdes_ev, felev, oldal, meret } = req.body;
    var condition = {
        [Op.and]: [
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
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
        },],
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
    const { oldal, meret, tantargyakId, szakokId, felev, kezdes_ev, tanszekekId } = req.body;
    var condition = {
        [Op.and]: [
            tantargyakId ? { '$tantargyak.id$': { [Op.like]: `${tantargyakId}` } } : null,
            tanszekekId ? { '$szakok.tanszekekId$': { [Op.like]: `${tanszekekId}` } } : null,
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
    if (!req.body.tantargyakId) {
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
                    message: `Nem lehet a mintatantervat frissíteni, azonosító: ${id}. Lehetséges, hogy a mintatanterv elem nem található vagy üres a lekérdezés mező!`
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

exports.gyorsitas = (req, res) => {
    sequelize.query(`
    TRUNCATE TABLE mintatantervek;`)        

    sequelize.query(`INSERT INTO mintatantervek (id, felev, eloadas, laboratoriumi, gyakorlati, onallo_munka, kredit, tipus, kezdes_ev, createdAt, updatedAt, szakokId, tantargyakId) VALUES
(1, '1', 0, 0, 0, 0, 5, 'vizsga', '2020-09-01', '2022-05-15 12:46:24', '2022-05-15 20:01:15', 5, 16),
(3, '2', 30, 0, 30, 90, 5, 'vizsga', '2020-09-01', '2022-05-15 12:47:28', '2022-05-15 12:47:28', 5, 16),
(4, '2', 20, 0, 10, 60, 3, 'beszámoló', '2020-09-01', '2022-05-15 12:48:51', '2022-05-15 12:49:13', 5, 20),
(5, '1', 20, 0, 10, 60, 3, 'beszámoló', '2020-09-01', '2022-05-15 12:51:25', '2022-05-15 12:51:25', 5, 21),
(6, '1', 0, 0, 46, 74, 5, 'beszámoló', '2020-09-01', '2022-05-15 12:53:00', '2022-05-18 07:10:03', 5, 22),
(7, '1', 14, 0, 16, 60, 3, 'beszámoló', '2021-09-01', '2022-05-15 13:11:30', '2022-05-15 13:11:30', 5, 21),
(8, '2', 30, 0, 30, 90, 5, 'vizsga', '2021-09-01', '2022-05-15 15:47:24', '2022-05-15 15:47:24', 9, 23),
(10, '2', 14, 0, 16, 60, 3, 'beszámoló', '2021-09-01', '2022-05-15 20:32:21', '2022-06-14 18:49:56', 5, 24),
(12, '1', 10, 0, 30, 50, 4, 'beszámoló', '2020-09-01', '2022-05-17 07:55:55', '2022-05-17 07:55:55', 5, 10),
(13, '1', 16, 0, 14, 60, 3, 'beszámoló', '2020-09-01', '2022-05-17 08:12:06', '2022-05-17 08:12:06', 5, 20),
(14, '1', 0, 0, 0, 0, 6, 'beszámoló', '2020-09-01', '2022-05-17 08:13:22', '2022-05-17 08:13:22', 5, 26),
(15, '1', 15, 0, 25, 80, 4, 'beszámoló', '2021-09-01', '2022-05-17 10:17:04', '2022-06-14 18:47:18', 5, 27),
(17, '1', 20, 0, 10, 60, 3, 'vizsga', '2021-09-01', '2022-05-17 13:34:41', '2022-05-17 13:34:41', 5, 31),
(18, '1', 13, 0, 25, 112, 5, 'vizsga', '2021-09-01', '2022-05-17 13:36:02', '2022-05-17 13:36:02', 5, 16),
(19, '1', 30, 0, 16, 74, 4, 'vizsga', '2021-09-01', '2022-05-17 13:36:47', '2022-06-14 18:30:33', 5, 28),
(20, '1', 15, 0, 20, 85, 4, 'vizsga', '2021-09-01', '2022-05-17 13:37:22', '2022-06-14 18:49:17', 5, 29),
(21, '1', 0, 0, 30, 60, 3, 'beszámoló', '2021-09-01', '2022-05-17 13:38:16', '2022-06-14 18:48:33', 5, 30),
(22, '3', 0, 0, 0, 0, 8, 'beszámoló', '2020-09-01', '2022-05-18 06:25:31', '2022-05-18 06:25:31', 5, 26),
(23, '2', 10, 0, 20, 60, 3, 'beszámoló', '2020-09-01', '2022-05-18 06:27:08', '2022-05-18 06:27:08', 5, 33),
(24, '4', 60, 0, 30, 60, 5, 'vizsga', '2020-09-01', '2022-05-18 06:27:45', '2022-05-18 06:27:45', 5, 32),
(160, '1', 14, 0, 16, 60, 3, 'beszámoló', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 21),
(161, '1', 10, 0, 20, 120, 5, 'vizsga', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 27),
(162, '1', 20, 0, 10, 60, 3, 'vizsga', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 31),
(163, '1', 13, 0, 25, 112, 5, 'vizsga', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 16),
(164, '1', 30, 0, 16, 74, 4, 'beszámoló', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 28),
(165, '1', 10, 0, 20, 60, 3, 'vizsga', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 29),
(166, '1', 14, 0, 16, 60, 3, 'beszámoló', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 30),
(167, '1', 30, 0, 15, 90, 5, 'vizsga', '2022-09-01', '2022-06-11 13:18:02', '2022-06-11 13:18:02', 5, 33),
(176, '2', 14, 0, 16, 60, 3, 'beszámoló', '2022-09-01', '2022-06-11 13:18:23', '2022-06-11 13:18:23', 5, 24),
(179, '3', 50, 0, 60, 30, 6, 'vizsga', '2020-09-01', '2022-06-13 09:48:25', '2022-06-13 09:48:25', 5, 8),
(180, '3', 50, 0, 60, 40, 5, 'beszámoló', '2020-09-01', '2022-06-13 09:48:48', '2022-06-13 09:48:48', 5, 9),
(181, '3', 10, 0, 40, 60, 4, 'beszámoló', '2020-09-01', '2022-06-13 15:08:53', '2022-06-13 15:08:53', 5, 7),
(182, '3', 10, 0, 20, 25, 4, 'vizsga', '2020-09-01', '2022-06-13 16:32:32', '2022-06-13 16:32:32', 5, 36),
(183, '3', 30, 0, 10, 40, 7, 'beszámoló', '2020-09-01', '2022-06-13 16:33:13', '2022-06-13 16:33:13', 5, 32),
(184, '4', 10, 0, 10, 20, 2, 'vizsga', '2020-09-01', '2022-06-13 22:16:43', '2022-06-13 22:16:43', 5, 38),
(185, '4', 10, 0, 10, 20, 2, 'vizsga', '2020-09-01', '2022-06-13 22:17:59', '2022-06-13 22:17:59', 6, 38),
(186, '1', 0, 0, 0, 0, 5, 'vizsga', '2020-09-01', '2022-06-13 23:56:15', '2022-06-13 23:56:15', 6, 20),
(187, '4', 70, 0, 80, 100, 7, 'vizsga', '2020-09-01', '2022-06-14 11:00:43', '2022-06-14 11:00:43', 4, 15),
(188, '2', 13, 0, 25, 112, 5, 'vizsga', '2021-09-01', '2022-06-14 18:50:38', '2022-06-14 18:50:38', 5, 16),
(189, '2', 15, 0, 15, 60, 3, 'beszámoló', '2021-09-01', '2022-06-14 18:51:13', '2022-06-14 18:51:13', 5, 27),
(190, '2', 11, 0, 14, 65, 3, 'vizsga', '2021-09-01', '2022-06-14 18:51:42', '2022-06-14 18:51:42', 5, 29),
(191, '2', 0, 0, 52, 128, 6, 'beszámoló', '2021-09-01', '2022-06-14 18:54:22', '2022-06-14 18:54:22', 5, 22),
(192, '2', 28, 0, 28, 124, 6, 'beszámoló', '2021-09-01', '2022-06-14 18:57:27', '2022-06-14 18:57:27', 5, 39),
(193, '2', 20, 0, 10, 60, 3, 'vizsga', '2021-09-01', '2022-06-14 19:15:19', '2022-06-14 19:15:19', 5, 40),
(194, '2', 20, 0, 10, 60, 3, 'vizsga', '2021-09-01', '2022-06-14 19:16:00', '2022-06-14 19:16:00', 6, 40);`)
        .then(message => {
            res.send({ message: 'Sikeres!' });
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Hiba lépett fel a beírás közben."
            });
        });
};

