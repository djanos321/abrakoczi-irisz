module.exports = (sequelize, Sequelize) => {
    const Tarifikacios_valtozok = sequelize.define("tarifikacios_valtozok", {
        onallo_munka: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        dolgozatjavitas_eloadas: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        dolgozatjavitas_szeminarium: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        dolgozatjavitas_levelezo: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        vizsga_konzultacio: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        beszamolo: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        vizsga: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        bsc2: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        bsc3: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        bsc4: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        msc1: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
        msc2: {
            type: Sequelize.DOUBLE(),
            allowNull: false
        },
    }, {
        freezeTableName: true
    });

    return Tarifikacios_valtozok;
};