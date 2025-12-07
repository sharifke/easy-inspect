# ElektroInspect - Quick Setup Guide

## What Was Created

### 1. Database Schema (`backend/prisma/schema.prisma`)
Complete Prisma schema with:
- 3 Enums: UserRole, InspectionStatus, Classification
- 8 Models: User, InspectionTemplate, MainComponent, SubComponent, Inspection, InspectionResult, Photo, AuditLog
- All fields, relations, indexes, and constraints as specified
- Proper cascade deletes and unique constraints

### 2. Seed Data (`backend/prisma/seed.ts`)
Test data including:
- Admin user: admin@elektroinspect.nl / admin123
- Inspector user: inspecteur@elektroinspect.nl / inspecteur123
- Complete sample template "Elektrische Installatie Woning" with:
  - 5 Main Components (Meterkast, Aarding, Stopcontacten, Verlichting, Vaste Apparaten)
  - 20 Sub-Components with realistic criteria
- Passwords hashed with bcrypt (10 rounds)

### 3. Docker Configuration (`docker-compose.yml`)
PostgreSQL 15 setup with:
- Container name: elektroinspect-db
- Port: 5432:5432
- Database: elektroinspect_dev
- User: elektroinspect
- Password: dev123
- Persistent volume for data
- Health checks

### 4. Environment Configuration (`backend/.env`)
All required environment variables:
- DATABASE_URL (PostgreSQL connection string)
- JWT_SECRET and JWT_EXPIRES_IN
- PORT, NODE_ENV
- CORS_ORIGIN
- File upload settings
- SMTP settings (for future use)

### 5. Package Configuration (`backend/package.json`)
Updated with Prisma seed scripts:
- `npm run prisma:seed` - Run seed manually
- `npm run prisma:reset` - Reset database
- `npm run prisma:migrate:prod` - Production migrations
- Prisma seed hook configured

### 6. Git Configuration (`.gitignore`)
Comprehensive .gitignore for:
- Environment files
- Dependencies
- Build outputs
- IDE files
- Database files
- Uploads

### 7. Documentation (`README.md`)
Complete README with:
- Project overview
- Technology stack
- Installation instructions
- Docker commands
- Prisma commands
- Database management
- API endpoints overview
- Troubleshooting guide
- Development workflow

## Quick Start (Step by Step)

### Step 1: Start Database
```bash
cd /home/sharif/projecten/inspektor/elektroinspect
docker-compose up -d
```

**Verify:**
```bash
docker-compose ps
# Should show elektroinspect-db running
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Generate Prisma Client
```bash
npm run prisma:generate
```

**Verify:**
```bash
# Should see "Generated Prisma Client" message
ls -la node_modules/@prisma/client
```

### Step 4: Run Migrations
```bash
npm run prisma:migrate
```

**What happens:**
- Creates a new migration in `prisma/migrations/`
- Applies migration to database
- Automatically runs seed script

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "elektroinspect_dev"

Database migration complete!
Running seed command...
Starting database seed...
Created admin user: admin@elektroinspect.nl
Created inspector user: inspecteur@elektroinspect.nl
Created inspection template: Elektrische Installatie Woning - Basis Inspectie
  - Main components: 5
  - Total sub-components: 20
Seed completed successfully!
```

### Step 5: Verify Database (Optional)
```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555` where you can:
- Browse all tables
- Verify users exist
- Check template and components
- See relationships

### Step 6: Start Backend Server
```bash
npm run dev
```

**Expected output:**
```
Server is running on http://localhost:3000
```

### Step 7: Test API
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elektroinspect.nl","password":"admin123"}'
```

## Verification Checklist

- [ ] Docker container is running: `docker-compose ps`
- [ ] Database is accessible: `docker exec elektroinspect-db psql -U elektroinspect -d elektroinspect_dev -c "\dt"`
- [ ] Prisma Client is generated: `ls backend/node_modules/@prisma/client`
- [ ] Migrations are applied: `npm run prisma:migrate status`
- [ ] Seed data exists: Check Prisma Studio or query directly
- [ ] Backend server starts: `npm run dev`
- [ ] API responds: Test with curl or Postman

## Common Issues and Solutions

### Issue: "Can't reach database server"
**Solution:**
```bash
# Check if Docker is running
docker-compose ps

# Check Docker logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Issue: "Prisma Client not found"
**Solution:**
```bash
npm run prisma:generate
```

### Issue: "Migration failed"
**Solution:**
```bash
# Reset database (WARNING: Deletes all data)
npm run prisma:reset

# Or manually drop and recreate
docker-compose down -v
docker-compose up -d
npm run prisma:migrate
```

### Issue: "Port 5432 already in use"
**Solution:**
```bash
# Check what's using the port
lsof -i :5432

# Either stop the other process or change port in docker-compose.yml
# and update DATABASE_URL in .env
```

### Issue: "Seed script fails"
**Solution:**
```bash
# Run seed manually to see detailed error
npm run prisma:seed

# Common causes:
# - bcrypt not installed: npm install bcrypt
# - TypeScript issues: npm install -D @types/bcrypt ts-node
```

## Database Schema Overview

### Users Table
- Stores admin and inspector accounts
- Passwords hashed with bcrypt
- Role-based access control

### Templates System
```
InspectionTemplate (1)
  └── MainComponent (N)
      └── SubComponent (N)
```

### Inspection System
```
Inspection (1)
  └── InspectionResult (N)
      └── Photo (N)
```

### Key Relationships
- User -> Inspections (one-to-many)
- Template -> Inspections (one-to-many)
- Template -> MainComponents -> SubComponents (nested hierarchy)
- Inspection -> InspectionResults (one-to-many)
- InspectionResult -> Photos (one-to-many)
- SubComponent -> InspectionResults (one-to-many)

## Next Steps

1. **Start Frontend Development**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

2. **Implement API Endpoints**
   - Authentication routes
   - Template CRUD
   - Inspection CRUD
   - Photo upload

3. **Add Middleware**
   - JWT authentication
   - Role-based authorization
   - Request validation
   - Error handling

4. **Testing**
   - Unit tests for services
   - Integration tests for API
   - E2E tests for critical flows

5. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - Deployment guide
   - User manual

## Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Express Guide**: https://expressjs.com/en/guide/routing.html
- **JWT Best Practices**: https://jwt.io/introduction
- **PostgreSQL Docs**: https://www.postgresql.org/docs/15/

## Support

For issues or questions:
1. Check the main README.md
2. Review elektroinspect-spec.md
3. Check Prisma logs: `npm run prisma:migrate status`
4. Check Docker logs: `docker-compose logs -f`

---

**Setup completed successfully! Ready for development.**
