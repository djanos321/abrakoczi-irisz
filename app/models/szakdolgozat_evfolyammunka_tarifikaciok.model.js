module.exports = (sequelize, Sequelize) => {
    const Szakdolgozat_evfolyammunka_tarifikaciok = sequelize.define("szakdolgozat_evfolyammunka_tarifikaciok", {

        b2: {
            type: Sequelize.INTEGER(2),
            allowNull: false,
            defaultValue: 0,
        },

        b3: {
            type: Sequelize.INTEGER(2),
            allowNull: false,
            defaultValue: 0,
        },

        b4: {
            type: Sequelize.INTEGER(2),
            allowNull: false,
            defaultValue: 0,
        },

        m1: {
            type: Sequelize.INTEGER(2),
            allowNull: false,
            defaultValue: 0,
        },

        m2: {
            type: Sequelize.INTEGER(2),
            allowNull: false,
            defaultValue: 0,
        },
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                name: 'munkatarsSzak',
                fields: ['munkatarsakId', 'szakokId']
            }
        ]
    });

    return Szakdolgozat_evfolyammunka_tarifikaciok;
};