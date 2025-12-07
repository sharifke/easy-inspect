# ElektroInspect - Database Migration Quick Reference

## First Time Setup (Complete Workflow)

Follow these commands in order to set up the complete ElektroInspect database from scratch:

### 1. Start PostgreSQL Container
```bash
cd /home/sharif/projecten/inspektor/elektroinspect
docker-compose up -d
```

**Expected Output:**
```
[+] Running 2/2
 ✔ Network elektroinspect_default  Created
 ✔ Container elektroinspect-db     Started
```

**Verify:**
```bash
docker-compose ps
```

Should show:
```
NAME                IMAGE                COMMAND                  STATUS
elektroinspect-db   postgres:15-alpine   "docker-entrypoint.s…"   Up (healthy)
```

---

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

**This installs:**
- Prisma CLI and Client
- TypeScript and ts-node
- Bcrypt for password hashing
- Express and all dependencies

---

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client
```

**What this does:**
- Reads `prisma/schema.prisma`
- Generates TypeScript types and client
- Creates `node_modules/@prisma/client`

---

### 4. Create Initial Migration
```bash
npm run prisma:migrate
```

**Interactive prompts:**
```
Enter a name for the new migration: › initial_schema
```

**Expected Output:**
```
Applying migration `20241119xxxxx_initial_schema`

✔ Database migrations have been applied

Running seed command...
Starting database seed...
Created admin user: admin@elektroinspect.nl
Created inspector user: inspecteur@elektroinspect.nl
Created inspection template: Elektrische Installatie Woning - Basis Inspectie
  - Main components: 5
  - Total sub-components: 20

Seed completed successfully!
```

**What this does:**
1. Creates migration file in `prisma/migrations/`
2. Applies migration to PostgreSQL database
3. Automatically runs seed script (creates users and template)

---

### 5. Verify Database (Optional)
```bash
npm run prisma:studio
```

**Opens:** http://localhost:5555

You can now:
- Browse all tables
- Verify 2 users exist (admin and inspector)
- Check the template with 5 main components
- View all 20 sub-components

---

### 6. Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
Server is running on http://localhost:3000
```

---

## Common Migration Scenarios

### Scenario 1: Schema Changes (Adding/Modifying Models)

**Steps:**
1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npm run prisma:migrate
   # Enter migration name: add_new_field
   ```
3. Restart dev server:
   ```bash
   npm run dev
   ```

---

### Scenario 2: Database Reset (Development Only)

**When to use:**
- Database is corrupted
- Want fresh seed data
- Testing migration from scratch

**Command:**
```bash
npm run prisma:reset
```

**Warning:** This will:
1. Drop all tables
2. Re-run all migrations
3. Re-seed database

**Interactive prompt:**
```
? Are you sure you want to reset your database? › (y/N)
```

---

### Scenario 3: Manual Seeding

**When to use:**
- Want to add more test data
- Reset seed without dropping database

**Command:**
```bash
npm run prisma:seed
```

**Note:** Uses `upsert` so it won't duplicate users if they already exist.

---

### Scenario 4: Production Deployment

**Commands:**
```bash
# 1. Set production environment
export DATABASE_URL="postgresql://user:pass@prod-host:5432/db"
export NODE_ENV="production"

# 2. Install dependencies
npm ci --only=production

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Run migrations (non-interactive)
npm run prisma:migrate:prod

# 5. Start server
npm start
```

**Important:**
- `prisma migrate deploy` does NOT run seed
- Seed production database manually if needed
- Always backup production database first

---

### Scenario 5: Check Migration Status

**Command:**
```bash
npx prisma migrate status
```

**Possible outputs:**

**All migrations applied:**
```
Database schema is up to date!
```

**Pending migrations:**
```
Following migration have not yet been applied:
20241119123456_add_new_field

To apply migrations run: prisma migrate deploy
```

**Database out of sync:**
```
Your database schema is not in sync with your Prisma schema.
Run: prisma migrate dev
```

---

### Scenario 6: Rollback Migration (Development)

Prisma doesn't have built-in rollback. Options:

**Option A: Reset and re-apply**
```bash
npm run prisma:reset
```

**Option B: Manual rollback**
```bash
# 1. Delete last migration folder
rm -rf prisma/migrations/20241119xxxxx_bad_migration

# 2. Reset database
npm run prisma:reset

# 3. Create new migration
npm run prisma:migrate
```

**Option C: Create reverse migration**
```bash
# Edit schema.prisma to reverse changes
npm run prisma:migrate
# Name it: rollback_previous_change
```

---

## Troubleshooting Commands

### Database Connection Issues

**Test connection:**
```bash
docker exec elektroinspect-db psql -U elektroinspect -d elektroinspect_dev -c "SELECT version();"
```

**View database logs:**
```bash
docker-compose logs -f postgres
```

**Restart database:**
```bash
docker-compose restart postgres
```

---

### Prisma Client Issues

**Regenerate client:**
```bash
npm run prisma:generate
```

**Clear Prisma cache:**
```bash
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma
npm install
npm run prisma:generate
```

---

### Migration Issues

**View migration history:**
```bash
npx prisma migrate status
```

**Force re-apply migrations:**
```bash
npm run prisma:migrate:prod
```

**View applied migrations in database:**
```bash
docker exec elektroinspect-db psql -U elektroinspect -d elektroinspect_dev -c "SELECT * FROM _prisma_migrations;"
```

---

### Seed Issues

**Run seed with verbose logging:**
```bash
ts-node prisma/seed.ts
```

**Check if bcrypt is installed:**
```bash
npm list bcrypt
```

**Reinstall dependencies:**
```bash
rm -rf node_modules
npm install
```

---

## Quick Reference: All Prisma Commands

```bash
# Generate client
npm run prisma:generate

# Create and apply migration (dev)
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:migrate:prod

# Seed database
npm run prisma:seed

# Reset database (dev only)
npm run prisma:reset

# Open Prisma Studio
npm run prisma:studio

# Check migration status
npx prisma migrate status

# Validate schema
npx prisma validate

# Format schema
npx prisma format

# View database structure
npx prisma db pull

# Push schema without migration
npx prisma db push
```

---

## Database Backup and Restore

### Backup

**Full database backup:**
```bash
docker exec elektroinspect-db pg_dump -U elektroinspect -Fc elektroinspect_dev > backup_$(date +%Y%m%d_%H%M%S).dump
```

**Schema only:**
```bash
docker exec elektroinspect-db pg_dump -U elektroinspect --schema-only elektroinspect_dev > schema_backup.sql
```

**Data only:**
```bash
docker exec elektroinspect-db pg_dump -U elektroinspect --data-only elektroinspect_dev > data_backup.sql
```

### Restore

**From custom format (.dump):**
```bash
docker exec -i elektroinspect-db pg_restore -U elektroinspect -d elektroinspect_dev -c < backup.dump
```

**From SQL file:**
```bash
docker exec -i elektroinspect-db psql -U elektroinspect -d elektroinspect_dev < backup.sql
```

**Create new database from backup:**
```bash
# 1. Create new database
docker exec elektroinspect-db psql -U elektroinspect -c "CREATE DATABASE elektroinspect_new;"

# 2. Restore backup
docker exec -i elektroinspect-db psql -U elektroinspect -d elektroinspect_new < backup.sql
```

---

## Environment-Specific DATABASE_URL

### Development
```bash
DATABASE_URL="postgresql://elektroinspect:dev123@localhost:5432/elektroinspect_dev"
```

### Testing
```bash
DATABASE_URL="postgresql://elektroinspect:dev123@localhost:5432/elektroinspect_test"
```

### Staging
```bash
DATABASE_URL="postgresql://user:password@staging-host:5432/elektroinspect_staging"
```

### Production
```bash
DATABASE_URL="postgresql://user:password@prod-host:5432/elektroinspect_prod?schema=public&sslmode=require"
```

**Note:** Production should use SSL (`sslmode=require`)

---

## Migration Best Practices

1. **Always backup production before migrating**
   ```bash
   docker exec elektroinspect-db pg_dump -U elektroinspect -Fc elektroinspect_prod > backup_pre_migration.dump
   ```

2. **Test migrations in staging first**
   ```bash
   DATABASE_URL="staging_url" npm run prisma:migrate:prod
   ```

3. **Use descriptive migration names**
   - Good: `add_user_email_verification`
   - Bad: `update_schema`

4. **Review generated migration SQL**
   - Check `prisma/migrations/xxx/migration.sql`
   - Verify destructive operations (DROP, TRUNCATE)

5. **Keep migrations small and focused**
   - One feature per migration
   - Easier to rollback if needed

6. **Don't edit applied migrations**
   - Create new migration instead
   - Old migrations should be immutable

7. **Document breaking changes**
   - Add comments to migration.sql
   - Update CHANGELOG.md
   - Notify team

---

**Last Updated:** November 19, 2024
