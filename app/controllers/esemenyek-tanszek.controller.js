const { sequelize, szakok } = require("../models");
const db = require("../models");
const Op = db.Sequelize.Op;
const QueryTypes = db.Sequelize.QueryTypes;

//Új mintatanterv létrehozása régi alapján
exports.ujMintatanterv = (req, res) => {
  if (!req.body.szakokId || !req.body.kezdes_ev_regi || !req.body.kezdes_ev_uj) {
    res.status(400).send({
      message: "Kérem töltsön ki minden mezőt!"
    });
    return;
  }
  req.body.kezdes_ev_uj = req.body.kezdes_ev_uj + '-09-01';
  req.body.kezdes_ev_regi = req.body.kezdes_ev_regi + '-09-01';
  sequelize.query(`
    INSERT INTO mintatantervek (felev, eloadas, laboratoriumi, gyakorlati, onallo_munka, kredit, tipus, kezdes_ev, szakokId, tantargyakId, createdAt, updatedAt)
    SELECT mintatantervek.felev, mintatantervek.eloadas, mintatantervek.laboratoriumi, mintatantervek.gyakorlati, mintatantervek.onallo_munka, mintatantervek.kredit, mintatantervek.tipus,'${req.body.kezdes_ev_uj}', '${req.body.szakokId}', mintatantervek.tantargyakId, NOW(), NOW()
    FROM mintatantervek  
    WHERE mintatantervek.szakokId = ${req.body.szakokId}
    AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev_regi}'
    AND ${req.body.felev ? `mintatantervek.felev = ${req.body.felev}` : 1}`)
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
  if (!req.body.szakokId || !req.body.kepzesi_forma || !req.body.kezdes_ev || !req.body.felev || !req.body.tantargyakId || !req.body.diakok) {
    res.status(400).send({
      message: "Kérem töltsön ki minden kötelező mezőt!"
    });
    return;
  }

  req.body.kezdes_ev = req.body.kezdes_ev + '-09-01';

  let sikeres = 0;
  for (let i = 0; i < req.body.diakok.length - 1; i++) {
    sequelize.query(`
      INSERT INTO eredmenyek (diakokId, felev, kredit, tipus, tantargyakId, createdAt, updatedAt, munkatarsakId, szeminarium_munkatarsakId)
      SELECT ${req.body.diakok[i]}, mintatantervek.felev, mintatantervek.kredit, mintatantervek.tipus, mintatantervek.tantargyakId, NOW(), NOW(), tantargy_tarifikaciok.munkatarsakId, tantargy_tarifikaciok.szeminarium_munkatarsakId 
      FROM tantargy_tarifikaciok, mintatantervek
      WHERE mintatantervek.szakokId = ${req.body.szakokId}
      AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
      AND mintatantervek.felev = ${req.body.felev}
      AND mintatantervek.tantargyakId= ${req.body.tantargyakId}
      AND tantargy_tarifikaciok.tantargyakId =  ${req.body.tantargyakId}
      AND tantargy_tarifikaciok.felev = ${req.body.felev}
      AND tantargy_tarifikaciok.kepzesi_forma LIKE '${req.body.kepzesi_forma}'`)
      .then(data => {
        sikeres++;
        if (i == req.body.diakok.length - 2) {
          res.send({ message: 'Sikeres!' });
        }
      })
      .catch(err => {
        if (i == req.body.diakok.length - 2 && sikeres == 0) {
          res.status(500).send({
            message:
              err.message || "Hiba lépett fel a beírás közben."
          });
        }
        if (i == req.body.diakok.length - 2 && sikeres != 0) {
          res.send({ message: 'Sikeres!' });
        }

      });

  }

};

exports.kotelezoTantargyakLeckekonyvbeIrasa = (req, res) => {

  if (!req.body.szakokId || !req.body.kezdes_ev || !req.body.felev || !req.body.kepzesi_forma) {
    res.status(400).send({
      message: "Kérem töltsön ki minden kötelező mezőt!"
    });
    return;
  }

  req.body.kezdes_ev = req.body.kezdes_ev + '-09-01';

  sequelize.query(`
    INSERT INTO eredmenyek (diakokId, felev, kredit, tipus, tantargyakId, createdAt, updatedAt, munkatarsakId, szeminarium_munkatarsakId)
    SELECT diakok.id, mintatantervek.felev, mintatantervek.kredit, mintatantervek.tipus, mintatantervek.tantargyakId, NOW(), NOW(), tantargy_tarifikaciok.munkatarsakId, tantargy_tarifikaciok.szeminarium_munkatarsakId 
    FROM diakok, tantargy_tarifikaciok, mintatantervek  LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id 
    WHERE mintatantervek.szakokId = ${req.body.szakokId}
    AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
    AND mintatantervek.felev = ${req.body.felev}
    AND diakok.szakokId = ${req.body.szakokId}
    AND diakok.kepzesi_forma LIKE '${req.body.kepzesi_forma}'
    AND diakok.kezdes_ev = '${req.body.kezdes_ev}'
    AND tantargy_tarifikaciok.tantargyakId = mintatantervek.tantargyakId
    AND tantargy_tarifikaciok.felev = ${req.body.felev}
    AND tantargy_tarifikaciok.kepzesi_forma LIKE '${req.body.kepzesi_forma}'
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

  if (!req.body.tanszekekId || !req.body.kezdes_ev || !req.body.felev || !req.body.kepzesi_forma || !req.body.kepzesi_szint) {
    res.status(400).send({
      message: "Kérem töltsön ki minden mezőt!"
    });
    return;
  }

  if(req.body.kepzesi_szint == 'MSc'){
    req.body.kepzesi_szint1 = 'MSc';
    req.body.kepzesi_szint2 = 'MA';
  }
  if(req.body.kepzesi_szint == 'BSc'){
    req.body.kepzesi_szint1 = 'BSc';
    req.body.kepzesi_szint2 = 'BA';
  }

  req.body.kezdes_ev = req.body.kezdes_ev + '-09-01';
  if (req.body.kepzesi_forma == 'nappali') {
    sequelize.query(`
    INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.body.felev}, mintatantervek.kredit, mintatantervek.tipus, 'nappali', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 0, NOW(), NOW()
          FROM mintatantervek AS mintatantervek  
          LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
          LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
          WHERE mintatantervek.felev = ${req.body.felev}
          AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
          AND tantargyak.tanszekekId = ${req.body.tanszekekId}
          AND (szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint1}' OR szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint2}')
          AND tantargyak.tipus LIKE 'szabadon választható'`);

    sequelize.query(`
    INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.body.felev}, mintatantervek.kredit, mintatantervek.tipus, 'nappali', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 
	  (SELECT SUM(diakok_szama.db_nappali)
      FROM diakok_szama AS diakok_szama, mintatantervek AS mintatantervek2 
      WHERE diakok_szama.kezdes_ev LIKE '${req.body.kezdes_ev}'
       AND diakok_szama.szakokId = mintatantervek2.szakokId
      AND mintatantervek2.felev = ${req.body.felev}
      AND mintatantervek2.kezdes_ev LIKE '${req.body.kezdes_ev}'
      AND mintatantervek2.tantargyakId = mintatantervek.tantargyakId) AS n_osszeg, NOW(), NOW()
      FROM mintatantervek AS mintatantervek  
      LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
      LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
      WHERE mintatantervek.felev = ${req.body.felev}
      AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
      AND tantargyak.tanszekekId = ${req.body.tanszekekId}
      AND (szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint1}' OR szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint2}')
      AND (tantargyak.tipus LIKE 'szakmai felkészítés' OR tantargyak.tipus LIKE 'általános felkészítés');
      `)
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

  if (req.body.kepzesi_forma == 'levelező') {
    sequelize.query(`INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.body.felev}, mintatantervek.kredit, mintatantervek.tipus, 'levelező', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 0, NOW(), NOW()
          FROM mintatantervek AS mintatantervek  
          LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
          LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
          WHERE mintatantervek.felev = ${req.body.felev}
          AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
          AND tantargyak.tanszekekId = ${req.body.tanszekekId}
          AND (szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint1}' OR szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint2}')
          AND tantargyak.tipus LIKE 'szabadon választható'`);

    sequelize.query(`INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.body.felev}, mintatantervek.kredit, mintatantervek.tipus, 'levelező', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 
	  (SELECT SUM(diakok_szama.db_levelezo)
      FROM diakok_szama AS diakok_szama, mintatantervek AS mintatantervek2 
      WHERE diakok_szama.kezdes_ev LIKE '${req.body.kezdes_ev}'
       AND diakok_szama.szakokId = mintatantervek2.szakokId
      AND mintatantervek2.felev = ${req.body.felev}
      AND mintatantervek2.kezdes_ev LIKE '${req.body.kezdes_ev}'
      AND mintatantervek2.tantargyakId = mintatantervek.tantargyakId) AS n_osszeg, NOW(), NOW()
      FROM mintatantervek AS mintatantervek  
      LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
      LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
      WHERE mintatantervek.felev = ${req.body.felev}
      AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
      AND tantargyak.tanszekekId = ${req.body.tanszekekId}
      AND (szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint1}' OR szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint2}')
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

  if (!req.body.tanszekekId || !req.body.kezdes_ev || !req.body.felev || !req.body.kepzesi_forma || !req.body.kepzesi_szint) {
    res.status(400).send({
      message: "Kérem töltsön ki minden mezőt!"
    });
    return;
  }

  req.body.kezdes_ev = req.body.kezdes_ev + '-09-01';
  if (req.body.kepzesi_forma == 'nappali') {
    sequelize.query(`
    INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.body.felev}, mintatantervek.kredit, mintatantervek.tipus, 'nappali', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 0, NOW(), NOW()
          FROM mintatantervek AS mintatantervek  
          LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
          LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
          WHERE mintatantervek.felev = ${req.body.felev}
          AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
          AND tantargyak.tanszekekId = ${req.body.tanszekekId}
          AND szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint}'
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

  if (req.body.kepzesi_forma == 'levelező') {
    sequelize.query(`INSERT INTO tantargy_tarifikaciok 
    (tantargyakId, felev, kredit, tipus, kepzesi_forma, eloadas, szeminarium, laboratoriumi, hallgatok_szama, createdAt, updatedAt)
    SELECT DISTINCT 
    mintatantervek.tantargyakId, ${req.body.felev}, mintatantervek.kredit, mintatantervek.tipus, 'levelező', mintatantervek.eloadas, mintatantervek.gyakorlati, mintatantervek.laboratoriumi, 0, NOW(), NOW()
          FROM mintatantervek AS mintatantervek  
          LEFT OUTER JOIN tantargyak AS tantargyak ON mintatantervek.tantargyakId = tantargyak.id
          LEFT OUTER JOIN szakok AS szakok ON mintatantervek.szakokId = szakok.id
          WHERE mintatantervek.felev = ${req.body.felev}
          AND mintatantervek.kezdes_ev LIKE '${req.body.kezdes_ev}'
          AND tantargyak.tanszekekId = ${req.body.tanszekekId}
          AND szakok.kepzesi_szint LIKE '${req.body.kepzesi_szint}'
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