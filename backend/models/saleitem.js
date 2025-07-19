module.exports = (sequelize, DataTypes) => {
  const SaleItem = sequelize.define('SaleItem', {
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    priceAtSale: { // Price of the product at the time of sale (important for historical accuracy)
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    // Foreign keys (saleId, productId) will be added by associations
  });

  SaleItem.associate = models => {
    // Each SaleItem belongs to one Sale
    SaleItem.belongsTo(models.Sale, {
      foreignKey: 'saleId',
      as: 'sale'
    });
    // Each SaleItem belongs to one Product
    SaleItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return SaleItem;
};
