module.exports = (sequelize, DataTypes) => {
  const PropositionDates = sequelize.define('PropositionDates', {
    date_debut_proposee: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    date_fin_proposee: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    statut: {  // en attente, acceptée, refusée
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en attente'
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date_proposition: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
      date_traitement: {
      type: DataTypes.DATE,
      allowNull: true // Null tant que non traité
    
    }
  }, {
    tableName: 'PropositionDates',
    timestamps: false
  });

  PropositionDates.associate = (models) => {
    PropositionDates.belongsTo(models.Candidature, { foreignKey: 'candidature_id', allowNull: false,  as: 'Candidature' });
  };

  return PropositionDates;
};
