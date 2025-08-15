module.exports = (sequelize, DataTypes) => {
  const ResetPasswordRequest = sequelize.define('ResetPasswordRequest', {
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    utilisateur_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'reset_password_request',
    timestamps: false
  });

  ResetPasswordRequest.associate = (models) => {
    ResetPasswordRequest.belongsTo(models.Utilisateur, {
      foreignKey: 'utilisateur_id',
      as: 'utilisateur'
    });
  };

  return ResetPasswordRequest;
};
