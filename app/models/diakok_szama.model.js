module.exports = (sequelize, Sequelize) => {
    const Diakok_szama = sequelize.define("diakok_szama", {

        db_nappali: {
            type: Sequelize.INTEGER(2),
            allowNull: false,
            defaultValue: 0,
        },

        db_levelezo: {
            type: Sequelize.INTEGER(2),
            allowNull: false,
            defaultValue: 0,
        },

        kezdes_ev: {
            type: Sequelize.DATEONLY(),
            allowNull: false,
        }

    }, {
        freezeTableName: true,
        indexes: [
            {
                name: 'szakokKezdesEv',
                unique: true,
                fields: ['szakokId', 'kezdes_ev']
            }
        ]
    });

    return Diakok_szama;
};