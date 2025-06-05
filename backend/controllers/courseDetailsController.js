const {
  createCourseDetails,
  getCourseDetailsByCourseId,
  updateCourseDetails,
  deleteCourseDetails,
} = require('../models/CourseDetails');
const ApiError = require('../utils/ApiError');

// Создать детали курса
async function createCourseDetailsHandler(req, res, next) {
  try {
    const { course_id, target_audience, learning_outcomes, study_details, study_period, goal } = req.body;
    if (!course_id) throw ApiError.badRequest('course_id is required');
    const details = await createCourseDetails({ course_id, target_audience, learning_outcomes, study_details, study_period, goal });
    res.status(201).json(details);
  } catch (err) { next(err); }
}

// Получить детали по course_id
async function getCourseDetailsHandler(req, res, next) {
  try {
    const { courseId } = req.params;
    const details = await getCourseDetailsByCourseId(courseId);
    if (!details) throw ApiError.notFound('Course details not found');
    res.json(details);
  } catch (err) { next(err); }
}

// Обновить детали курса
async function updateCourseDetailsHandler(req, res, next) {
  try {
    const { courseId } = req.params;
    const fieldsToUpdate = req.body;
    const updated = await updateCourseDetails(courseId, fieldsToUpdate);
    if (!updated) throw ApiError.notFound('Course details not found or nothing to update');
    res.json(updated);
  } catch (err) { next(err); }
}

// Удалить детали курса
async function deleteCourseDetailsHandler(req, res, next) {
  try {
    const { courseId } = req.params;
    const deleted = await deleteCourseDetails(courseId);
    if (!deleted) throw ApiError.notFound('Course details not found');
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
}

module.exports = {
  createCourseDetailsHandler,
  getCourseDetailsHandler,
  updateCourseDetailsHandler,
  deleteCourseDetailsHandler,
}; 