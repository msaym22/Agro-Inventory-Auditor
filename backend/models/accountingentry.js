module.exports = (sequelize, DataTypes) => {
  const AccountingEntry = sequelize.define('AccountingEntry', {
    type: {
      type: DataTypes.ENUM('revenue', 'expense'),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    entryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    source: {
      type: DataTypes.ENUM('manual', 'auto'),
      allowNull: false,
      defaultValue: 'manual'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  AccountingEntry.associate = models => {
    AccountingEntry.belongsTo(models.Sale, {
      foreignKey: 'saleId',
      as: 'sale'
    });
  };

  return AccountingEntry;
};


