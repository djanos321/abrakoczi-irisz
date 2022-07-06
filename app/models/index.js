const abKonfiguracio = require("../config/db.config.js");
const Sequelize = require("sequelize", "sequelize-fn");
const sequelize = new Sequelize(abKonfiguracio.AB, abKonfiguracio.FELHASZNALO, abKonfiguracio.JELSZO, {
  host: abKonfiguracio.HOST,
  dialect: abKonfiguracio.nyelv,
  operatorsAliases: false,
  pool: {
    max: abKonfiguracio.pool.max,
    min: abKonfiguracio.pool.min,
    acquire: abKonfiguracio.pool.acquire,
    idle: abKonfiguracio.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

//Végleges modellek
db.tanszekek = require("./tanszekek.model.js")(sequelize, Sequelize);
db.szakok = require("./szakok.model.js")(sequelize, Sequelize);
db.tantargyak = require("./tantargyak.model.js")(sequelize, Sequelize);
db.munkatarsak = require("./munkatarsak.model.js")(sequelize, Sequelize);
db.diakok = require("./diakok.model.js")(sequelize, Sequelize);
db.diakok_szama = require("./diakok_szama.model.js")(sequelize, Sequelize);
db.mintatantervek = require("./mintatantervek.model.js")(sequelize, Sequelize);
db.eredmenyek = require("./eredmenyek.model.js")(sequelize, Sequelize);
db.tarifikacios_valtozok = require("./tarifikacios_valtozok.model.js")(sequelize, Sequelize);
db.tantargy_tarifikaciok = require("./tantargy_tarifikaciok.model.js")(sequelize, Sequelize);
db.gyakorlat_tarifikaciok = require("./gyakorlat_tarifikaciok.model.js")(sequelize, Sequelize);
db.szakdolgozat_evfolyammunka_tarifikaciok = require("./szakdolgozat_evfolyammunka_tarifikaciok.model.js")(sequelize, Sequelize);

db.szerepkor = require("../models/szerepkor.model.js")(sequelize, Sequelize);



//Kapcsolatok
db.tanszekek.hasMany(db.szakok, { as: "szakok" });
db.szakok.belongsTo(db.tanszekek, {
  foreignKey: "tanszekekId",
  as: "tanszekek",
});

db.tanszekek.hasMany(db.tantargyak, { as: "tantargyak" });
db.tantargyak.belongsTo(db.tanszekek, {
  foreignKey: "tanszekekId",
  as: "tanszekek",
});

db.tanszekek.hasMany(db.munkatarsak, { as: "munkatarsak" });
db.munkatarsak.belongsTo(db.tanszekek, {
  foreignKey: "tanszekekId",
  as: "tanszekek",
});

db.szakok.hasMany(db.diakok, { as: "diakok" });
db.diakok.belongsTo(db.szakok, {
  foreignKey: "szakokId",
  as: "szakok",
});

db.szakok.hasMany(db.diakok_szama, { as: "diakok_szama" });
db.diakok_szama.belongsTo(db.szakok, {
  foreignKey: "szakokId",
  as: "szakok",
});

db.szakok.hasMany(db.mintatantervek, { as: "mintatantervek" });
db.mintatantervek.belongsTo(db.szakok, {
  foreignKey: "szakokId",
  as: "szakok",
});

db.tantargyak.hasMany(db.mintatantervek, { as: "mintatantervek" });
db.mintatantervek.belongsTo(db.tantargyak, {
  foreignKey: "tantargyakId",
  as: "tantargyak",
});

db.tantargyak.hasMany(db.eredmenyek, { as: "eredmenyek" });
db.eredmenyek.belongsTo(db.tantargyak, {
  foreignKey: "tantargyakId",
  as: "tantargyak",
});

db.munkatarsak.hasMany(db.eredmenyek, { as: "eloadas_eredmenyek" });
db.eredmenyek.belongsTo(db.munkatarsak, {
  foreignKey: "munkatarsakId",
  as: "eloadas_munkatarsak",
});

db.munkatarsak.hasMany(db.eredmenyek, { as: "szeminarium_eredmenyek" });
db.eredmenyek.belongsTo(db.munkatarsak, {
  foreignKey: "szeminarium_munkatarsakId",
  as: "szeminarium_munkatarsak",
});

db.diakok.hasMany(db.eredmenyek, { as: "eredmenyek" });
db.eredmenyek.belongsTo(db.diakok, {
  foreignKey: "diakokId",
  as: "diakok",
});

//Tarifikáció (Tantárgy)

db.tantargyak.hasMany(db.tantargy_tarifikaciok, { as: "tantargy_tarifikaciok" });
db.tantargy_tarifikaciok.belongsTo(db.tantargyak, {
  foreignKey: "tantargyakId",
  as: "tantargyak",
});

db.munkatarsak.hasMany(db.tantargy_tarifikaciok, { as: "eloadas_tantargy_tarifikaciok" });
db.tantargy_tarifikaciok.belongsTo(db.munkatarsak, {
  foreignKey: "munkatarsakId",
  as: "eloadas_munkatarsak",
});

db.munkatarsak.hasMany(db.tantargy_tarifikaciok, { as: "szeminarium_tantargy_tarifikaciok" });
db.tantargy_tarifikaciok.belongsTo(db.munkatarsak, {
  foreignKey: "szeminarium_munkatarsakId",
  as: "szeminarium_munkatarsak",
});


//Gyakorlat Tarifikáció

db.munkatarsak.hasMany(db.gyakorlat_tarifikaciok, { as: "gyakorlat_tarifikaciok" });
db.gyakorlat_tarifikaciok.belongsTo(db.munkatarsak, {
  foreignKey: "munkatarsakId",
  as: "munkatarsak",
});

db.tanszekek.hasMany(db.gyakorlat_tarifikaciok, { as: "gyakorlat_tarifikaciok" });
db.gyakorlat_tarifikaciok.belongsTo(db.tanszekek, {
  foreignKey: "tanszekekId",
  as: "tanszekek",
});


//Tarifikáció (Szakdolgozat, évfolyammunka)

db.munkatarsak.hasMany(db.szakdolgozat_evfolyammunka_tarifikaciok, { as: "szakdolgozat_evfolyammunka_tarifikaciok" });
db.szakdolgozat_evfolyammunka_tarifikaciok.belongsTo(db.munkatarsak, {
  foreignKey: "munkatarsakId",
  as: "munkatarsak",
});

db.szakok.hasMany(db.szakdolgozat_evfolyammunka_tarifikaciok, { as: "szakdolgozat_evfolyammunka_tarifikaciok" });
db.szakdolgozat_evfolyammunka_tarifikaciok.belongsTo(db.szakok, {
  foreignKey: "szakokId",
  as: "szakok",
});

//Belépés

db.szerepkor.belongsToMany(db.diakok, {
  through: "diakok_szerepkor",
  foreignKey: "szerepkorId",
  otherKey: "diakokId"
});

db.diakok.belongsToMany(db.szerepkor, {
  through: "diakok_szerepkor",
  foreignKey: "diakokId",
  otherKey: "szerepkorId"
});

db.szerepkor.belongsToMany(db.munkatarsak, {
  through: "munkatarsak_szerepkor",
  foreignKey: "szerepkorId",
  otherKey: "munkatarsakId"
});
db.munkatarsak.belongsToMany(db.szerepkor, {
  through: "munkatarsak_szerepkor",
  foreignKey: "munkatarsakId",
  otherKey: "szerepkorId"
});

db.SZEREPKOR = ["student", "admin", "department_admin", "boss", "teacher", "study_department"];

module.exports = db;