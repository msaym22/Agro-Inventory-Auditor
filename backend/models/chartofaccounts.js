module.exports = (sequelize, DataTypes) => {
  const ChartOfAccounts = sequelize.define('ChartOfAccounts', {
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accountType: {
      type: DataTypes.ENUM('asset', 'liability', 'equity', 'revenue', 'expense'),
      allowNull: false
    },
    normalBalance: {
      type: DataTypes.ENUM('debit', 'credit'),
      allowNull: false
    },
    parentAccount: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return ChartOfAccounts;
};
