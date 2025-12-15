module.exports = (sequelize, DataTypes) => {
  const AccountsPayable = sequelize.define('AccountsPayable', {
    billNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    supplierName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    billDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue'),
      allowNull: false,
      defaultValue: 'pending'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return AccountsPayable;
};
