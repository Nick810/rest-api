const express = require('express');
const router = express.Router();
const db = require('../db');
const { User, Course } = db.models;

function asyncHandler(cb) {
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error) {
      res.status(500).send(error);
    }
  }
}

// Returns the currently authenticated user
router.get('/users', asyncHandler(async(req, res) => {
  try {
    const currentUser = await User.findByPk()
    res.json({
      message: 'hello'
    })
  } catch (error) {

  }
}));

// Create a user
router.post('/users', asyncHandler(async(req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).location('/');
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errorMessage = [];
      error.errors.forEach(error => errorMessage.push(error.message));
      res.status(400).json(errorMessage );
    }
  }
}));

// Returns a list of courses
router.get('/courses', asyncHandler(async(req, res) => {
  try {
    const courses = await Course.findAll();
    res.json(courses);
  } catch (error) {
    throw error;
  }
}));

// Returns a course for the provided course ID
router.get('/courses/:id', asyncHandler(async(req, res) => {

}));

// Create a course
router.post('/courses', asyncHandler(async(req, res) => {
  try {
    const course = await Course.create(req.body);
    // *********** Set the Location header to the URI **********
    res.status(201).location('/courses')
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const errorMessage = [];
      error.errors.forEach(error => errorMessage.push(error.message));
      res.status(400).json(errorMessage );
    }
  }
}));

// Updates a courses
router.put('/courses/:id', asyncHandler(async(req, res) => {

}));

// Delete a course
router.delete('/courses/:id', asyncHandler(async(req, res) => {

}));

module.exports = router;
