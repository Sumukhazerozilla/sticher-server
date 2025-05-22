require("dotenv").config();

module.exports = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || "sticher_db",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  dialect: "mariadb",
  logging: false,
};
