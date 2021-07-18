require('dotenv').config();

const Sequelize = require('sequelize');

const sequelize = new Sequelize("my_tech_blog_db", "admin", "Createyour1", {
      host: "database-1.cohesbi5e4hv.us-east-2.rds.amazonaws.com",
      dialect: 'mysql',
      dialectOptions: {
        decimalNumbers: true,
      },
    });

module.exports = sequelize;
