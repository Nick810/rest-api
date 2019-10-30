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
      validate: {
        notNull: {
          msg: 'Please provide a value for "emailAddress"'
        },
        notEmpty: {
          msg: 'Please provide a value for "emailAddress"'
        },
        isEmail: {
          msg: 'Please use the correct email format (example@email.com)'
        },
      }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Please provide a value for "password"'
        },
        notEmpty: {
          msg: 'Please provide a value for "password"'
        },
        len: {
          args: [8, 16],
          msg: "Email address must be between 8 and 16 characters in length"
        }
      }
    }
  }, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
      foreignKey: {
        fieldName: 'userId',
        allowNull: false
      }
    })
  }

  return User
}
