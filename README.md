# Book Library Management System

A web-based library management system built with Node.js, Express, and MongoDB.

## Features (Planned)

- Book management (Add, Edit, Delete, View)
- User management
- Book borrowing and returning system
- Search functionality
- Authentication and Authorization

## Project Structure

```
book-library-management-system/
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── models/
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/NAWR9/book-library-management-system.git
   cd book-library-management-system
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the backend directory with your configuration:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/library
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the backend development server:

   ```bash
   npm run dev
   ```

5. Open the frontend/index.html file in your browser or set up a local server for the frontend

## Tech Stack

- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Authentication: JWT
- Frontend: HTML, CSS, JavaScript

## License

This project is licensed under the MIT License.
