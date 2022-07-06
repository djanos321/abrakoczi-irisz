const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

//Új
const path = __dirname + '/app/views/';

const app = express();

//Új
app.use(express.static(path));

var corsOptions = {
  origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Az index.js létrehozása után adtam hozzá
const db = require("./app/models");
const { sequelize } = require("./app/models");
const Szerepkor = db.szerepkor;
db.sequelize.sync();
// db.sequelize.sync({ force: true }).then(() => {
// console.log("Az AB eldobása és újraszinkronizálása.");
// szerepkorokLetrehozasa();
// });

//Minden évben automatikusan létrehozza az a diákok száma sorokat
//diakokSzamaEvent();

//Ha szeptember 1 előtt állítjuk be a rendszert. ELŐSZÖR A SZAKOKAT KELL FELVENNI A TÁBLÁBA
//diakokSzamaSzeptemberElott();

//Ha szeptember 1 után állítjuk be a rendszert. ELŐSZÖR A SZAKOKAT KELL FELVENNI A TÁBLÁBA
//diakokSzamaSzeptemberElott();

//Diákok számlálására trigger
//diakokSzamaTrigger();

// egy egyszerű útvonal
app.get("/", (req, res) => {
  res.sendFile(path + "index.html");
});

// A függvények létrehozása után adtam hozzá, HOZZÁ KELL ADNI MIDEN EGYES ÚJ ROUTE-OT
require("./app/routes/tanszekek.routes")(app);

require("./app/routes/szakok.admin.routes")(app);
require("./app/routes/szakok.tanszek.routes")(app);

require("./app/routes/tantargyak.admin.routes")(app);
require("./app/routes/tantargyak.tanszek.routes")(app);

require("./app/routes/munkatarsak.admin.routes")(app);
require("./app/routes/tanarok.tanszek.routes")(app);

require("./app/routes/diakok.admin.routes")(app);
require("./app/routes/diakok.tanszek.routes")(app);
require("./app/routes/diakok.tanarok.routes")(app);

require('./app/routes/diakok_szama.admin.routes')(app);
require('./app/routes/diakok_szama.tanszek.routes')(app);

require("./app/routes/mintatantervek.admin.routes")(app);
require("./app/routes/mintatantervek.tanszek.routes")(app);
require("./app/routes/mintatantervek.diakok.routes")(app);

require("./app/routes/eredmenyek.admin.routes")(app);
require("./app/routes/eredmenyek.diakok.routes")(app);
require("./app/routes/eredmenyek.tanarok.routes")(app);
require("./app/routes/eredmenyek.tanszek.routes")(app);
require("./app/routes/eredmenyek.tanulmanyi_osztaly.routes")(app);

require("./app/routes/tarifikacios_valtozok.routes")(app);
require("./app/routes/tarifikacios_valtozok-tanar.routes")(app);

require("./app/routes/tantargy_tarifikaciok.admin.routes")(app);
require("./app/routes/tantargy_tarifikaciok.tanszek.routes")(app);
require("./app/routes/tantargy_tarifikaciok.tanar.routes")(app);

require('./app/routes/diakok_auth.routes')(app);
require('./app/routes/adminisztracios_munkatarsak_auth.routes')(app);
require('./app/routes/tanarok_auth.routes')(app);

require('./app/routes/esemenyek.routes')(app);
require('./app/routes/esemenyek-tanszek.routes')(app);


//require("./app/routes/szakok_diakok.tanarok.routes")(app);

//require("./app/routes/egyeni_tanterv.diakok.routes")(app);


require("./app/routes/szakdolgozat_evfolyammunka_tarifikaciok.admin.routes")(app);
require("./app/routes/szakdolgozat_evfolyammunka_tarifikaciok.tanszek.routes")(app);
require("./app/routes/szakdolgozat_evfolyammunka_tarifikacio.tanar.routes")(app);


// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`A szerver az ${PORT} porton fut.`);
});

//Ha először telepítjük a rendszert automatikusan létrehozza a szerepköröket az adatbázisban
function szerepkorokLetrehozasa() {
  Szerepkor.create({
    id: 1,
    nev: "student"
  });

  Szerepkor.create({
    id: 2,
    nev: "department_admin"
  });

  Szerepkor.create({
    id: 3,
    nev: "admin"
  });

  Szerepkor.create({
    id: 4,
    nev: "boss"
  });

  Szerepkor.create({
    id: 5,
    nev: "teacher"
  });

  Szerepkor.create({
    id: 6,
    nev: "study_department"
  });
}

//Ha szeptember 1 előtt állítjuk be a rendszert. ELŐSZÖR A SZAKOKAT KELL FELVENNI A TÁBLÁBA

function diakokSzamaSzeptemberElott() {
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW())-1,'-09-01'), NOW(), NOW()
  FROM szakok`);
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW())-2,'-09-01'), NOW(), NOW()
  FROM szakok`);
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW())-3,'-09-01'), NOW(), NOW()
  FROM szakok WHERE szakok.kepzesi_szint LIKE 'BSc'`);
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW())-4,'-09-01'), NOW(), NOW()
  FROM szakok WHERE szakok.kepzesi_szint LIKE 'BSc'`)
}

//Ha szeptember 1 után állítjuk be a rendszert. ELŐSZÖR A SZAKOKAT KELL FELVENNI A TÁBLÁBA

function diakokSzamaSzeptemberUtan() {
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW()),'-09-01'), NOW(), NOW()
  FROM szakok`);
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW())-1,'-09-01'), NOW(), NOW()
  FROM szakok`);
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW())-2,'-09-01'), NOW(), NOW()
  FROM szakok WHERE szakok.kepzesi_szint LIKE 'BSc'`);
  sequelize.query(`INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
  SELECT szakok.id, CONCAT(YEAR(NOW())-3,'-09-01'), NOW(), NOW()
  FROM szakok WHERE szakok.kepzesi_szint LIKE 'BSc'`)
}

function diakokSzamaTrigger() {
  sequelize.query(`
  CREATE TRIGGER diakokSzamaNoveles AFTER INSERT ON diakok
         FOR EACH ROW
         BEGIN
             IF NEW.kepzesi_forma LIKE "nappali" THEN
                 INSERT IGNORE INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt)
                 SELECT szakok.id, CONCAT(NEW.kezdes_ev,'-09-01'), NOW(), NOW() FROM szakok;
                 UPDATE diakok_szama SET diakok_szama.db_nappali = diakok_szama.db_nappali + 1 WHERE diakok_szama.szakokId = NEW.szakokId AND diakok_szama.kezdes_ev = NEW.kezdes_ev;
             ELSEIF NEW.kepzesi_forma LIKE "levelező" THEN
              INSERT IGNORE INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt) 
              SELECT szakok.id, CONCAT(NEW.kezdes_ev,'-09-01'), NOW(), NOW() FROM szakok;
              UPDATE diakok_szama SET diakok_szama.db_levelezo = diakok_szama.db_levelezo + 1 WHERE diakok_szama.szakokId = NEW.szakokId AND diakok_szama.kezdes_ev = NEW.kezdes_ev;
             END IF;
         END;`);
  sequelize.query(`
  CREATE TRIGGER diakokSzamaCsokkentes AFTER DELETE ON diakok
         FOR EACH ROW
         BEGIN
             IF OLD.kepzesi_forma LIKE "nappali" THEN
                 UPDATE diakok_szama SET diakok_szama.db_nappali = diakok_szama.db_nappali - 1, diakok_szama.updatedAt = NOW() WHERE diakok_szama.szakokId = OLD.szakokId AND  diakok_szama.kezdes_ev = OLD.kezdes_ev;
             ELSEIF OLD.kepzesi_forma LIKE "levelező" THEN
              UPDATE diakok_szama SET diakok_szama.db_levelezo = diakok_szama.db_levelezo - 1, diakok_szama.updatedAt = NOW() WHERE diakok_szama.szakokId = OLD.szakokId AND  diakok_szama.kezdes_ev = OLD.kezdes_ev;
             END IF;
         END;`);
  sequelize.query(`
         CREATE TRIGGER diakokSzamaValtozas AFTER UPDATE ON diakok
          FOR EACH ROW
          BEGIN
              IF (OLD.kepzesi_forma LIKE "nappali" AND NEW.kepzesi_forma LIKE "levelező") THEN
                UPDATE diakok_szama SET diakok_szama.db_nappali = diakok_szama.db_nappali - 1, diakok_szama.db_levelezo = diakok_szama.db_levelezo + 1, diakok_szama.updatedAt = NOW() WHERE diakok_szama.szakokId = OLD.szakokId AND  diakok_szama.kezdes_ev = OLD.kezdes_ev;
              ELSEIF (OLD.kepzesi_forma LIKE "levelező" AND NEW.kepzesi_forma LIKE "nappali") THEN
                UPDATE diakok_szama SET diakok_szama.db_nappali = diakok_szama.db_nappali + 1, diakok_szama.db_levelezo = diakok_szama.db_levelezo - 1, diakok_szama.updatedAt = NOW() WHERE diakok_szama.szakokId = OLD.szakokId AND  diakok_szama.kezdes_ev = OLD.kezdes_ev;
              END IF;
          END;`);
}

function diakokSzamaEvent() {
  sequelize.query(`
CREATE EVENT diakSzamolas
ON SCHEDULE EVERY 1 YEAR
STARTS '2021-07-01 00:00:00'
DO BEGIN
    INSERT INTO diakok_szama (szakokId, kezdes_ev, createdAt, updatedAt) 
    SELECT szakok.id, CONCAT(YEAR(NOW()),'-09-01'), NOW(), NOW() FROM szakok;
END;`);
}