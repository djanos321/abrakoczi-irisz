module.exports = (sequelize, Sequelize) => {
    const Gyakorlat_tarifikaciok = sequelize.define("gyakorlat_tarifikaciok", {

        gyakorlat_nev: {
            type: Sequelize.STRING(100),
            allowNull: false
        },

        felev: {
            type: Sequelize.ENUM('1', '2', '3', '4', '5', '6', '7', '8'),
            allowNull: false,
            validate: {
                notEmpty: true,
            }
        },

        oraszam: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
        },

        idotartam: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            defaultValue: 0,
        },
        
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                name: 'tanszekFelevGyakorlat',
                fields:
                    ['tanszekekId', 'felev', 'gyakorlat_nev']
            }
        ]
    });

    return Gyakorlat_tarifikaciok;
};