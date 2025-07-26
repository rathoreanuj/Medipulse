# 🏥 Medipulse - Doctor Appointment Booking System

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

<div align="center">
  <h3>🚀 A modern, full-stack healthcare appointment booking platform</h3>
  <p>Streamlining healthcare access with intuitive appointment scheduling and management</p>
</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🔧 Installation](#-installation)
- [🌐 Environment Variables](#-environment-variables)
- [🚀 Running the Application](#-running-the-application)
- [📱 Screenshots](#-screenshots)
- [🎯 API Endpoints](#-api-endpoints)
- [👥 User Roles](#-user-roles)
- [🔐 Authentication](#-authentication)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📞 Contact](#-contact)
- [📄 License](#-license)

---

## 🌟 Features

### 👤 **User Features**
- ✅ **User Registration & Authentication** - Secure JWT-based authentication
- ✅ **Doctor Discovery** - Browse doctors by specialty, location, and availability
- ✅ **Appointment Booking** - Easy-to-use booking interface with calendar integration
- ✅ **Appointment Management** - View, reschedule, and cancel appointments
- ✅ **Profile Management** - Update personal information and medical history
- ✅ **Responsive Design** - Seamless experience across all devices

### 👨‍⚕️ **Doctor Features**
- ✅ **Doctor Dashboard** - Comprehensive overview of appointments and schedule
- ✅ **Appointment Management** - Accept, decline, and manage patient appointments
- ✅ **Schedule Management** - Set availability and working hours
- ✅ **Patient Information** - Access patient details and medical history

### 👨‍💼 **Admin Features**
- ✅ **Admin Dashboard** - Complete system overview and analytics
- ✅ **Doctor Management** - Add, edit, and manage doctor profiles
- ✅ **User Management** - Monitor and manage user accounts
- ✅ **Appointment Oversight** - View and manage all appointments
- ✅ **System Analytics** - Track usage statistics and performance metrics

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React.js 18+ with Vite
- **Styling:** Tailwind CSS
- **State Management:** Context API
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Notifications:** React Toastify
- **Icons:** Lucide React

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Image Storage:** Cloudinary
- **Security:** bcrypt for password hashing
- **Validation:** Validator.js

### **Development Tools**
- **Version Control:** Git & GitHub
- **Package Manager:** npm
- **Linting:** ESLint
- **Code Formatting:** Prettier

---

## 📁 Project Structure

```
Medipulse-5june/
├── 📁 Medipulse-Backend/
│   └── 📁 backend/
│       ├── 📁 controllers/
│       │   ├── adminController.js
│       │   ├── doctorController.js
│       │   └── userController.js
│       ├── 📁 middleware/
│       │   ├── authAdmin.js
│       │   ├── authDoctor.js
│       │   ├── authUser.js
│       │   └── multer.js
│       ├── 📁 models/
│       │   ├── appointmentModel.js
│       │   ├── doctorModel.js
│       │   └── userModel.js
│       ├── 📁 routes/
│       │   ├── adminRoute.js
│       │   ├── doctorRoute.js
│       │   └── userRoute.js
│       ├── 📄 server.js
│       └── 📄 package.json
├── 📁 Medipulse-Frontend/
│   ├── 📁 frontend/ (User Interface)
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/
│   │   │   ├── 📁 pages/
│   │   │   ├── 📁 context/
│   │   │   ├── 📁 assets/
│   │   │   └── 📄 App.jsx
│   │   └── 📄 package.json
│   └── 📁 admin/ (Admin Dashboard)
│       ├── 📁 src/
│       └── 📄 package.json
├── 📄 README.md
└── 📄 .gitignore
```

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/rathoreanuj/Medipulse.git
cd Medipulse

# Install backend dependencies
cd Medipulse-Backend/backend
npm install

# Install frontend dependencies
cd ../../Medipulse-Frontend/frontend
npm install

# Install admin dependencies
cd ../admin
npm install

# Set up environment variables (see Environment Variables section)

# Start the backend server
cd ../../Medipulse-Backend/backend
npm start

# Start the frontend (in a new terminal)
cd ../../Medipulse-Frontend/frontend
npm run dev

# Start the admin panel (in a new terminal)
cd ../admin
npm run dev
```

---

## 🔧 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/rathoreanuj/Medipulse.git
   cd Medipulse
   ```

2. **Backend Setup**
   ```bash
   cd Medipulse-Backend/backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../../Medipulse-Frontend/frontend
   npm install
   ```

4. **Admin Panel Setup**
   ```bash
   cd ../admin
   npm install
   ```

---

## 🌐 Environment Variables

### Backend (.env)
Create a `.env` file in `Medipulse-Backend/backend/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/medipulse
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/medipulse

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary Configuration
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Server Configuration
PORT=4000
NODE_ENV=development

# Admin Credentials
ADMIN_EMAIL=admin@medipulse.com
ADMIN_PASSWORD=admin123
```

### Frontend (.env)
Create a `.env` file in `Medipulse-Frontend/frontend/`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

### Admin (.env)
Create a `.env` file in `Medipulse-Frontend/admin/`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

---

## 🚀 Running the Application

### Development Mode

1. **Start Backend Server**
   ```bash
   cd Medipulse-Backend/backend
   npm run dev
   # Server runs on http://localhost:4000
   ```

2. **Start Frontend Application**
   ```bash
   cd Medipulse-Frontend/frontend
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **Start Admin Panel**
   ```bash
   cd Medipulse-Frontend/admin
   npm run dev
   # Admin panel runs on http://localhost:5174
   ```

### Production Mode

```bash
# Build frontend
cd Medipulse-Frontend/frontend
npm run build

# Build admin
cd ../admin
npm run build

# Start backend in production
cd ../../Medipulse-Backend/backend
npm start
```

---

## 📱 Screenshots

### User Interface
- **Homepage:** Clean, modern landing page with doctor search
- **Doctor Listing:** Grid view of available doctors with filters
- **Appointment Booking:** Intuitive calendar-based booking system
- **User Dashboard:** Personal appointment management interface

### Admin Dashboard
- **Analytics Overview:** Comprehensive system statistics
- **Doctor Management:** Easy doctor profile management
- **Appointment Monitoring:** Real-time appointment tracking

---

## 🎯 API Endpoints

### Authentication
```
POST /api/user/register     # User registration
POST /api/user/login        # User login
POST /api/admin/login       # Admin login
POST /api/doctor/login      # Doctor login
```

### User Endpoints
```
GET  /api/user/profile      # Get user profile
POST /api/user/update       # Update user profile
GET  /api/user/doctors      # Get all doctors
POST /api/user/book-appointment    # Book appointment
GET  /api/user/appointments        # Get user appointments
POST /api/user/cancel-appointment  # Cancel appointment
```

### Admin Endpoints
```
GET  /api/admin/dashboard   # Admin dashboard data
POST /api/admin/add-doctor  # Add new doctor
GET  /api/admin/doctors     # Get all doctors
POST /api/admin/change-availability  # Update doctor availability
```

### Doctor Endpoints
```
GET  /api/doctor/profile    # Get doctor profile
POST /api/doctor/update     # Update doctor profile
GET  /api/doctor/appointments      # Get doctor appointments
POST /api/doctor/complete-appointment  # Mark appointment complete
```

---

## 👥 User Roles

### 🏥 **Patient/User**
- Browse and search doctors
- Book appointments
- Manage personal appointments
- Update profile information

### 👨‍⚕️ **Doctor**
- Manage appointment schedule
- View patient information
- Update availability
- Complete appointments

### 👨‍💼 **Admin**
- System oversight and management
- Doctor profile management
- User account monitoring
- System analytics and reporting

---

## 🔐 Authentication

The application uses **JWT (JSON Web Tokens)** for authentication:

- **Secure Registration:** Password hashing with bcrypt
- **Token-based Authentication:** Stateless authentication system
- **Role-based Access Control:** Different access levels for users, doctors, and admins
- **Protected Routes:** Middleware protection for sensitive endpoints

---

## 📦 Deployment

### Recommended Platforms

1. **Vercel (Frontend & Backend)**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify (Frontend) + Railway (Backend)**
   - Frontend: Deploy to Netlify
   - Backend: Deploy to Railway

3. **Heroku (Full Stack)**
   ```bash
   git push heroku main
   ```

### Environment Setup for Production
- Update `VITE_BACKEND_URL` to production backend URL
- Set up production MongoDB database
- Configure Cloudinary for production
- Set secure JWT secrets

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Write clear, descriptive commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## 📞 Contact

**Developer:** Anuj Rathore  
**Email:** anujrathore385@gmail.com  
**GitHub:** [@rathoreanuj](https://github.com/rathoreanuj)  
**Project Link:** [https://github.com/rathoreanuj/Medipulse](https://github.com/rathoreanuj/Medipulse)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by Anuj Rathore</p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>

---

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added admin dashboard and doctor management
- **v1.2.0** - Enhanced UI/UX and mobile responsiveness
- **v1.3.0** - Removed payment integration, improved security

---

## 🐛 Known Issues

- None currently reported

## 🚧 Roadmap

- [ ] Email notifications for appointments
- [ ] SMS reminders
- [ ] Video consultation integration
- [ ] Multi-language support
- [ ] Mobile app development
