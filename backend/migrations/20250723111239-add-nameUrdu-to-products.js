'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Products', 'nameUrdu', {
      type: Sequelize.STRING,
      allowNull: true, // Or false, depending on if it's mandatory
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'nameUrdu');
  }
};