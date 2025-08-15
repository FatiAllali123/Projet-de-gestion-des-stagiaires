module.exports = (sequelize, DataTypes) => {
  const TraitementDocument = sequelize.define('TraitementDocument', {
    action: {
  type: DataTypes.STRING,
  allowNull: false,
  validate: {
    isIn: {
      args: [['déposé', 'accepté', 'refusé','généré']], // Actions étendues
      msg: 'Action invalide'
    }
  }
},
    date_traitement: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    commentaire: {
      type: DataTypes.TEXT
    },
     acteur_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilisateur',
        key: 'id'
      }
    }
  }, {
    tableName: 'TraitementDocument',
    timestamps: false
  });

  TraitementDocument.associate = (models) => {
    TraitementDocument.belongsTo(models.Document, { foreignKey: 'document_id' });
    TraitementDocument.belongsTo(models.Utilisateur, { foreignKey: 'acteur_id' });
  };

  return TraitementDocument;
};
