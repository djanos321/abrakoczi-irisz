
module.exports = (sequelize, Sequelize) => {
  const Munkatarsak = sequelize.define("munkatarsak", {
    nev: {
      type: Sequelize.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    email: {
      type: Sequelize.STRING(100),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },

    jelszo: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },

    beosztas: {
      type: Sequelize.ENUM('professzor', 'docens', 'adjunktus', 'oktató', 'tudományos munkatárs', 'kutató', 'asszisztens', 'tanársegéd', 'laboráns', 'gyakornok'),
      allowNull: true,
    },

    kezdes_ev: {
      type: Sequelize.DATEONLY(),
      allowNull: false,
    }
  }, {
    freezeTableName: true
  });

  return Munkatarsak;
};