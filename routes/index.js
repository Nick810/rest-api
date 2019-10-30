const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const router = express.Router();
const db = require('../db');
const { User, Course } = db.models;

// ---- Helper Functions ---- //
function asyncHandler(cb) {
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error) {
      res.status(500).send(error);
    }
  }
}

function isEmpty(obj) {
  for (let key in obj) {
    if(obj.hasOwnProperty(key))
      return false;
  }
  return true;
}

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

// Returns the currently authenticated user
router.get('/users', authenticateUser, (req, res) => {
  const user = req.currentUser;

  res.json({
    firstName: user[0].dataValues.firstName,
    lastName: user[0].dataValues.lastName
  })
});

// Create a user
router.post('/users', asyncHandler(async(req, res, next) => {
  try {
    if (req.body.emailAddress) {
      const user = req.body;
      user.password = bcryptjs.hashSync(user.password);
      await User.create(user);
      res.status(201).location('/').end();
    } else {
      await User.create(req.body);
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errorMessage = [];
      const err = new Error;

      err.status = 400;
      err.message = errorMessage;
      error.errors.forEach(error => errorMessage.push(error.message));
      next(err);
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.json({ message: 'That username is taken. Please try another.' })
    }
  }
}));

// Returns a list of courses
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

// Returns a course for the provided course ID
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

// Create a course
router.post('/courses', authenticateUser, asyncHandler(async(req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).location('/api/courses').end()
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errorMessage = [];
      const err = new Error;

      err.status = 400;
      err.message = errorMessage;
      error.errors.forEach(error => errorMessage.push(error.message));
      next(err);
    }
  }
}));

// Updates a courses
router.put('/courses/:id', authenticateUser, asyncHandler(async(req, res, next) => {
  const course = await Course.findByPk(req.params.id);

  try {
    if (isEmpty(req.body)) {
      res.status(400).json({ message: 'Please "title" and "description" in body to update the course.' });
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
      const errorMessage = [];
      const err = new Error;

      err.status = 400;
      err.message = errorMessage;
      error.errors.forEach(error => errorMessage.push(error.message));
      next(err);
    } else if (error.name === 'TypeError') {
      const err = new Error;
      err.status = 400;
      err.message = 'Sorry, you can\'t edit the course that doesn\'t exist.'
      next(err);
    }
  }
}));

// Delete a course
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
      const err = new Error;
      err.status = 400;
      err.message = 'Sorry, you can\'t delete the course that doesn\'t exist.'
      next(err);
    } else {
      next(error);
    }
  }
}));

module.exports = router;
