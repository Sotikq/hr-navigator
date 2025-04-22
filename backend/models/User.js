const bcrypt = require("bcryptjs");

class User {
  constructor({ id, name, email, password, role }) {
    this.id = id || `user_${Date.now()}`;
    this.name = name;
    this.email = email;
    this.password = bcrypt.hashSync(password, 10);
    this.role = role; // "student" или "teacher"
  }

  comparePassword(inputPassword) {
    return bcrypt.compareSync(inputPassword, this.password);
  }
}

module.exports = User;
