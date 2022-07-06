module.exports = (sequelize, Sequelize) => {
  const Mintatantervek = sequelize.define("mintatantervek", {
    felev: {
      type: Sequelize.ENUM('1', '2', '3', '4', '5', '6', '7', '8'),
      allowNull: false
    },
    eloadas: {
      type: Sequelize.INTEGER(2),
      allowNull: false,
      defaultValue: 0,
    },
    laboratoriumi: {
      type: Sequelize.INTEGER(2),
      allowNull: false,
      defaultValue: 0,
    },
    gyakorlati: {
      type: Sequelize.INTEGER(2),
      allowNull: false,
      defaultValue: 0,
    },
    onallo_munka: {
      type: Sequelize.INTEGER(2),
      allowNull: false,
      defaultValue: 0,
    },
    kredit: {
      type: Sequelize.INTEGER(2),
      allowNull: false,
      defaultValue: 0,
    },
    tipus: {
      type: Sequelize.ENUM('beszámoló', 'vizsga'),
      allowNull: false
    },
    kezdes_ev: {
      type: Sequelize.DATEONLY(),
      allowNull: false,
    }
  }, {
    freezeTableName: true,
    indexes: [
      {
          unique: true,
          name: 'szakTantargyFelevKezdesEv',
          fields: 
          ['szakokId', 'tantargyakId', 'felev', 'kezdes_ev' ]
      }
  ]
  });

  return Mintatantervek;
};