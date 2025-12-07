# Quick Start Guide - JWT Authentication

## Prerequisites
- PostgreSQL database running
- Node.js and npm installed
- Docker (optional, if using docker-compose)

---

## Step-by-Step Setup

### 1. Start Database (if using Docker)
```bash
cd /home/sharif/projecten/inspektor/elektroinspect
docker-compose up -d
```

### 2. Setup Backend

```bash
# Navigate to backend
cd /home/sharif/projecten/inspektor/elektroinspect/backend

# Install dependencies (if not already done)
npm install

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed test users
npm run prisma:seed

# Start backend server
npm run dev
```

Backend will be available at: **http://localhost:5000**

### 3. Setup Frontend

```bash
# Open new terminal
cd /home/sharif/projecten/inspektor/elektroinspect/frontend

# Install dependencies (if not already done)
npm install

# Start frontend dev server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## Test the Authentication

### Option 1: Using the Web Interface

1. Open browser to: **http://localhost:5173**
2. You'll be redirected to the login page
3. Use one of these test credentials:

**Admin Login:**
```
Email:    admin@elektroinspect.nl
Password: admin123
```

**Inspector Login:**
```
Email:    inspecteur@elektroinspect.nl
Password: inspecteur123
```

4. Click "Sign in"
5. You should be redirected to the dashboard
6. Try navigating to different routes to test protected routes

### Option 2: Using cURL

**Test Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@elektroinspect.nl",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@elektroinspect.nl",
      "firstName": "Admin",
      "lastName": "ElektroInspect",
      "role": "ADMIN",
      ...
    }
  }
}
```

**Test Get Current User (replace TOKEN with actual token):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## Common Issues & Solutions

### Issue: "Port 5000 already in use"
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Then restart backend
npm run dev
```

### Issue: "Database connection failed"
```bash
# Check if PostgreSQL is running
docker-compose ps

# If not running, start it
docker-compose up -d

# Wait a few seconds, then retry migrations
npm run prisma:migrate
```

### Issue: "Prisma Client not generated"
```bash
# Generate Prisma Client
npm run prisma:generate

# Then restart server
npm run dev
```

### Issue: "Cannot find module '@prisma/client'"
```bash
# Reinstall dependencies
npm install

# Generate Prisma Client
npm run prisma:generate
```

### Issue: "CORS error in browser"
- Check that backend is running on port 5000
- Check that frontend is running on port 5173
- Verify CORS_ORIGIN in backend/.env matches frontend URL
- Restart both servers

### Issue: "Login redirects to login page"
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for failed API calls
- Verify backend is running and accessible
- Clear browser localStorage and try again

---

## Verify Installation

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "ElektroInspect API is running",
  "timestamp": "...",
  "environment": "development"
}
```

### Check Database Seed
```bash
cd /home/sharif/projecten/inspektor/elektroinspect/backend
npm run prisma:studio
```

This opens Prisma Studio where you can verify the users were created.

---

## What's Been Implemented

### Backend (API)
- ✅ JWT token generation and verification
- ✅ Login endpoint (`POST /api/auth/login`)
- ✅ Register endpoint (`POST /api/auth/register`)
- ✅ Get current user endpoint (`GET /api/auth/me`)
- ✅ Authentication middleware
- ✅ Role-based authorization
- ✅ Password hashing with bcrypt
- ✅ Test users in database

### Frontend (Web App)
- ✅ Login page with form validation
- ✅ Authentication context (global state)
- ✅ Protected route component
- ✅ Auto-login on app mount
- ✅ Token storage in localStorage
- ✅ Axios interceptor for JWT tokens
- ✅ Role-based route protection
- ✅ Loading states and error handling

---

## Next Steps

1. **Test the login flow** with provided credentials
2. **Create your own user** via the register endpoint
3. **Implement user profile page** to view/edit user info
4. **Add logout button** to the dashboard
5. **Build admin panel** for user management
6. **Add password reset** functionality
7. **Implement refresh tokens** for better security

---

## Need Help?

- Check the full documentation: `AUTHENTICATION_SETUP.md`
- Check backend logs in terminal
- Check browser DevTools console
- Verify all environment variables are set
- Ensure database is running and migrated

---

## Test Credentials Summary

| Email | Password | Role |
|-------|----------|------|
| admin@elektroinspect.nl | admin123 | ADMIN |
| inspecteur@elektroinspect.nl | inspecteur123 | INSPECTOR |

**Note:** Change these passwords in production!

---

## Files Created

**Backend:**
- `/backend/src/utils/jwt.ts` - JWT utilities
- `/backend/src/controllers/auth.controller.ts` - Auth endpoints
- `/backend/src/middleware/auth.middleware.ts` - Auth middleware
- `/backend/src/routes/auth.routes.ts` - Auth routes
- `/backend/src/types/express.d.ts` - TypeScript definitions
- `/backend/.env` - Environment variables (updated)

**Frontend:**
- `/frontend/src/services/auth.ts` - Auth API service
- `/frontend/src/contexts/AuthContext.tsx` - Auth context
- `/frontend/src/pages/Login.tsx` - Login page
- `/frontend/src/components/ProtectedRoute.tsx` - Protected route component
- `/frontend/src/App.tsx` - App setup (updated)
- `/frontend/.env` - Environment variables (created)

You're all set! Start both servers and test the authentication flow.
