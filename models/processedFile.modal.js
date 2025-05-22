const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProcessedFile = sequelize.define("processedFile", {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    imageLinks: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    folderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    audioPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  });

  return ProcessedFile;
};
