module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    saleDate: { // Changed from 'date' to 'saleDate' for clarity and consistency
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    discount: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'credit'),
      defaultValue: 'cash'
    },
    paymentStatus: {
      type: DataTypes.ENUM('paid', 'pending', 'partial'),
      defaultValue: 'paid'
    },
    notes: DataTypes.TEXT, // Added notes field
    receiptImage: DataTypes.STRING // For storing path to receipt image
  });

  Sale.associate = models => {
    // A Sale belongs to one Customer
    Sale.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    // A Sale has many SaleItems
    Sale.hasMany(models.SaleItem, {
      foreignKey: 'saleId',
      as: 'items' // 'items' will now refer to associated SaleItem records
    });
  };

  return Sale;
};
