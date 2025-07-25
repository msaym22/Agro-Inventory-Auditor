// backend/models/payment.js
module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      paymentMethod: {
        type: DataTypes.STRING, // e.g., 'cash', 'card', 'bank_transfer'
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Foreign Keys will be added by associations
    });
  
    Payment.associate = (models) => {
      Payment.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer',
        onDelete: 'CASCADE',
      });
      // A payment can optionally be linked to a specific sale
      Payment.belongsTo(models.Sale, {
        foreignKey: 'saleId',
        as: 'sale',
        allowNull: true,
        onDelete: 'SET NULL',
      });
    };
  
    return Payment;
  };
  