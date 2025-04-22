const Course = require('../models/Course');

let courses = []; // пока в памяти

const getAllCourses = (req, res) => {
  res.json(courses);
};

const createCourse = (req, res) => {
  const { title, description, deadline, modules } = req.body;

  if (!title || !description || !deadline) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  const newCourse = new Course({ title, description, deadline, modules });
  courses.push(newCourse);

  res.status(201).json(newCourse);
};

module.exports = { getAllCourses, createCourse };
