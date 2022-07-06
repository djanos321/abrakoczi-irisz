module.exports = (sequelize, Sequelize) => {
    const Szakok = sequelize.define("szakok", {
      szak_nev: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      kepzesi_szint: {
        type: Sequelize.ENUM('BSc','MSc','BA','MA'),
        allowNull: false
      }
    }, {
        freezeTableName: true,
        indexes: [
          {
              unique: true,
              name: 'szakKepzesiSzint',
              fields: 
              ['szak_nev', 'kepzesi_szint' ]
          }
      ]
    });
  
    return Szakok;
  };