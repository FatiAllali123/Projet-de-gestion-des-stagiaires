module.exports = (sequelize, DataTypes) => {
  const Evaluation = sequelize.define('Evaluation', {
    comportement: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    travail_equipe: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    qualite_travail: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    adaptable: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    commentaire: {
      type: DataTypes.STRING,
      allowNull: true  // mettre false si commentaire est obligatoire
    },
    date_evaluation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Evaluation',
    timestamps: false
  });

  Evaluation.associate = (models) => {
    Evaluation.belongsTo(models.Stage, { foreignKey: 'stage_id' });
    Evaluation.belongsTo(models.Utilisateur, { foreignKey: 'encadrant_id' });
  };

  return Evaluation;
};
