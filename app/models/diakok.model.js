
module.exports = (sequelize, Sequelize) => {
  const Diakok = sequelize.define("diakok", {
    diak_nev: {
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
    
    kepzesi_forma: {
      type: Sequelize.ENUM('nappali', 'levelező'),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    kezdes_ev: {
      type: Sequelize.DATEONLY(),
      allowNull: false,
    }
  }, {
    freezeTableName: true
  });

  return Diakok;
};