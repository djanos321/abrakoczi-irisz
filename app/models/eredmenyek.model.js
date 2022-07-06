module.exports = (sequelize, Sequelize) => {
    const Eredmenyek = sequelize.define("eredmenyek", {
      felev: {
        type: Sequelize.ENUM('1','2','3','4','5','6','7','8'),
        allowNull: false
      },

      kredit: {
        type: Sequelize.INTEGER(2),
        allowNull: false
      },

      tipus: {
        type: Sequelize.ENUM('beszámoló','vizsga'),
        allowNull: false
      },

      pontszam: {
        type: Sequelize.INTEGER(2),
        validate: { 
          min: -1,
          max: 100, },
      },

      vizsgahoz_engedve: {
        type: Sequelize.BOOLEAN(),
        defaultValue: true,
      },

      datum: {
        type: Sequelize.DATEONLY(),
        allowNull: false,
      }
    }, {
        freezeTableName: true,
        indexes: [
          {
              unique: true,
              name: 'diakTantargyDatumFelev',
              fields: 
              ['diakokId', 'tantargyakId', 'datum', 'felev' ]
          }
      ]
    });
  
    return Eredmenyek;
  };