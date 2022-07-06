module.exports = (sequelize, Sequelize) => {
    const Tantargy_tarifikaciok = sequelize.define("tantargy_tarifikaciok", {

        felev: {
            type: Sequelize.ENUM('1', '2', '3', '4', '5', '6', '7', '8'),
            allowNull: false,
            validate: {
                notEmpty: true,
            }
        },

        kredit: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
        },

        tipus: {
            type: Sequelize.ENUM('beszámoló','vizsga'),
            allowNull: false,            validate: {
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

        hallgatok_szama: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            defaultValue: 0,
        },

        eloadas: {
            type: Sequelize.DOUBLE(),
            allowNull: false,
            defaultValue: 0,
        },

        szeminarium: {
            type: Sequelize.DOUBLE(),
            allowNull: false,
            defaultValue: 0,
        },
        
        laboratoriumi: {
            type: Sequelize.DOUBLE(),
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                name: 'egyedi',
                fields: 
                ['tantargyakId', 'felev', 'kepzesi_forma', 'munkatarsakId', 'szeminarium_munkatarsakId']
            }
        ]
    });

    return Tantargy_tarifikaciok;
};