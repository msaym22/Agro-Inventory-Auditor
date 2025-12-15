module.exports = (sequelize, DataTypes) => {
  const AuditTrail = sequelize.define('AuditTrail', {
    tableName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    recordId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false
    },
    oldValues: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newValues: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return AuditTrail;
};
