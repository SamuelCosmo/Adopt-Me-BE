# Adopt Me - Backend API

Backend for the Adopt Me application, built with **Express**, **TypeScript**, **Knex**, **MySQL**, and **JWT** authentication.

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies with pnpm (recommended)
pnpm install

# Or with npm
npm install

# Or with yarn
yarn install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=adopt_me_db
DB_PORT=3306

# Server Configuration
PORT=4200
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
```

> **Note:** Copy `.env.example` as reference:
> ```bash
> cp .env.example .env
> ```

### 3. Database Setup

```bash
# Run migrations
npm run migrate

# (Optional) Run seeds
npm run seed:run
```

### 4. Start Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with nodemon |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start compiled server |
| `npm run migrate` | Run database migrations |
| `npm run migrate:make` | Create new migration |
| `npm run seed:make` | Create new seed |
| `npm run seed:run` | Run seeds |

---

## 🔐 JWT Authentication

All protected routes require a JWT token in the header:

```
Authorization: Bearer <token>
```

### Required Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | MySQL password | `password123` |
| `DB_NAME` | Database name | `adopt_me_db` |
| `DB_PORT` | MySQL port | `3306` |
| `PORT` | Server port | `4200` |
| `NODE_ENV` | Environment | `development` \| `production` |
| `JWT_SECRET` | JWT secret key | `your-secure-key-here` |

---

## 📡 Authentication Endpoints

### Register (Public)
```bash
POST /user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Login (Public)
```bash
POST /user/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Response:
{
  "message": "Sign-in successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2026-03-30T12:15:00Z"
}
```

### Logout (Protected)
```bash
POST /user/signout
Authorization: Bearer <token>
```

### Change Password (Protected)
```bash
PATCH /user/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

### Delete Account (Protected)
```bash
DELETE /user/account
Authorization: Bearer <token>
```

---

## 📦 Update Dependencies

### Check outdated dependencies
```bash
pnpm outdated
```

### Update dependencies
```bash
# Update all (minor and patch)
pnpm up

# Update to latest versions (major)
pnpm up --latest
```

---

## 📁 Project Structure

```
src/
├── controllers/          # Business logic
│   ├── User.controller.ts
│   └── Token.controller.ts
├── routes/              # Route definitions
│   ├── User.routes.ts
│   └── Token.routes.ts
├── middleware/          # Custom middleware
│   └── auth.middleware.ts
├── models/              # TypeScript interfaces
│   ├── User.ts
│   └── Token.ts
├── db/
│   ├── knexConfig.ts    # Knex configuration
│   └── migrations/      # Database migrations
├── utils/               # Utility functions
│   └── hash_passwords.ts
├── server.ts            # Main configuration
└── db.ts               # Database connection

knexfile.ts             # Knex configuration
tsconfig.json           # TypeScript configuration
.env.example            # Environment variables example
```

---

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt
- ✅ JWT with expiration (15 minutes)
- ✅ Revocable tokens
- ✅ Soft delete for users
- ✅ Input validation
- ⚠️ Rate limiting (coming soon)
- ⚠️ Refresh tokens (coming soon)

---

## 🛠 Requirements

- **Node.js** >= 18
- **pnpm** >= 8 (or npm/yarn)
- **MySQL** >= 8
- **TypeScript** >= 6

---

## 📝 License

ISC

