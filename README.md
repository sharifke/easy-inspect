# ElektroInspect - Digitale Inspectie Applicatie

ElektroInspect is een complete digitale oplossing voor het uitvoeren, beheren en rapporteren van elektrische installatie-inspecties volgens de NEN 1010 norm. De applicatie bestaat uit een Progressive Web App (PWA) voor offline gebruik en een RESTful API backend.

## Projectoverzicht

### Technologie Stack

**Backend:**
- Node.js met TypeScript
- Express.js voor REST API
- Prisma ORM voor database toegang
- PostgreSQL 15 database
- JWT voor authenticatie
- Bcrypt voor wachtwoord hashing

**Frontend:**
- React 18 met TypeScript
- Vite als build tool
- TailwindCSS voor styling
- React Router voor navigatie
- React Query voor data fetching
- Zustand voor state management
- PWA met offline support

**Infrastructure:**
- Docker voor PostgreSQL database
- Docker Compose voor orchestratie

## Vereisten

- Node.js 18+ en npm/yarn
- Docker en Docker Compose
- Git

## Installatie en Setup

### 1. Repository Klonen

```bash
git clone <repository-url>
cd elektroinspect
```

### 2. Database Opstarten met Docker

Start de PostgreSQL database container:

```bash
# Start de database
docker-compose up -d

# Controleer of de container draait
docker-compose ps

# Bekijk logs (optioneel)
docker-compose logs -f postgres
```

De database is nu beschikbaar op `localhost:5432` met de volgende credentials:
- **Database**: elektroinspect_dev
- **User**: elektroinspect
- **Password**: dev123

### 3. Backend Setup

```bash
# Navigeer naar backend directory
cd backend

# Installeer dependencies
npm install

# Kopieer .env bestand (al aanwezig in project)
# Controleer of DATABASE_URL correct is in .env

# Genereer Prisma Client
npm run prisma:generate

# Run database migraties
npm run prisma:migrate

# Seed de database met test data
npm run prisma:seed

# Start de development server
npm run dev
```

De backend API is nu beschikbaar op `http://localhost:3000`

### 4. Frontend Setup

```bash
# Navigeer naar frontend directory
cd ../frontend

# Installeer dependencies
npm install

# Start de development server
npm run dev
```

De frontend is nu beschikbaar op `http://localhost:5173`

## Database Beheer

### Prisma Commando's

```bash
# Prisma Studio (visuele database editor)
npm run prisma:studio

# Nieuwe migratie maken
npm run prisma:migrate

# Database resetten (wist alle data!)
npm run prisma:reset

# Database seeden
npm run prisma:seed

# Prisma Client regenereren
npm run prisma:generate
```

### Docker Commando's

```bash
# Database starten
docker-compose up -d

# Database stoppen
docker-compose down

# Database stoppen en volumes verwijderen (wist alle data!)
docker-compose down -v

# Database logs bekijken
docker-compose logs -f postgres

# Database container status
docker-compose ps

# Database container herstarten
docker-compose restart postgres
```

### Database Backup en Restore

```bash
# Backup maken
docker exec elektroinspect-db pg_dump -U elektroinspect elektroinspect_dev > backup.sql

# Restore vanuit backup
docker exec -i elektroinspect-db psql -U elektroinspect elektroinspect_dev < backup.sql
```

## Database Schema

Het database schema bevat de volgende modellen:

### Enums
- **UserRole**: ADMIN, INSPECTOR, VIEWER
- **InspectionStatus**: DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED
- **Classification**: C1_IMMEDIATE_DANGER, C2_POTENTIAL_DANGER, C3_IMPROVEMENT_RECOMMENDED, ACCEPTABLE, NOT_APPLICABLE

### Modellen
- **User**: Gebruikers met rollen en authenticatie
- **InspectionTemplate**: Herbruikbare inspectie templates
- **MainComponent**: Hoofdcomponenten van een template
- **SubComponent**: Sub-componenten met criteria
- **Inspection**: Inspectie instanties
- **InspectionResult**: Resultaten per sub-component
- **Photo**: Foto's met annotaties
- **AuditLog**: Audit trail van alle acties

Zie `backend/prisma/schema.prisma` voor de complete schema definitie.

## Seed Data

Na het runnen van `npm run prisma:seed` zijn de volgende test accounts beschikbaar:

**Admin Account:**
- Email: admin@elektroinspect.nl
- Password: admin123
- Role: ADMIN

**Inspector Account:**
- Email: inspecteur@elektroinspect.nl
- Password: inspecteur123
- Role: INSPECTOR

De seed bevat ook een complete voorbeeld inspectie template voor woningen met 5 hoofdcomponenten en 20+ sub-componenten.

## Development Workflow

### Backend Development

```bash
cd backend

# Start dev server met hot reload
npm run dev

# Run linting
npm run lint

# Format code
npm run format

# Build voor productie
npm run build

# Start productie build
npm start
```

### Frontend Development

```bash
cd frontend

# Start dev server
npm run dev

# Build voor productie
npm run build

# Preview productie build
npm run preview

# Run linting
npm run lint
```

## API Endpoints

De API draait standaard op `http://localhost:3000/api`

### Authenticatie
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registreer nieuwe gebruiker
- `GET /api/auth/me` - Huidige gebruiker info

### Templates
- `GET /api/templates` - Lijst van templates
- `GET /api/templates/:id` - Enkel template met components
- `POST /api/templates` - Nieuwe template (admin)
- `PUT /api/templates/:id` - Update template (admin)
- `DELETE /api/templates/:id` - Verwijder template (admin)

### Inspections
- `GET /api/inspections` - Lijst van inspecties
- `GET /api/inspections/:id` - Enkel inspectie met resultaten
- `POST /api/inspections` - Nieuwe inspectie
- `PUT /api/inspections/:id` - Update inspectie
- `PATCH /api/inspections/:id/status` - Update status
- `DELETE /api/inspections/:id` - Verwijder inspectie

Voor complete API documentatie, zie `elektroinspect-spec.md` sectie 4.

## Troubleshooting

### Database Connectie Problemen

```bash
# Controleer of Docker container draait
docker-compose ps

# Herstart database
docker-compose restart postgres

# Controleer logs voor errors
docker-compose logs postgres

# Test database connectie
docker exec elektroinspect-db psql -U elektroinspect -d elektroinspect_dev -c "SELECT version();"
```

### Prisma Problemen

```bash
# Regenereer Prisma Client
npm run prisma:generate

# Reset database en run migraties opnieuw
npm run prisma:reset

# Controleer migratie status
npx prisma migrate status
```

### Port Conflicten

Als poort 5432, 3000 of 5173 al in gebruik is:

```bash
# Voor database: wijzig port in docker-compose.yml
ports:
  - "5433:5432"  # externe port wijzigen

# Update DATABASE_URL in backend/.env
DATABASE_URL="postgresql://elektroinspect:dev123@localhost:5433/elektroinspect_dev"

# Voor backend: wijzig PORT in backend/.env
PORT=3001

# Voor frontend: wijzig port in frontend/vite.config.ts
server: {
  port: 5174
}
```

## Productie Deployment

### Database Migraties

Voor productie gebruik:

```bash
npm run prisma:migrate:prod
```

Dit runt `prisma migrate deploy` zonder interactieve prompts.

### Environment Variabelen

Zorg ervoor dat de volgende environment variabelen zijn ingesteld in productie:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="<genereer een sterke random string>"
NODE_ENV="production"
CORS_ORIGIN="https://your-domain.com"
```

### Security Checklist

- [ ] Wijzig alle standaard wachtwoorden
- [ ] Gebruik sterke JWT_SECRET (minimaal 32 characters)
- [ ] Configureer CORS correct voor productie domain
- [ ] Gebruik HTTPS in productie
- [ ] Implementeer rate limiting
- [ ] Setup database backups
- [ ] Configureer logging en monitoring
- [ ] Review en update security headers

## Project Structuur

```
elektroinspect/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Database seed data
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helper functions
│   │   └── server.ts         # Entry point
│   ├── .env                  # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API calls
│   │   ├── stores/           # State management
│   │   └── App.tsx           # App entry point
│   └── package.json
├── docker-compose.yml        # Docker orchestration
├── .gitignore
└── README.md
```

## Support en Documentatie

- Volledige specificatie: `elektroinspect-spec.md`
- Prisma documentatie: https://www.prisma.io/docs
- React documentatie: https://react.dev
- Express documentatie: https://expressjs.com

## Licentie

ISC

---

**Ontwikkeld voor ElektroInspect BV**
