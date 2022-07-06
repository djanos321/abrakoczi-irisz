const { sequelize, diakok_szama } = require("../models");
const db = require("../models");
const Op = db.Sequelize.Op;
const Diakok_szama = db.diakok_szama;
const QueryTypes = db.Sequelize.QueryTypes;

//Üres sorok létrehozása a diákok számolásához
exports.ujTaneviDiakokSzamaAdatok = (req, res) => {
  sequelize.query(`    
    INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt) 
    SELECT szakok.id, CONCAT(YEAR(NOW()),'-09-01'), NOW(), NOW() FROM szakok;`)
    .then(data => {
      res.send({ message: 'Sikeres!' });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a beírás közben."
      });
    });
};

exports.kotelezoTantargyakLeckekonyvbeIrasa = (req, res) => {

  if (!req.query.szakokId || !req.query.kezdes_ev || !req.query.felev || !req.query.kepzesi_forma) {
    res.status(400).send({
      message: "Kérem töltsön ki minden mezőt!"
    });
    return;
  }

  req.query.kezdes_ev = req.query.kezdes_ev + '-09-01';

  sequelize.query(`
    INSERT INTO eredmenyek (diakokId, felev, kredit, tipus, tantargyakId, createdAt, updatedAt, munkatarsakId, szeminarium_munkatarsakId)
    SELECT diakok.id, mintatantervek.felev, mintatantervek.kredit, mintatantervek.tipus, mintatantervek.tantargyakId, NOW(), NOW(), tantargy_tarifikaciok.munkatarsakId, tantargy_tarifikaciok.szeminarium_munkatarsakId 
    FROM diakok, tantargy_tarifikaciok, mintatantervek  LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id 
    WHERE mintatantervek.szakokId = ${req.query.szakokId}
    AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
    AND mintatantervek.felev = ${req.query.felev}
    AND diakok.szakokId = ${req.query.szakokId}
    AND diakok.kepzesi_forma LIKE '${req.query.kepzesi_forma}'
    AND diakok.kezdes_ev = '${req.query.kezdes_ev}'
    AND tantargy_tarifikaciok.tantargyakId = mintatantervek.tantargyakId
    AND tantargy_tarifikaciok.felev = ${req.query.felev}
    AND tantargy_tarifikaciok.kepzesi_forma LIKE '${req.query.kepzesi_forma}'
    AND (tantargyak.tipus LIKE 'általános felkészítés' OR tantargyak.tipus LIKE 'szakmai felkészítés' OR tantargyak.tipus LIKE 'gyakorlat');`)
    .then(data => {
      res.send({ message: 'Sikeres!' });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a beírás közben."
      });
    });
};

exports.kotelezoTantargyakTarifikacioba = (req, res) => {

  if (!req.query.tanszekekId || !req.query.kezdes_ev || !req.query.felev || !req.query.kepzesi_forma || !req.query.kepzesi_szint) {
    res.status(400).send({
      message: "Kérem töltsön ki minden mezőt!"
    });
    return;
  }

  req.query.kezdes_ev = req.query.kezdes_ev + '-09-01';
  if (req.query.kepzesi_forma == 'nappali') {
    sequelize.query(`
    INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.query.felev}, mintatantervek.kredit, mintatantervek.tipus, 'nappali', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 
	  (SELECT SUM(diakok_szama.db_nappali)
      FROM diakok_szama AS diakok_szama, mintatantervek AS mintatantervek2 
      WHERE diakok_szama.kezdes_ev LIKE '${req.query.kezdes_ev}'
       AND diakok_szama.szakokId = mintatantervek2.szakokId
      AND mintatantervek2.felev = ${req.query.felev}
      AND mintatantervek2.kezdes_ev LIKE '${req.query.kezdes_ev}'
      AND mintatantervek2.tantargyakId = mintatantervek.tantargyakId) AS n_osszeg, NOW(), NOW()
      FROM mintatantervek AS mintatantervek  
      LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
      LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
      WHERE mintatantervek.felev = ${req.query.felev}
      AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
      AND tantargyak.tanszekekId = ${req.query.tanszekekId}
      AND szakok.kepzesi_szint LIKE '${req.query.kepzesi_szint}'
      AND (tantargyak.tipus LIKE 'szakmai felkészítés' OR tantargyak.tipus LIKE 'általános felkészítés')`)
      .then(data => {
        res.send({ message: 'Sikeres!' });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel a beírás közben."
        });
      });
  }

  if (req.query.kepzesi_forma == 'levelező') {
    sequelize.query(`INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.query.felev}, mintatantervek.kredit, mintatantervek.tipus, 'levelező', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 
	  (SELECT SUM(diakok_szama.db_levelezo)
      FROM diakok_szama AS diakok_szama, mintatantervek AS mintatantervek2 
      WHERE diakok_szama.kezdes_ev LIKE '${req.query.kezdes_ev}'
       AND diakok_szama.szakokId = mintatantervek2.szakokId
      AND mintatantervek2.felev = ${req.query.felev}
      AND mintatantervek2.kezdes_ev LIKE '${req.query.kezdes_ev}'
      AND mintatantervek2.tantargyakId = mintatantervek.tantargyakId) AS n_osszeg, NOW(), NOW()
      FROM mintatantervek AS mintatantervek  
      LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
      LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
      WHERE mintatantervek.felev = ${req.query.felev}
      AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
      AND tantargyak.tanszekekId = ${req.query.tanszekekId}
      AND szakok.kepzesi_szint LIKE '${req.query.kepzesi_szint}'
      AND (tantargyak.tipus LIKE 'szakmai felkészítés' OR tantargyak.tipus LIKE 'általános felkészítés')`)
      .then(data => {
        res.send({ message: 'Sikeres!' });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel a beírás közben."
        });
      });
  }
};

exports.szabadonValaszthatoTantargyakTarifikacioba = (req, res) => {

  if (!req.query.tanszekekId || !req.query.kezdes_ev || !req.query.felev || !req.query.kepzesi_forma || !req.query.kepzesi_szint) {
    res.status(400).send({
      message: "Kérem töltsön ki minden mezőt!"
    });
    return;
  }

  req.query.kezdes_ev = req.query.kezdes_ev + '-09-01';
  if (req.query.kepzesi_forma == 'nappali') {
    sequelize.query(`
    INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.query.felev}, mintatantervek.kredit, mintatantervek.tipus, 'nappali', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 0, NOW(), NOW()
          FROM mintatantervek AS mintatantervek  
          LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
          LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
          WHERE mintatantervek.felev = ${req.query.felev}
          AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
          AND tantargyak.tanszekekId = ${req.query.tanszekekId}
          AND szakok.kepzesi_szint LIKE '${req.query.kepzesi_szint}'
          AND tantargyak.tipus LIKE 'szabadon választható'`)
      .then(data => {
        res.send({ message: 'Sikeres!' });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel a beírás közben."
        });
      });
  }

  if (req.query.kepzesi_forma == 'levelező') {
    sequelize.query(`INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.query.felev}, mintatantervek.kredit, mintatantervek.tipus, 'levelező', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 0, NOW(), NOW()
          FROM mintatantervek AS mintatantervek  
          LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
          LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
          WHERE mintatantervek.felev = ${req.query.felev}
          AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
          AND tantargyak.tanszekekId = ${req.query.tanszekekId}
          AND szakok.kepzesi_szint LIKE '${req.query.kepzesi_szint}'
          AND tantargyak.tipus LIKE 'szabadon választható'`)
      .then(data => {
        res.send({ message: 'Sikeres!' });
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Hiba lépett fel a beírás közben."
        });
      });
  }
};


//Új mintatanterv létrehozása régi alapján
exports.ujMintatanterv = (req, res) => {
  if (!req.query.szakokId || !req.query.kezdes_ev_regi || !req.query.kezdes_ev_uj) {
    res.status(400).send({
      message: "Kérem töltsön ki minden kötelező mezőt!"
    });
    return;
  }
  req.query.kezdes_ev_uj = req.query.kezdes_ev_uj + '-09-01';
  req.query.kezdes_ev_regi = req.query.kezdes_ev_regi + '-09-01';
  sequelize.query(`
    INSERT INTO mintatantervek (felev, eloadas, laboratoriumi, gyakorlati, onallo_munka, kredit, tipus, kezdes_ev, szakokId, tantargyakId, createdAt, updatedAt)
    SELECT mintatantervek.felev, mintatantervek.eloadas, mintatantervek.laboratoriumi, mintatantervek.gyakorlati, mintatantervek.onallo_munka, mintatantervek.kredit, mintatantervek.tipus,'${req.query.kezdes_ev_uj}', '${req.query.szakokId}', mintatantervek.tantargyakId, NOW(), NOW()
    FROM mintatantervek  
    WHERE mintatantervek.szakokId = ${req.query.szakokId}
    AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev_regi}'
    AND ${req.query.felev ? `mintatantervek.felev = ${req.query.felev}` : 1}`)
    .then(data => {
      res.send({ message: 'Sikeres!' });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel a beírás közben."
      });
    });
};

//Szabadon választható tantárgyak felvétele
exports.szabadonValaszthatoTantargyak = (req, res) => {
  if (!req.query.szakokId || !req.query.kepzesi_forma || !req.query.kezdes_ev || !req.query.felev || !req.query.tantargyakId || !req.query.diakok) {
    res.status(400).send({
      message: "Kérem töltsön ki minden kötelező mezőt!"
    });
    return;
  }

  req.query.kezdes_ev = req.query.kezdes_ev + '-09-01';

  let sikeres = 0;
  for (let i = 0; i < req.query.diakok.length - 1; i++) {
    sequelize.query(`
      INSERT INTO eredmenyek (diakokId, felev, kredit, tipus, tantargyakId, createdAt, updatedAt, munkatarsakId, szeminarium_munkatarsakId)
      SELECT ${req.query.diakok[i]}, mintatantervek.felev, mintatantervek.kredit, mintatantervek.tipus, mintatantervek.tantargyakId, NOW(), NOW(), tantargy_tarifikaciok.munkatarsakId, tantargy_tarifikaciok.szeminarium_munkatarsakId 
      FROM tantargy_tarifikaciok, mintatantervek
      WHERE mintatantervek.szakokId = ${req.query.szakokId}
      AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
      AND mintatantervek.felev = ${req.query.felev}
      AND mintatantervek.tantargyakId= ${req.query.tantargyakId}
      AND tantargy_tarifikaciok.tantargyakId =  ${req.query.tantargyakId}
      AND tantargy_tarifikaciok.felev = ${req.query.felev}
      AND tantargy_tarifikaciok.kepzesi_forma LIKE '${req.query.kepzesi_forma}'`)
      .then(data => {
        sikeres++;
        if (i == req.query.diakok.length - 2) {
          res.send({ message: 'Sikeres!' });
        }
      })
      .catch(err => {
        if (i == req.query.diakok.length - 2 && sikeres == 0) {
          res.status(500).send({
            message:
              err.message || "Hiba lépett fel a beírás közben."
          });
        }
        if (i == req.query.diakok.length - 2 && sikeres != 0) {
          res.send({ message: 'Sikeres!' });
        }

      });

  }

};

/**
 * exports.kotelezoTantargyakTarifikacioba = (req, res) => {

  if (!req.query.szakok || !req.query.kezdes_ev || !req.query.felev || !req.query.kepzesi_forma) {
    res.status(400).send({
      message: "Kérem töltsön ki minden mezőt!"
    });
    return;
  }

  req.query.kezdes_ev = req.query.kezdes_ev + '-09-01';

  let n_osszeg = 0;
  let l_osszeg = 0;

  for (let i = 0; i < req.query.szakok.length - 1; i++) {
    var condition = {
      [Op.and]: [
        req.query.szakok[i] ? { szakokId: { [Op.like]: `${req.query.szakok[i]}` } } : null,
        req.query.kezdes_ev ? { kezdes_ev: { [Op.like]: `${req.query.kezdes_ev}` } } : null,
      ]
    }
    Diakok_szama.findAll({
      where: condition,
      raw: true,
      nest: true,
    })
      .then(data => {
        n_osszeg = n_osszeg + data[0].db_nappali;
        l_osszeg = l_osszeg + data[0].db_levelezo;
        if (i == req.query.szakok.length - 2) {
          if (req.query.kepzesi_forma == 'nappali') {
            sequelize.query(`
          INSERT INTO tantargy_tarifikaciok 
          (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
          SELECT mintatantervek.tantargyakId, mintatantervek.felev, mintatantervek.kredit, mintatantervek.tipus, 'nappali', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, ${n_osszeg}, NOW(), NOW()
          FROM mintatantervek LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id 
          WHERE mintatantervek.szakokId = ${req.query.szakok[0]}
          AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
          AND mintatantervek.felev = ${req.query.felev}
          AND (tantargyak.tipus LIKE 'általános felkészítés' OR tantargyak.tipus LIKE 'szakmai felkészítés' );`)
              .then(data => {
                res.send({ message: 'Sikeres!' });
              })
              .catch(err => {
                res.status(500).send({
                  message:
                    err.message || "Hiba lépett fel a beírás közben."
                });
              });
          }

          if (req.query.kepzesi_forma == 'levelező') {
            sequelize.query(`
          INSERT INTO tantargy_tarifikaciok 
          (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
          SELECT mintatantervek.tantargyakId, mintatantervek.felev, mintatantervek.kredit, mintatantervek.tipus, 'levelező' , mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, ${l_osszeg}, NOW(), NOW()
          FROM mintatantervek LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id 
          WHERE mintatantervek.szakokId = ${req.query.szakokId}
          AND mintatantervek.kezdes_ev LIKE '${req.query.kezdes_ev}'
          AND mintatantervek.felev = ${req.query.felev}
          AND (tantargyak.tipus LIKE 'általános felkészítés' OR tantargyak.tipus LIKE 'szakmai felkészítés');`)
              .then(data => {
                res.send({ message: 'Sikeres!' });
              })
              .catch(err => {
                res.status(500).send({
                  message:
                    err.message || "Hiba lépett fel a beírás közben."
                });
              });
          }

        }
      });
  };


};
 */