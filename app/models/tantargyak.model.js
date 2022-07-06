module.exports = (sequelize, Sequelize) => {
  const Tantargyak = sequelize.define("tantargyak", {
    tantargy_nev: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    tipus: {
      type: Sequelize.ENUM('általános felkészítés', 'általános felkészítés osztott', 'szakmai felkészítés',
        'szakmai felkészítés osztott', 'szabadon választható', 'szabadon választható osztott', 'gyakorlat', 'fakultatív'),
      allowNull: true
    }
  }, {
    freezeTableName: true,
    indexes: [
      {
          unique: true,
          name: 'nevTipusTanszek',
          fields: 
          ['tantargy_nev', 'tipus', 'tanszekekId' ]
      }
  ]
  });

  return Tantargyak;
};
