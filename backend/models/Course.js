// Пока без базы, просто пример структуры для использования
class Course {
    constructor({ id, title, description, deadline, modules = [] }) {
      this.id = id || `course${Date.now()}`;
      this.title = title;
      this.description = description;
      this.deadline = deadline;
      this.modules = modules;
    }
  }
  
  module.exports = Course;
  