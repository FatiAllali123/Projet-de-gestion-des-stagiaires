module.exports = (sequelize, DataTypes) => {
  const Offre = sequelize.define('Offre', {
    titre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    competences_requises: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    duree: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mode_stage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type_stage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entretien_requis: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    statut_offre:{
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'actif' 
    },
    dateDebutApprox: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
     created_at: {
  type: DataTypes.DATE,
  allowNull: false,
  defaultValue: DataTypes.NOW  // met automatiquement la date+heure actuelle à la création
   } 
  }, {
    tableName: 'Offre',
    timestamps: false
  });

  Offre.associate = (models) => {
    Offre.belongsTo(models.Utilisateur, { foreignKey: 'rh_id' });
    Offre.hasMany(models.Candidature, { foreignKey: 'offre_id' });
    Offre.hasMany(models.Notification, { foreignKey: 'offre_id' });
  };

  return Offre;
};