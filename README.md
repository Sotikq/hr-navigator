# HR Navigator — Online Course Platform

**HR Navigator** is a full-featured web application designed to host and manage professional development courses. The platform allows users to browse, filter, and access training materials, while providing admins with tools to manage course content, users, and media. Built using modern web technologies and integrated with Supabase for backend services.

---

## 🚀 Features

- 🔐 User authentication via Supabase Auth  
- 🎓 Course creation, editing, and deletion (CRUD)  
- 📄 Course catalog with search and filtering  
- 🎥 Upload and view video reviews  
- 🖼️ Cover image upload for each course  
- 👥 Role-based access control (Admin/User)  
- ⚙️ RESTful API with middleware for validation, roles, and rate limiting  

---

## 🛠️ Tech Stack

### Frontend
- Angular
- TypeScript
- SCSS

### Backend
- Node.js
- Express.js
- REST API

### Database & Auth
- Supabase (PostgreSQL)
- Supabase Auth for user authentication
- Supabase Storage or local uploads (for media files)

---

## 📁 Project Structure
/frontend → Angular application
/backend → Node.js Express backend
/uploads → Uploaded images and videos


---

## 📸 Screenshots

> _screenshots of the UI here: homepage, course details, upload modals, etc._

---

## ⚙️ Getting Started

### 📋 Prerequisites

- Node.js
- Supabase project (with URL and API keys)
- Angular CLI (`npm install -g @angular/cli`)

### 🧱 Backend Setup

cd backend
npm install
node server.js

Make sure to configure Supabase credentials in config/db.js or via .env:
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

### 💻 Frontend Setup

cd frontend
npm install
ng serve

Visit: http://localhost:4200

### 🔑 Environment Variables (Backend)
SUPABASE_URL=
SUPABASE_KEY=

### 👨‍💻 Team

Bilalyev (biman) Omur-Ulukman
Ketebay (meytosty) Bakhtiyar
Fazylkhanov (sotiqq) Sultan

### 📄 License
All rights reserved
