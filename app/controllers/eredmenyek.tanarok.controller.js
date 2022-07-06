const { sequelize, szakok, tantargyak, munkatarsak, diakok } = require("../models");
const db = require("../models");
const Eredmenyek = db.eredmenyek;
const Tantargyak = db.tantargyak;
const Op = db.Sequelize.Op;


// az oldalak számolásához, valószínűleg nem lesz felhasználva
const oldalszamozasiAdatok = (data, oldal, limit) => {
  const { count: osszesElem, rows: eredmenyek } = data;
  const jelenlegiOldal = oldal ? +oldal : 0;
  const osszesOldal = Math.ceil(osszesElem / limit);

  return { osszesElem, eredmenyek, osszesOldal, jelenlegiOldal };
};

// A paraméterben megadott félév eredményeinek a listázása a bejelntkezett diáknak (id szerint van azonosítva)
exports.osszesEredmenyListazasas = (req, res) => {
  const { munkatarsakId, tantargyakId, szakokId, kepzesi_forma, felev, pontszam } = req.body;
  if (!req.body.tantargyakId) {
    res.status(400).send({
      message: "A tantárgy megadása kötelező!"
    });
    return;
  }
  if (!req.body.szakokId) {
    res.status(400).send({
      message: "A szak megadása kötelező!"
    });
    return;
  }
  if (!req.body.kepzesi_forma) {
    res.status(400).send({
      message: "A képzési forma megadása kötelező!"
    });
    return;
  }
  if (!req.body.felev) {
    res.status(400).send({
      message: "A félév megadása kötelező!"
    });
    return;
  }
  var condition = {
    [Op.or]: [
      {
        [Op.and]: [
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
          szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
          kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
          felev ? { felev: { [Op.like]: `${felev}` } } : null,
          felev ? sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: `${Math.round(felev / 2) - 1}` }) : null,
          //felev ? { '$diakok.evfolyam$': { [Op.like]: `${Math.round(felev/2)-1}` } } : null,
          munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          pontszam == 60 ? { pontszam: { [Op.gte]: 60 } } : null,
          pontszam == 0 ? { pontszam: { [Op.lt]: 60 } } : null,
          pontszam == 'null' ? { pontszam: { [Op.is]: null } } : null,
        ],
      },
      {
        [Op.and]: [
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
          szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
          kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
          felev ? { felev: { [Op.like]: `${felev}` } } : null,
          felev ? sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: `${Math.round(felev / 2) - 1}` }) : null,
          munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          pontszam == 60 ? { pontszam: { [Op.gte]: 60 } } : null,
          pontszam == 0 ? { pontszam: { [Op.lt]: 60 } } : null,
          pontszam == 'null' ? { pontszam: { [Op.is]: null } } : null,
        ],
      },
    ]
  };

  Eredmenyek.findAll({
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
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
    },
    { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] }, },
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
exports.tanarTantargyainakListazasa = (req, res) => {
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

  Eredmenyek.findAll({
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
        include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
      },
      { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt', 'kepzesi_szint', 'tipus', 'tanszekekId'] }, },
    ],
    group: ['tantargyakId'],
    order: [
      [{ model: tantargyak, as: "tantargyak" }, 'tantargy_nev'],
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
exports.szakokListazasa = (req, res) => {
  const { munkatarsakId, tantargyakId } = req.body;
  var condition =
  {
    [Op.or]: [
      {
        [Op.and]: [
          munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
        ]
      },
      {
        [Op.and]: [
          munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
        ]
      }

    ]
  };

  Eredmenyek.findAll({
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
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt', 'tanszekekId'] }, }]
    },],

    group: [
      'szakokId'
    ],
    order: [
      [{ model: diakok, as: "diakok" }, { model: szakok, as: "szakok" }, 'szak_nev'],
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
exports.kepzesiFormaListazasa = (req, res) => {
  const { munkatarsakId, tantargyakId, szakokId } = req.body;
  var condition =

  {
    [Op.or]: [
      {
        [Op.and]: [
          munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
          szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
        ]
      },
      {
        [Op.and]: [
          munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
          szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
        ]
      }

    ]
  };
  Eredmenyek.findAll({
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
exports.felevListazasa = (req, res) => {
  const { munkatarsakId, tantargyakId, szakokId, kepzesi_forma } = req.body;

  var condition =
  {
    [Op.or]: [
      {
        [Op.and]: [
          munkatarsakId ? { munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
          szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
          kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,

        ]
      },
      {
        [Op.and]: [
          munkatarsakId ? { szeminarium_munkatarsakId: { [Op.like]: `${munkatarsakId}` } } : null,
          sequelize.where(sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), { [Op.like]: sequelize.literal('(CEIL(felev/2)-1)') }),
          tantargyakId ? { tantargyakId: { [Op.like]: `${tantargyakId}` } } : null,
          szakokId ? { '$diakok.szakokId$': { [Op.like]: `${szakokId}` } } : null,
          kepzesi_forma ? { '$diakok.kepzesi_forma$': { [Op.like]: `${kepzesi_forma}` } } : null,
        ]
      }

    ]
  };

  Eredmenyek.findAll({
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

// Eredmény keresése azonosítója alapján
exports.egyEredmenyListazasa = (req, res) => {
  const id = req.params.id;

  Eredmenyek.findByPk(id, {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [{
      model: diakok, as: "diakok", attributes: {
        exclude: ['email', 'jelszo', 'createdAt', 'updatedAt'],
        include: [
          [sequelize.fn("YEAR", sequelize.col("`diakok`.`kezdes_ev`")), "kezdes_ev"],
          [sequelize.fn('TIMESTAMPDIFF', sequelize.literal('year'), sequelize.col('`diakok`.`kezdes_ev`'), sequelize.fn("NOW")), 'evfolyam'],
        ],
      },
      include: [{ model: szakok, as: "szakok", attributes: { exclude: ['createdAt', 'updatedAt'] }, }]
    },
    { model: tantargyak, as: "tantargyak", attributes: { exclude: ['createdAt', 'updatedAt'] }, },
    { model: munkatarsak, as: "eloadas_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
    { model: munkatarsak, as: "szeminarium_munkatarsak", attributes: { exclude: ['createdAt', 'updatedAt', 'email', 'jelszo'] } },
    ]
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az eredmény keresése közben, az eredmény azonosítója: " + id
      });
    });
};

// Eredmeny módosítása azonosítója alapján
exports.frissites = (req, res) => {

  // Ha ezek a mezők nincsenek kitöltve, akkor hibaüzenettel visszatér
  if (!req.body.diakokId || !req.body.tantargyakId || !req.body.felev || !req.body.kredit ||
    !req.body.tipus) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }

  if (req.body.datum == '0000-00-00') {
    res.status(400).send({
      message: "A dátum megadása kötelező!"
    });
    return;
  }

  // Kérés validálása
  if (req.body.kredit < 0 || req.body.pontszam < 0 && req.body.pontszam_ellenorzes != -1) {
    res.status(400).send({
      message: "A mező értéke nem lehet negatív!"
    });
    return;
  }

  // Kérés validálása
  if (req.body.pontszam > 100) {
    res.status(400).send({
      message: "Hiba! Maximum 100 pont adható!"
    });
    return;
  }

  if (req.body.vizsgahoz_engedve == false && req.body.megjelent) {
    res.status(400).send({
      message: "Ha nincs a hallgató vizsgához engedve, kérem válassza ki, hogy nem jelent meg!"
    });
    return;
  }

  if (!req.body.megjelent) {
    req.body.pontszam = -1;
  }

  if (!req.body.pontszam) {
    req.body.pontszam == null;
  }

  if (!req.body.munkatarsakId) {
    req.body.munkatarsakId = null;
  }

  if (!req.body.szeminarium_munkatarsakId) {
    req.body.szeminarium_munkatarsakId = null;
  }

  if (
    //ellenőrzésre '' ad vissza nem null-t, tehát a null-os ellenőrzés eseteket nem kell vizsgálni
    // Ha előtte 34 < pontszám < 60 aztán pedig 60 <= pont <= 100
    (req.body.pontszam <= 100 && req.body.pontszam >= 60 && req.body.pontszam_ellenorzes > 34 && req.body.pontszam_ellenorzes < 60) ||
    // Ha előtte 34 < pontszám < 60 aztán pedig 0 <= pont <= 34
    (req.body.pontszam <= 34 && req.body.pontszam >= 0 && req.body.pontszam_ellenorzes > 34 && req.body.pontszam_ellenorzes < 60) ||
    // Ha előtte -1 aztán pedig 0 <= pont <= 34
    (req.body.pontszam <= 34 && req.body.pontszam >= 0 && req.body.pontszam_ellenorzes == -1) ||
    // Ha előtte -1 aztán pedig 60 <= pont <= 100
    (req.body.pontszam <= 100 && req.body.pontszam >= 60 && req.body.pontszam_ellenorzes == -1)
  ) {
    var condition1 = {
      [Op.and]: [
        { diakokId: { [Op.like]: `${req.body.diakokId}` } },
        { tantargyakId: { [Op.like]: `${req.body.tantargyakId}` } },
        { felev: { [Op.like]: `${req.body.felev}` } },
        { pontszam: { [Op.is]: null } },
        { vizsgahoz_engedve: { [Op.is]: false } },
      ]
    };

    Eredmenyek.destroy({
      where: condition1,
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Az eredmény sikeresen törölve lett!"
          });
        } else {
          res.send({
            message: `Nem sikerült az eredmény törlése, azonsító:${id}. Lehetséges, hogy az eredmény nem található!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Hiba lépett fel az eredmény törlése közben, azonosító: " + id
        });
      });
  }

  const id = req.params.id;

  Eredmenyek.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Az eredmény sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet az eredményt frissíteni, azonosító: ${id}. Lehetséges, hogy az eredmény nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az eredmény frissítése közben, azonosító: " + id
      });
    });

  var condition2 = {
    [Op.and]: [
      req.body.diakokId ? { diakokId: { [Op.like]: `${req.body.diakokId}` } } : null,
      req.body.szakId ? { szakId: { [Op.like]: `${req.body.szakId}` } } : null,
      req.body.tantargyakId ? { tantargyakId: { [Op.like]: `${req.body.tantargyakId}` } } : null,
      req.body.felev ? { felev: { [Op.like]: `${req.body.felev}` } } : null,
    ],
  }
  Eredmenyek.findAndCountAll({
    where: condition2
  })
    .then(data => {
      const response = oldalszamozasiAdatok(data);
      const osszeg = response.osszesElem;
      if (osszeg < 3 && (
        //Az első két feltétel igazából teljesen értelmetlen, mert ellenőrzésre '' ad vissza nem null-t
        //Ha előtte a pontszám null volt és kapott egy olyan pontot ami pótvizsgát von maga után (34 < pont < 60)
        (req.body.pontszam < 60 && req.body.pontszam > 34 && req.body.pontszam_ellenorzes == null) ||
        //Ha előtte a pontszám null volt és nem jelent meg a vzsgán (pont = -1)
        (req.body.pontszam == -1 && req.body.pontszam_ellenorzes == null) ||
        //Ha előtte a pont 0 <= pontszám <= 34, és aztán kapott 34 < pont < 60 pontot (ha előtt -1 pont volt, azaz megbukás, akkor nem érvényes)
        (req.body.pontszam < 60 && req.body.pontszam > 34 && req.body.pontszam_ellenorzes <= 34 && req.body.pontszam_ellenorzes != -1) ||
        //Ha előtte a pont 0 <= pontszám <= 34, és aztán pontszám = -1
        (req.body.pontszam == -1 && req.body.pontszam_ellenorzes <= 34 && req.body.pontszam_ellenorzes != -1) ||
        //Ha előtte 60 <= pontszám <= 100 és utánna kapott 34 < pont < 60
        (req.body.pontszam < 60 && req.body.pontszam > 34 && req.body.pontszam_ellenorzes >= 60 && req.body.pontszam_ellenorzes <= 100) ||
        //Ha előtte 60 <= pontszám <= 100 és pontszám = -1
        (req.body.pontszam == -1 && req.body.pontszam_ellenorzes >= 60 && req.body.pontszam_ellenorzes <= 100)
      )) {

        req.body.pontszam = null;
        req.body.vizsgahoz_engedve = false;
        req.body.datum = '0000-00-00';

        // Eredmeny létrehozása
        const eredmeny = {
          diakokId: req.body.diakokId,
          tantargyakId: req.body.tantargyakId,
          felev: req.body.felev,
          kredit: req.body.kredit,
          tipus: req.body.tipus,
          munkatarsakId: req.body.munkatarsakId,
          szeminarium_munkatarsakId: req.body.szeminarium_munkatarsakId,
          pontszam: req.body.pontszam,
          vizsgahoz_engedve: req.body.vizsgahoz_engedve,
          datum: req.body.datum,
        };
        // Eredmény mentése az adatbázisba
        Eredmenyek.create(eredmeny)
          .then(data => {
            res.send(data);
          })
          .catch(err => {
            Eredmenyek.create(eredmeny)
              .catch(err => {
                Eredmenyek.create(eredmeny)
              });
          });
      }
    })
};

exports.gyorsitas = (req, res) => {
  sequelize.query(`
  TRUNCATE TABLE eredmenyek;`)        

  sequelize.query(`INSERT INTO eredmenyek (id, felev, kredit, tipus, pontszam, vizsgahoz_engedve, datum, createdAt, updatedAt, tantargyakId, munkatarsakId, szeminarium_munkatarsakId, diakokId) VALUES
  (1, '2', 5, 'vizsga', 96, 1, '2022-06-28', '2022-06-14 22:19:56', '2022-06-14 22:35:27', 16, 14, 27, 16),
  (2, '2', 3, 'beszámoló', 88, 1, '2022-06-29', '2022-06-14 22:19:56', '2022-06-14 22:34:59', 24, 2, 2, 16),
  (3, '2', 3, 'beszámoló', 92, 1, '2022-06-21', '2022-06-14 22:19:56', '2022-06-14 22:34:34', 27, 18, 18, 16),
  (4, '2', 3, 'vizsga', 79, 1, '2022-06-23', '2022-06-14 22:19:56', '2022-06-14 22:35:16', 29, 26, 26, 16),
  (5, '2', 3, 'vizsga', 90, 1, '2022-06-23', '2022-06-14 22:19:56', '2022-06-14 22:35:40', 40, 28, 28, 16),
  (6, '2', 5, 'vizsga', 88, 1, '2022-06-28', '2022-06-14 22:19:56', '2022-06-14 22:31:20', 16, 14, 27, 20),
  (7, '2', 3, 'beszámoló', 90, 1, '2022-06-14', '2022-06-14 22:19:56', '2022-06-14 22:30:50', 24, 2, 2, 20),
  (8, '2', 3, 'beszámoló', -1, 1, '2022-06-21', '2022-06-14 22:19:56', '2022-06-14 22:30:03', 27, 18, 18, 20),
  (9, '2', 3, 'vizsga', 89, 1, '2022-06-23', '2022-06-14 22:19:56', '2022-06-14 22:31:08', 29, 26, 26, 20),
  (10, '2', 3, 'vizsga', 93, 1, '2022-06-23', '2022-06-14 22:19:56', '2022-06-14 22:31:36', 40, 28, 28, 20),
  (11, '2', 5, 'vizsga', 76, 1, '2022-06-28', '2022-06-14 22:19:56', '2022-06-14 22:33:51', 16, 14, 27, 27),
  (12, '2', 3, 'beszámoló', 98, 1, '2022-06-14', '2022-06-14 22:19:56', '2022-06-14 22:33:09', 24, 2, 2, 27),
  (13, '2', 3, 'beszámoló', 65, 1, '2022-06-21', '2022-06-14 22:19:56', '2022-06-14 22:32:59', 27, 18, 18, 27),
  (14, '2', 3, 'vizsga', 62, 1, '2022-06-23', '2022-06-14 22:19:56', '2022-06-14 22:33:21', 29, 26, 26, 27),
  (15, '2', 3, 'vizsga', 67, 1, '2022-06-23', '2022-06-14 22:19:56', '2022-06-14 22:34:06', 40, 28, 28, 27),
  (16, '2', 5, 'vizsga', 94, 1, '2022-06-28', '2022-06-14 22:20:48', '2022-06-14 22:28:54', 16, 27, NULL, 21),
  (17, '2', 3, 'beszámoló', 86, 1, '2022-06-14', '2022-06-14 22:20:48', '2022-06-14 22:28:14', 24, 2, NULL, 21),
  (18, '2', 3, 'beszámoló', 65, 1, '2022-06-21', '2022-06-14 22:20:48', '2022-06-14 22:27:55', 27, 18, NULL, 21),
  (19, '2', 3, 'vizsga', 77, 1, '2022-06-23', '2022-06-14 22:20:48', '2022-06-14 22:28:36', 29, 26, NULL, 21),
  (20, '2', 3, 'vizsga', 89, 1, '2022-06-23', '2022-06-14 22:20:48', '2022-06-14 22:29:10', 40, 28, NULL, 21),
  (21, '2', 5, 'vizsga', 96, 1, '2022-06-28', '2022-06-14 22:20:48', '2022-06-14 22:26:40', 16, 27, NULL, 28),
  (22, '2', 3, 'beszámoló', -1, 1, '2022-06-14', '2022-06-14 22:20:48', '2022-06-14 22:25:53', 24, 2, NULL, 28),
  (23, '2', 3, 'beszámoló', 75, 1, '2022-06-21', '2022-06-14 22:20:48', '2022-06-14 22:25:38', 27, 18, NULL, 28),
  (24, '2', 3, 'vizsga', 88, 1, '2022-06-23', '2022-06-14 22:20:48', '2022-06-14 22:26:26', 29, 26, NULL, 28),
  (25, '2', 3, 'vizsga', 72, 1, '2022-06-23', '2022-06-14 22:20:48', '2022-06-14 22:26:52', 40, 28, NULL, 28),
  (31, '2', 6, 'beszámoló', 58, 1, '2022-06-27', '2022-06-14 22:21:46', '2022-06-14 22:31:47', 22, NULL, 26, 20),
  (32, '2', 6, 'beszámoló', 91, 1, '2022-06-27', '2022-06-14 22:21:46', '2022-06-14 22:34:48', 22, NULL, 26, 16),
  (33, '2', 6, 'beszámoló', 85, 1, '2022-06-07', '2022-06-14 22:22:44', '2022-06-14 22:32:37', 39, 26, 13, 27),
  (34, '2', 6, 'beszámoló', 91, 1, '2022-06-07', '2022-06-14 22:23:31', '2022-06-14 22:27:35', 39, 26, NULL, 21),
  (35, '2', 6, 'beszámoló', 88, 1, '2022-06-07', '2022-06-14 22:23:31', '2022-06-14 22:25:25', 39, 26, NULL, 28),
  (36, '2', 3, 'beszámoló', 91, 1, '2022-06-29', '2022-06-14 22:25:53', '2022-06-14 22:26:08', 24, 2, NULL, 28),
  (37, '2', 3, 'beszámoló', 82, 1, '2022-06-22', '2022-06-14 22:30:03', '2022-06-14 22:30:18', 27, 18, 18, 20),
  (38, '2', 6, 'beszámoló', 78, 1, '2022-06-29', '2022-06-14 22:31:47', '2022-06-14 22:32:13', 22, NULL, 26, 20),
  (39, '2', 5, 'vizsga', NULL, 1, '0000-00-00', '2022-06-14 22:37:43', '2022-06-14 22:37:43', 16, 14, 27, 3),
  (41, '2', 5, 'vizsga', NULL, 1, '0000-00-00', '2022-06-14 22:37:43', '2022-06-14 22:37:43', 16, 14, 27, 26),
  (42, '1', 5, 'vizsga', 91, 1, '2022-05-17', '2022-05-18 06:28:10', '2022-05-18 06:37:02', 16, 27, 27, 9),
  (43, '1', 3, 'beszámoló', 78, 1, '2022-05-11', '2022-05-18 06:28:10', '2022-05-18 06:35:51', 21, 2, 2, 9),
  (44, '1', 4, 'beszámoló', 90, 1, '2020-05-20', '2022-05-18 06:28:10', '2022-05-18 06:35:34', 22, 26, 26, 9),
  (45, '1', 3, 'beszámoló', 59, 1, '2022-05-19', '2022-05-18 06:28:10', '2022-05-18 06:36:26', 20, 28, 28, 9),
  (46, '1', 6, 'beszámoló', 95, 1, '2022-05-19', '2022-05-18 06:28:10', '2022-05-18 06:36:08', 26, 27, 27, 9),
  (47, '4', 5, 'vizsga', -1, 1, '2022-05-19', '2022-05-18 06:29:51', '2022-05-18 06:38:20', 32, 26, 13, 9),
  (48, '2', 5, 'vizsga', 92, 1, '2022-05-20', '2022-05-18 06:32:35', '2022-05-18 06:37:35', 16, 27, 27, 9),
  (49, '2', 3, 'beszámoló', 88, 1, '2022-05-21', '2022-05-18 06:32:35', '2022-05-18 06:40:05', 33, 29, 29, 9),
  (50, '3', 8, 'beszámoló', 95, 1, '2022-05-17', '2022-05-18 06:32:41', '2022-05-18 06:37:54', 26, 12, 27, 9),
  (51, '1', 3, 'beszámoló', 78, 1, '2022-05-27', '2022-05-18 06:36:26', '2022-05-18 06:36:40', 20, 28, 28, 9),
  (52, '4', 5, 'vizsga', 94, 1, '2022-05-20', '2022-05-18 06:38:20', '2022-05-18 06:38:36', 32, 26, 13, 9),
  (53, '1', 5, 'vizsga', 95, 1, '2022-05-19', '2022-05-18 07:30:36', '2022-06-14 22:46:51', 9, 3, 19, 9),
  (54, '3', 6, 'vizsga', 95, 1, '2022-06-29', '2022-06-13 11:49:19', '2022-06-14 22:46:39', 8, 20, NULL, 9),
  (55, '3', 4, 'beszámoló', 98, 1, '2022-06-29', '2022-06-13 15:09:29', '2022-06-14 22:47:00', 7, 30, 13, 9);`)
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