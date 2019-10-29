const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init({
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide a value for "firstName"'
        },
        notEmpty: {
          msg: 'Please provide a value for "firstName"'
        }
      }
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide a value for "lastName"'
        },
        notEmpty: {
          msg: 'Please provide a value for "lastName"'
        }
      }
    },
    emailAddress: {
      type: Sequelize.STRING,
      allowNull: false,
      isEmail: true,
      validate: {
        notNull: {
          msg: 'Please provide a value for "emailAddress"'
        },
        notEmpty: {
          msg: 'Please provide a value for "emailAddress"'
        }
      }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      len: [8, 16],
    }
  }, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false
      }
    });
  }

  return User
}
