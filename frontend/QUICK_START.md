# ElektroInspect Frontend - Quick Start Guide

## Getting Started in 3 Steps

### 1. Start Development Server
```bash
cd /home/sharif/projecten/inspektor/elektroinspect/frontend
cp .env.example .env
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Common Development Tasks

### Create a New Page Component

**File**: `src/pages/MyPage.tsx`
```typescript
import { FC } from 'react'

const MyPage: FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="card max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">My Page</h1>
        <p>Page content here</p>
      </div>
    </div>
  )
}

export default MyPage
```

**Add to routing in** `src/App.tsx`:
```typescript
import MyPage from './pages/MyPage'

// Inside Routes:
<Route path="/my-page" element={<MyPage />} />
```

---

### Create a Form with Validation

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof schema>

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label className="block mb-2">Name</label>
        <input {...register('name')} className="input-field" />
        {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
      </div>

      <div className="mb-4">
        <label className="block mb-2">Email</label>
        <input {...register('email')} className="input-field" />
        {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      </div>

      <button type="submit" className="btn-primary">Submit</button>
    </form>
  )
}
```

---

### Make an API Call

```typescript
import { apiService } from '../services/api'
import { useState, useEffect } from 'react'

const MyComponent = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.inspections.list()
        setData(response.data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>

  return <div>{/* Render data */}</div>
}
```

---

### Save Data to IndexedDB

```typescript
import { dbService } from '../services/db'
import type { Inspection } from '../types'

const saveInspection = async (inspection: Inspection) => {
  try {
    const id = await dbService.saveInspection(inspection)
    console.log('Saved with ID:', id)
  } catch (error) {
    console.error('Error saving:', error)
  }
}

const loadInspections = async () => {
  try {
    const inspections = await dbService.getAllInspections()
    console.log('Loaded:', inspections)
  } catch (error) {
    console.error('Error loading:', error)
  }
}
```

---

### Create a Context for State Management

**File**: `src/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useState, ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string) => {
    // Implement login logic
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('authToken')
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

**Use in** `src/main.tsx`:
```typescript
import { AuthProvider } from './contexts/AuthContext'

<AuthProvider>
  <App />
</AuthProvider>
```

---

### Capture Photo with Webcam

```typescript
import Webcam from 'react-webcam'
import { useRef } from 'react'

const PhotoCapture = () => {
  const webcamRef = useRef<Webcam>(null)

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      console.log('Captured:', imageSrc)
      // Save to IndexedDB or upload to server
    }
  }

  return (
    <div>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        className="w-full max-w-md"
      />
      <button onClick={capture} className="btn-primary mt-4">
        Capture Photo
      </button>
    </div>
  )
}
```

---

### Capture Signature

```typescript
import SignatureCanvas from 'react-signature-canvas'
import { useRef } from 'react'

const SignatureCapture = () => {
  const sigRef = useRef<SignatureCanvas>(null)

  const clear = () => sigRef.current?.clear()

  const save = () => {
    const dataURL = sigRef.current?.toDataURL()
    if (dataURL) {
      console.log('Signature:', dataURL)
      // Save to IndexedDB or upload
    }
  }

  return (
    <div>
      <SignatureCanvas
        ref={sigRef}
        canvasProps={{
          className: 'border border-gray-300 w-full h-48'
        }}
      />
      <div className="mt-4 space-x-2">
        <button onClick={clear} className="btn-secondary">Clear</button>
        <button onClick={save} className="btn-primary">Save</button>
      </div>
    </div>
  )
}
```

---

### Generate PDF Report

```typescript
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const generatePDF = async () => {
  const element = document.getElementById('report-content')
  if (!element) return

  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save('inspection-report.pdf')
}

// In component:
<div>
  <div id="report-content">
    {/* Report content */}
  </div>
  <button onClick={generatePDF} className="btn-primary">
    Download PDF
  </button>
</div>
```

---

### Custom Hook for Online/Offline Status

**File**: `src/hooks/useOnlineStatus.ts`
```typescript
import { useState, useEffect } from 'react'

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Usage:
const MyComponent = () => {
  const isOnline = useOnlineStatus()

  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 p-4 text-center">
          You are offline. Changes will sync when online.
        </div>
      )}
    </div>
  )
}
```

---

### Sync Queue Handler

```typescript
import { dbService } from '../services/db'
import { apiService } from '../services/api'

export const syncOfflineData = async () => {
  const items = await dbService.getUnsyncedItems()

  for (const item of items) {
    try {
      switch (item.type) {
        case 'inspection':
          if (item.action === 'create') {
            await apiService.inspections.create(item.data)
          }
          break
        case 'photo':
          // Upload photo
          break
        // Handle other types
      }

      await dbService.markAsSynced(item.id!)
    } catch (error) {
      await dbService.markSyncError(item.id!, String(error))
    }
  }
}

// Call on app startup or when coming online:
useEffect(() => {
  if (isOnline) {
    syncOfflineData()
  }
}, [isOnline])
```

---

## Useful Tailwind Classes

### Layout
```
min-h-screen         # Full viewport height
container mx-auto    # Centered container
max-w-4xl            # Max width
p-8                  # Padding
space-y-4            # Vertical spacing between children
```

### Buttons
```
btn-primary          # Custom primary button
btn-secondary        # Custom secondary button
btn-danger           # Custom danger button
```

### Forms
```
input-field          # Custom input field
```

### Cards
```
card                 # Custom card component
```

---

## Environment Variables

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
const appName = import.meta.env.VITE_APP_NAME
```

---

## Debugging

### Check Service Worker
1. Open DevTools > Application > Service Workers
2. Check "Update on reload" for development

### View IndexedDB
1. Open DevTools > Application > IndexedDB
2. Expand "ElektroInspectDB"

### Network Requests
1. Open DevTools > Network
2. Filter by "Fetch/XHR"

---

## Common Issues

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port Already in Use
Change port in `vite.config.ts`:
```typescript
server: {
  port: 3001,  // Change port
}
```

### Service Worker Not Updating
Clear site data in DevTools > Application > Clear storage

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Dexie.js](https://dexie.org)
- [React Router](https://reactrouter.com)

---

Happy coding! The infrastructure is ready for you to build ElektroInspect.
