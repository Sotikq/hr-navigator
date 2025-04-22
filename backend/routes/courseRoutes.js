const express = require('express');
const router = express.Router();
const { getAllCourses, createCourse } = require('../controllers/courseController');

// GET
router.get('/', getAllCourses);

// POST
router.post('/', createCourse);

module.exports = router;
