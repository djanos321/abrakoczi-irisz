module.exports = (sequelize, Sequelize) => {
  const Szerepkor = sequelize.define("szerepkor", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    nev: {
      type: Sequelize.STRING
    }
  }, {
      freezeTableName: true
  });

  return Szerepkor;
};