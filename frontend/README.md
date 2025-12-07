# ElektroInspect Frontend

Progressive Web Application (PWA) for electrical installation inspections based on NEN1010 standards.

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Dexie.js** - IndexedDB wrapper for offline storage
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form handling and validation
- **Lucide React** - Icons
- **jsPDF + html2canvas** - PDF generation
- **Vite PWA Plugin** - Progressive Web App capabilities

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:5000

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ElektroInspect
VITE_APP_VERSION=1.0.0
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   ├── inspector/      # Inspector-specific components
│   ├── shared/         # Shared/common components
│   └── reports/        # Report components
├── pages/              # Page components
├── services/           # API and database services
│   ├── api.ts         # Axios API client
│   └── db.ts          # Dexie database setup
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles
├── App.tsx            # Main app component with routing
└── main.tsx           # Application entry point
```

## Features

### PWA Capabilities
- Offline functionality with IndexedDB
- Service Worker for caching
- Installable on mobile and desktop
- Background sync for data when online

### Offline-First Architecture
- Local data storage with Dexie.js
- Automatic sync queue for offline actions
- Photo and signature storage
- Inspection data persistence

### API Integration
- Axios instance with interceptors
- Automatic token injection
- Error handling and retry logic
- Proxy configuration for development

### Routing Structure
- `/login` - Public login page
- `/admin/*` - Admin dashboard and features
- `/inspector/*` - Inspector dashboard and features
- `/inspector/inspections` - Inspections list
- `/inspector/inspections/new` - Create new inspection

## Building for Production

1. Build the application:
```bash
npm run build
```

2. The build output will be in the `dist` folder

3. Preview the production build:
```bash
npm run preview
```

## PWA Configuration

PWA settings are configured in `vite.config.ts`:
- Service worker auto-update
- Offline caching strategies
- Manifest configuration
- Icon assets

To test PWA features:
1. Build the app: `npm run build`
2. Serve it: `npm run preview`
3. Open in browser and check DevTools > Application > Service Workers

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_APP_NAME` | Application name | `ElektroInspect` |
| `VITE_APP_VERSION` | App version | `1.0.0` |
| `VITE_ENV` | Environment | `development` |
| `VITE_DEBUG` | Debug mode | `false` |

## Development Guidelines

### Adding New Features
1. Create types in `src/types/`
2. Add API methods in `src/services/api.ts`
3. Add database methods in `src/services/db.ts` if needed
4. Create components in appropriate folders
5. Add routes in `App.tsx`

### Styling
- Use Tailwind utility classes
- Custom styles in `src/index.css`
- Predefined classes: `.btn-primary`, `.btn-secondary`, `.card`, `.input-field`

### State Management
- Use React Context for global state
- IndexedDB (Dexie) for persistent data
- React Hook Form for form state

## Troubleshooting

### Build Issues
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### PWA Issues
- Clear service workers in DevTools
- Clear cache and hard reload
- Check manifest.json is loading

### API Connection Issues
- Verify backend is running on port 5000
- Check proxy configuration in vite.config.ts
- Verify CORS settings on backend

## License

Proprietary - ElektroInspect 2025
