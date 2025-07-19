module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact: DataTypes.STRING,
    address: DataTypes.TEXT,
    creditLimit: DataTypes.FLOAT,
    outstandingBalance: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    lastPurchase: DataTypes.DATE,
    digikhataId: DataTypes.STRING,
    customerImage: DataTypes.STRING // Added for customer receipt/profile image
  });

  Customer.associate = models => {
    Customer.hasMany(models.Sale, {
      foreignKey: 'customerId',
      as: 'purchases'
    });
  };

  return Customer;
};
