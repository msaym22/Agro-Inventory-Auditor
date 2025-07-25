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
      allowNull: false, // Ensure this matches your DB. If frontend sends empty, it fails.
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true, // If it's optional
      // unique: true, // If this is true in DB and you send duplicate, it will fail
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
      allowNull: true, // If it's optional
      // unique: true, // If this is true in DB and you send duplicate, it will fail
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