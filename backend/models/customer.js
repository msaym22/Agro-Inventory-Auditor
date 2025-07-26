// backend/models/customer.js
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    static associate(models) {
      Customer.hasMany(models.Sale, {
        foreignKey: 'customerId',
        as: 'sales'
      });
      models.Customer.hasMany(models.Payment, {
        foreignKey: 'customerId',
        as: 'payments'
      });
    }
  }
  Customer.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Ensures a name is always provided
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    creditLimit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    outstandingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    lastPurchase: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    digikhataId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customerImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Customer',
  });
  return Customer;
};