module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    budgetedAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    actualAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    variance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  Budget.associate = models => {
    Budget.belongsTo(models.ChartOfAccounts, {
      foreignKey: 'accountNumber',
      targetKey: 'accountNumber',
      as: 'account'
    });
  };

  return Budget;
};
