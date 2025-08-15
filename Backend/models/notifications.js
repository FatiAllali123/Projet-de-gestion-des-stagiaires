module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    titre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lien_action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    est_lu: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    date_creation: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    date_lecture: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
   
  }, {
    tableName: 'notifications',
    timestamps: false
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.Utilisateur, { foreignKey: 'utilisateur_id' });
    Notification.belongsTo(models.Offre, { foreignKey: 'offre_id', allowNull: true });
    Notification.belongsTo(models.Candidature, { foreignKey: 'candidature_id', allowNull: true });
    Notification.belongsTo(models.Entretien, { foreignKey: 'entretien_id', allowNull: true });
    Notification.belongsTo(models.Stage, { foreignKey: 'stage_id', allowNull: true });
    Notification.belongsTo(models.Document, { foreignKey: 'document_id', allowNull: true });
  };

  return Notification;
};
