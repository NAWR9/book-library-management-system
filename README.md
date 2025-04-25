# Book Library Management System

A web-based library management system built with Node.js, Express, and MongoDB.

## Technologies

### Frontend

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![Bootstrap](https://img.shields.io/badge/bootstrap-%23563D7C.svg?style=for-the-badge&logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

### Backend

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/mongodb-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/mongoose-%2300f.svg?style=for-the-badge&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

### Tools

![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)

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

## License

This project is licensed under the MIT License.
