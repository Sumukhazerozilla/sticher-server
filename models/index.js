const { Sequelize } = require("sequelize");
const dbConfig = require("../config/database");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: {
      connectTimeout: 20000,
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Initialize models
db.ProcessedFile = require("./processedFile.modal")(sequelize);

module.exports = db;
