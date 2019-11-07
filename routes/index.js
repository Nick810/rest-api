const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const db = require('../db');
const router = express.Router();
const { User, Course } = db.models;

// ---- Helper Functions ---- //
// A function to handle async/await for each route.
function asyncHandler(cb) {
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error) {
      res.status(500).send(error);
    }
  }
}

// A function to check if the object is empty or not. If yes, return true. Otherwise, return false.
function isEmpty(obj) {
  for (let key in obj) {
    if(obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

// A function to instantitate an error object, set the error's status code and messages.
function instantiateError(statusCode, errorMessage) {
  const error = new Error;
  error.status = statusCode;
  error.message = errorMessage;
  return error;
}

// A function to authorize a user.
const authenticateUser = async(req, res, next) => {
  const credentials = auth(req)
  let message;

  if (credentials) {
    const user = await User.findAll({ where: { emailAddress : credentials.name } });

    if (user.length > 0) {
      const authenticated = bcryptjs.compareSync(credentials.pass, user[0].dataValues.password);

      if (authenticated) {
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${credentials.name}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = 'Authorization header not found';
  }

  if (message !== undefined) {
    console.warn(message);
    res.status(401).json({ message: 'Access Denied' });
  } else {
    next();
  }
}

// Returns the currently authenticated users' first and last name respectively.
router.get('/users', authenticateUser, (req, res) => {
  const user = req.currentUser;

  res.json({
    firstName: user[0].dataValues.firstName,
    lastName: user[0].dataValues.lastName
  })
});

// Create a user, hash user's password prior to creation. If email is already taken, raise an error.
router.post('/users', asyncHandler(async(req, res, next) => {
  try {
    if (req.body.emailAddress) {
      const newUser = req.body;
      
      if (!/^[^@]+@[^@.]+\.[a-z]+$/i.test(newUser.emailAddress) && newUser.password === '') {
        const err = instantiateError(400, ['Please use the correct email format (example@email.com)',
                                           'Please provide a value for "password"'
                                          ]);
        next(err);
      } else if (!/^[^@]+@[^@.]+\.[a-z]+$/i.test(newUser.emailAddress)) {
        const err = instantiateError(400, ['Please use the correct email format (example@email.com)']);
        next(err);
      } else if (newUser.password === '') {
        const err = instantiateError(400, ['Please provide a value for "password"']);
        next(err);
      } else {
        newUser.password = bcryptjs.hashSync(newUser.password);
        await User.create(newUser);
        res.status(201).location('/').end();
      }
    } else {
      await User.create(req.body);
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errorMessage = error.errors.map(error => error.message);
      const err = instantiateError(400, errorMessage);
      next(err);
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'That email is already taken. Please try another.' })
    }
  }
}));

// Returns a list of courses in database.
router.get('/courses', asyncHandler(async(req, res, next) => {
  try {
    const courses = await Course.findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      include: [
        {
          model: User,
          attributes: {
            exclude: ['password','createdAt', 'updatedAt']
          }
        }
      ]
    });
    res.json(courses);
  } catch (error) {
    next(error);
  }
}));

// Returns a course for the provided course ID.
router.get('/courses/:id', asyncHandler(async(req, res, next) => {
  try {
    const allcourseId = await Course.findAll().map(course => course.dataValues.id);
    const course = await Course.findAll({
     where: {
       id : req.params.id
     },
     attributes: {
       exclude: ['createdAt', 'updatedAt']
     },
     include:[
       {
         model: User,
         attributes: {
           exclude: ['password','createdAt', 'updatedAt']
         }
       }
     ]
    });

    if (allcourseId.includes(parseInt(req.params.id))) {
      res.json(course);
    } else {
      res.status(400).json({ message: 'Sorry, can\'t find the course you\'re looking for' });
    }
  } catch (error) {
    next(error)
  }
}));

// Create a course, set location header to the newly created course.
router.post('/courses', authenticateUser, asyncHandler(async(req, res, next) => {
  try {
    await Course.create(req.body);
    const latestCourse = await Course.findAll({ limit: 1, order: [[ 'createdAt', 'DESC' ]] });
    res.status(201).location('/api/courses/' + latestCourse[0].dataValues.id).end()
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errorMessage = error.errors.map(error => error.message);
      const err = instantiateError(400, errorMessage);
      next(err);
    }
  }
}));

// Updates a course, if the course doesn't exist, rasie an error.
router.put('/courses/:id', authenticateUser, asyncHandler(async(req, res, next) => {
  const course = await Course.findByPk(req.params.id);

  try {
    if (isEmpty(req.body)) {
      res.status(400).json({ message: 'Please provide "title" and "description" and their values in request body to update the course.' });
    } else {
      const currentUser = req.currentUser;
      if (currentUser[0].dataValues.id === course.dataValues.userId) {
        await course.update(req.body);
        res.status(204).end();
      } else {
        res.status(403).json({ message: 'Sorry, you can only edit the course that you own.' })
      }
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errorMessage = error.errors.map(error => error.message);
      const err = instantiateError(400, errorMessage);
      next(err);
    } else if (error.name === 'TypeError') {
      const err = instantiateError(400, 'Sorry, you can\'t edit the course that doesn\'t exist.')
      next(err);
    }
  }
}));

// Delete a course, if the course doesn't exist, rasie an error.
router.delete('/courses/:id', authenticateUser, asyncHandler(async(req, res, next) => {
  const allcourse = await Course.findAll();

  try {
    const currentUser = req.currentUser;
    const course = await Course.findByPk(req.params.id);

    if (currentUser[0].dataValues.id === course.dataValues.userId) {
      await course.destroy();
      res.status(204).end();
    } else {
      res.status(403).json({ message: 'Sorry, you can only delete the course that you own.' })
    }
  } catch (error) {
    if (error.name === 'TypeError') {
      const err = instantiateError(400, 'Sorry, you can\'t delete the course that doesn\'t exist.');
      next(err);
    } else {
      next(error);
    }
  }
}));

module.exports = router;
