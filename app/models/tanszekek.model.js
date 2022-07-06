module.exports = (sequelize, Sequelize) => {
    const Tanszekek = sequelize.define("tanszekek", {
      tanszek_nev: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      tanszek_tipus: {
        type: Sequelize.ENUM('tanszék','tanszéki csoport'),
        allowNull: false
      }
    }, {
        freezeTableName: true,
    });
  
    return Tanszekek;
  };