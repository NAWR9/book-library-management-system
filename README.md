# 📚 UniStack (University Book Library Management System)

A bilingual (English / Arabic) web platform that lets university students **search, borrow, and review** library books online while giving librarians full control over the catalogue.

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

## Distinctive features

> - 🔍 Smart AI search assistant
> - 📚 Smart autofill book descriptions using google books API
> - 🌙 Dark / Light mode
> - 🌐 Full RTL/LTR & i18n support

---

## 🎯 Project Goals

1. Replace manual library workflows with a responsive self‑service portal.
2. Demonstrate clean MVC architecture, RESTful APIs, and secure auth.
3. Showcase best‑practice **ES6**, **translation**, and **theme** patterns.

---

## 🗺️ System Flow Chart

![Flow Chart](docs/flowchart/unistack_flow_chart.png) <!-- Replace with your own image or link -->

---

## 📦 Repository Structure

```
.
├── backend
│   ├── src/
│   │   ├── controllers
│   │   ├── models
│   │   ├── routes
│   │   └── middleware
│   └── server.js
├── frontend
│   ├── public/   # CSS, JS, images
│   └── views/    # EJS templates
└── README.md
```

---

## 🚀 Getting Started (Local)

```bash
# 1) Clone & install
git clone https://github.com/NAWR9/book-library-management-system.git
cd book-library-management-system
npm install            # installs root tools (eslint / prettier)

# 2) Setup environment
cp .env.example .env   # fill in vars
npm install
npm run dev            # nodemon on http://localhost:5000

```

### .env example

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/library
JWT_SECRET=replace_me

# Email (password reset)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your@example.com
EMAIL_PASSWORD=app_password
EMAIL_FROM=noreply@library.com
EMAIL_FROM_NAME=University Library

# AI API KEY (smart search)
GROQ_API_KEY=API_KEY_HERE
```

---

## 🖥️ Screenshots

| Light Mode                                          | Dark Mode                                          |
| --------------------------------------------------- | -------------------------------------------------- |
| ![Light](docs/screenshots/unistack_1.png)           | ![Dark](docs/screenshots/unistack_2.png)           |
| Admin Dashboard                                     | User Dashboard                                     |
| ![Admin Dashboard](docs/screenshots/unistack_3.png) | ![User Dashboard](docs/screenshots/unistack_4.png) |
| Borrow                                              | Book Details                                       |
| ![Borrow](docs/screenshots/unistack_6.png)          | ![Book Details](docs/screenshots/unistack_5.png)   |

---

## ✨ Current Features

- User / admin registration & JWT login
- Role‑based navbar
- Book CRUD (admin)
- Student borrow requests (pending/approved/returned)
- Password reset via email
- Responsive design with RTL flip
- Dark / Light theme toggle
- Full English / Arabic translation via i18next

---

## 🔮 Future Work

- **AI Search Assistant** – let users describe a story or ask for “a short sci‑fi novel about space exploration”; OpenAI will return keywords → MongoDB query → suggestions.
- **Gamification** – award points & badges for reading streaks, reviews, and on‑time returns.
- PWA offline support & push notifications

---

## 👥 Team

| Name                          | GitHub                                                 |
| ----------------------------- | ------------------------------------------------------ |
| Osamah Sadeq Shubaita         | [@NAWR9](https://github.com/NAWR9)                     |
| Mohammed Abdullah Alosaimi    | [@moabos](https://github.com/moabos)                   |
| Abdulrhman Abdulwasie Anwar   | [@Abdulrhmansaleh](https://github.com/Abdulrhmansaleh) |
| Abdulmajeed Abdullah Alsakran | [@absakran01](https://github.com/absakran01)           |
| Ahmed Abdullah Alzaid         | [@AhmedAlzaid](https://github.com/AhmedAlzaid)         |

---

## 📝 License

MIT

---

## 📚 Resources

- Imam University CS346 Web Development Course Materials
- i18next documentation
- MongoDB University Tutorials
