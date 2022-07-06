const db = require("../models");
const Tarifikacios_valtozok = db.tarifikacios_valtozok;
const Op = db.Sequelize.Op;


// Új érték létrehozása és mentése
exports.letrehozas = (req, res) => {
  // Kérés validálása
  if (!req.body.onallo_munka || !req.body.dolgozatjavitas_eloadas || !req.body.dolgozatjavitas_szeminarium  
    || !req.body.dolgozatjavitas_levelezo || !req.body.vizsga_konzultacio
    || !req.body.beszamolo || !req.body.vizsga || !req.body.bsc2 || !req.body.bsc3 
    || !req.body.bsc4 || !req.body.msc1 || !req.body.msc2) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }

  // Új változó létrehozása
  const tarifikacios_valtozok = {
    onallo_munka: req.body.onallo_munka,
    dolgozatjavitas_eloadas: req.body.dolgozatjavitas_eloadas,
    dolgozatjavitas_szeminarium: req.body.dolgozatjavitas_szeminarium,
    dolgozatjavitas_levelezo: req.body.dolgozatjavitas_levelezo,
    vizsga_konzultacio: req.body.vizsga_konzultacio,
    beszamolo: req.body.beszamolo,
    vizsga: req.body.vizsga,
    bsc2: req.body.bsc2,
    bsc3: req.body.bsc3,
    bsc4: req.body.bsc4,
    msc1: req.body.msc1,
    msc2: req.body.msc2,
  };

  // Új változó mentése az adatbázisba
  Tarifikacios_valtozok.create(tarifikacios_valtozok)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba! Az adott tarifikációs típushoz már tartozik érték!"
      });
    });
};

//Minden érték listázása lapozás nélkül
exports.tarifikaciosValtozokListazasa = (req, res) => {
  Tarifikacios_valtozok.findAll({
    attributes: { exclude: ['createdAt', 'updatedAt'] },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Hiba lépett fel az értékek keresése közben."
      });
    });
};
// Érték keresése azonosítója alapján
exports.egyTarifikaciosValtozoListazasa = (req, res) => {
  const id = req.params.id;
  Tarifikacios_valtozok.findByPk(id, {
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az értékek keresése közben, az érték azonosítója: " + id
      });
    });
};

// Érték módosítása azonosítója alapján
exports.frissites = (req, res) => {
  
  if (!req.body.onallo_munka || !req.body.dolgozatjavitas_eloadas || !req.body.dolgozatjavitas_szeminarium  
    || !req.body.dolgozatjavitas_levelezo || !req.body.vizsga_konzultacio
    || !req.body.beszamolo || !req.body.vizsga || !req.body.bsc2 || !req.body.bsc3 
    || !req.body.bsc4 || !req.body.msc1 || !req.body.msc2) {
    res.status(400).send({
      message: "A mező tartalma nem lehet üres!"
    });
    return;
  }
  const id = req.params.id;
  Tarifikacios_valtozok.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Az érték sikeresen frissítve lett."
        });
      } else {
        res.send({
          message: `Nem lehet az értéket frissíteni, azonosító: ${id}. Lehetséges, hogy az érték nem található vagy üres a lekérdezés mező!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az érték frissítése közben, azonosító: " + id
      });
    });
};

// Érték törlése azonosítója alapján
exports.torles = (req, res) => {
  const id = req.params.id;
  Tarifikacios_valtozok.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Az érték sikeresen törölve lett!"
        });
      } else {
        res.send({
          message: `Nem sikerült az érték törlése, azonsító:${id}. Lehetséges, hogy az érték nem található!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Hiba lépett fel az érték törlése közben, azonosító: " + id
      });
    });
};

