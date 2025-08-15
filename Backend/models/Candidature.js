module.exports = (sequelize, DataTypes) => {
  const Candidature = sequelize.define('Candidature', {
    statut_candidature: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date_creation: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    cv: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lettre_motivation: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'Candidature',
    timestamps: false
  });

  Candidature.associate = (models) => {
    Candidature.belongsTo(models.Offre, { 
      foreignKey: 'offre_id',
      allowNull: false
    });
  
    Candidature.belongsTo(models.Utilisateur, { foreignKey: 'candidat_id', as: 'Candidat', allowNull: false });
    Candidature.hasMany(models.Entretien, { foreignKey: 'candidature_id' });
    Candidature.hasOne(models.Stage, { foreignKey: 'candidature_id' });
    Candidature.hasMany(models.PropositionDates, { foreignKey: 'candidature_id' , as: 'PropositionsDates'});
     Candidature.hasMany(models.Document, {
    foreignKey: 'candidature_id',
    as: 'Documents'
  });
  };

  return Candidature;
};