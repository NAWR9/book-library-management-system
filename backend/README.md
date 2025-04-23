# Book Library Management System - Authentication API

## Authentication Endpoints

### Register User

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user", // Optional, defaults to "user"
    "department": "Computer Science", // Optional
    "phoneNumber": "05084368**" // Optional
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "department": "Computer Science",
      "phoneNumber": "05084368**",
      "createdAt": "timestamp"
    }
  }
  ```

### Login User

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "department": "Computer Science",
      "phoneNumber": "05084368**",
      "createdAt": "timestamp"
    }
  }
  ```

### Get User Profile

- **URL:** `/api/auth/profile`
- **Method:** `GET`
- **Headers:**
  ```
  Authorization: Bearer jwt_token_here
  ```
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "profilePicture": null,
      "department": "Computer Science",
      "phoneNumber": "05084368**",
      "borrowedBooks": [],
      "createdAt": "timestamp"
    }
  }
  ```

## Authentication Requirements

- Tokens expire after 24 hours
- For protected routes, include a Bearer token in the Authorization header
- Admin-only routes require a user with the role set to 'admin'

## Error Responses

- Invalid credentials: Status 401
- Missing token: Status 401
- Invalid token: Status 401
- Unauthorized role: Status 403
- Server error: Status 500
