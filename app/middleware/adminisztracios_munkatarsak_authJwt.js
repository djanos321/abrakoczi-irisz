const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const { szerepkor } = require("../models");
const db = require("../models");
const Adminisztracios_munkatarsak = db.munkatarsak;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({
      message: "Nincs token megadva!"
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Jogosulatlan!"
      });
    }
    req.adminisztracios_munkatarsakId = decoded.id;
    next();
  });
};

isAdmin = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "admin") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Adminisztrátori szerepkör szükséges!"
      });
      return;
    });
  });
};

isDepartmentAdmin = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "department_admin") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Moderátori szerepkör szükséges!"
      });
    });
  });
};

isBossOrAdmin = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "boss") {
          next();
          return;
        }

        if (szerepkor[i].nev === "admin") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Vezető- vagy adminisztrátor szerepkör szükséges!"
      });
    });
  });
};

isBossOrAdminOrStudyDepartment = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "boss") {
          next();
          return;
        }

        if (szerepkor[i].nev === "admin") {
          next();
          return;
        }
        if (szerepkor[i].nev === "study_department") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Vezető- vagy adminisztrátor szerepkör szükséges!"
      });
    });
  });
};

isBossOrAdminOrDepartmentAdmin = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "boss") {
          next();
          return;
        }

        if (szerepkor[i].nev === "admin") {
          next();
          return;
        }
        if (szerepkor[i].nev === "department_admin") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Vezető- vagy adminisztrátor szerepkör szükséges!"
      });
    });
  });
};

isBossOrAdminOrDepartmentAdminOrStudyDepartment = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "boss") {
          next();
          return;
        }

        if (szerepkor[i].nev === "admin") {
          next();
          return;
        }
        if (szerepkor[i].nev === "department_admin") {
          next();
          return;
        }
        if (szerepkor[i].nev === "study_department") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Vezető- vagy adminisztrátor szerepkör szükséges!"
      });
    });
  });
};

isAdminOrStudyDepartment = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "admin") {
          next();
          return;
        }
        if (szerepkor[i].nev === "study_department") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Vezető- vagy adminisztrátor szerepkör szükséges!"
      });
    });
  });
};

isStudyDepartment = (req, res, next) => {
  Adminisztracios_munkatarsak.findByPk(req.adminisztracios_munkatarsakId, {
    attributes: { exclude: ['jelszo'] },
  }).then(adminisztracios_munkatarsak => {
    adminisztracios_munkatarsak.getSzerepkors().then(szerepkor => {
      for (let i = 0; i < szerepkor.length; i++) {
        if (szerepkor[i].nev === "study_department") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Vezető- vagy adminisztrátor szerepkör szükséges!"
      });
    });
  });
};


const adminisztracios_munkatarsak_authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isDepartmentAdmin: isDepartmentAdmin,
  isBossOrAdmin: isBossOrAdmin,
  isBossOrAdminOrStudyDepartment: isBossOrAdminOrStudyDepartment,
  isAdminOrStudyDepartment: isAdminOrStudyDepartment,
  isBossOrAdminOrDepartmentAdmin: isBossOrAdminOrDepartmentAdmin,
  isBossOrAdminOrDepartmentAdminOrStudyDepartment: isBossOrAdminOrDepartmentAdminOrStudyDepartment,
  isStudyDepartment: isStudyDepartment,
};
module.exports = adminisztracios_munkatarsak_authJwt;