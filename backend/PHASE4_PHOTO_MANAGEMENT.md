# Phase 4 - Photo Management & Documentation

## Overview
This document describes the photo management functionality implemented in Phase 4 of the ElektroInspect PWA backend.

## Features Implemented

### 1. Photo Upload Endpoint
**POST /api/inspections/:id/results/:resultId/photos**

Uploads a photo for a specific inspection result.

**Authentication Required:** Yes (Bearer token)

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body Parameter: `photo` (file)

**Supported File Types:**
- JPEG (image/jpeg)
- PNG (image/png)
- WebP (image/webp)

**File Size Limit:** 10MB (configurable via MAX_FILE_SIZE in .env)

**Response:**
```json
{
  "status": "success",
  "data": {
    "photo": {
      "id": "uuid",
      "inspectionResultId": "uuid",
      "filename": "uuid.jpg",
      "originalName": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 1234567,
      "path": "inspections/:inspectionId/:resultId/uuid.jpg",
      "thumbnailPath": "inspections/:inspectionId/:resultId/thumb_uuid.jpg",
      "gpsLatitude": 52.3676,
      "gpsLongitude": 4.9041,
      "takenAt": "2025-11-20T18:00:00.000Z",
      "annotations": null,
      "url": "http://localhost:5000/uploads/inspections/:inspectionId/:resultId/uuid.jpg",
      "thumbnailUrl": "http://localhost:5000/uploads/inspections/:inspectionId/:resultId/thumb_uuid.jpg"
    }
  },
  "message": "Photo uploaded successfully"
}
```

**Features:**
- Validates file type (JPEG, PNG, WebP only)
- Validates file size (max 10MB)
- Generates 300x300 thumbnail automatically
- Extracts GPS metadata (latitude/longitude) if available
- Stores files in organized directory structure
- Returns full URLs for photo and thumbnail

**Error Responses:**
- 401: Not authenticated
- 403: No permission to upload to this inspection
- 404: Inspection or inspection result not found
- 400: Invalid file type, file size exceeds limit, or completed inspection

**cURL Example:**
```bash
curl -X POST \
  http://localhost:5000/api/inspections/{inspectionId}/results/{resultId}/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/photo.jpg"
```

---

### 2. Get Photos Endpoint
**GET /api/inspections/:id/results/:resultId/photos**

Retrieves all photos for a specific inspection result.

**Authentication Required:** Yes (Bearer token)

**Response:**
```json
{
  "status": "success",
  "data": {
    "photos": [
      {
        "id": "uuid",
        "inspectionResultId": "uuid",
        "filename": "uuid.jpg",
        "originalName": "photo.jpg",
        "mimeType": "image/jpeg",
        "size": 1234567,
        "path": "inspections/:inspectionId/:resultId/uuid.jpg",
        "thumbnailPath": "inspections/:inspectionId/:resultId/thumb_uuid.jpg",
        "gpsLatitude": 52.3676,
        "gpsLongitude": 4.9041,
        "takenAt": "2025-11-20T18:00:00.000Z",
        "annotations": "{\"arrows\":[],\"circles\":[],\"text\":[]}",
        "url": "http://localhost:5000/uploads/inspections/:inspectionId/:resultId/uuid.jpg",
        "thumbnailUrl": "http://localhost:5000/uploads/inspections/:inspectionId/:resultId/thumb_uuid.jpg"
      }
    ]
  },
  "message": "Found 1 photo(s)"
}
```

**Error Responses:**
- 401: Not authenticated
- 403: No permission to view photos for this inspection
- 404: Inspection or inspection result not found

**cURL Example:**
```bash
curl -X GET \
  http://localhost:5000/api/inspections/{inspectionId}/results/{resultId}/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Delete Photo Endpoint
**DELETE /api/inspections/:id/results/:resultId/photos/:photoId**

Deletes a photo and its thumbnail from the filesystem and database.

**Authentication Required:** Yes (Bearer token)

**Authorization:** Only inspection owner or admin can delete photos

**Response:**
```json
{
  "status": "success",
  "message": "Photo deleted successfully"
}
```

**Features:**
- Deletes both original photo and thumbnail from filesystem
- Removes photo record from database
- Cascades to related data (due to Prisma schema onDelete: Cascade)

**Error Responses:**
- 401: Not authenticated
- 403: No permission to delete photos from this inspection
- 404: Photo not found
- 400: Photo does not belong to this inspection result

**cURL Example:**
```bash
curl -X DELETE \
  http://localhost:5000/api/inspections/{inspectionId}/results/{resultId}/photos/{photoId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Update Photo Annotations Endpoint
**PATCH /api/inspections/:id/results/:resultId/photos/:photoId/annotations**

Updates the annotation data for a photo (arrows, circles, text).

**Authentication Required:** Yes (Bearer token)

**Request:**
```json
{
  "arrows": [
    {
      "x1": 100,
      "y1": 100,
      "x2": 200,
      "y2": 200,
      "color": "#FF0000"
    }
  ],
  "circles": [
    {
      "x": 150,
      "y": 150,
      "radius": 50,
      "color": "#00FF00"
    }
  ],
  "text": [
    {
      "x": 100,
      "y": 50,
      "text": "Issue here",
      "color": "#0000FF"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "photo": {
      "id": "uuid",
      "inspectionResultId": "uuid",
      "filename": "uuid.jpg",
      "originalName": "photo.jpg",
      "mimeType": "image/jpeg",
      "size": 1234567,
      "path": "inspections/:inspectionId/:resultId/uuid.jpg",
      "thumbnailPath": "inspections/:inspectionId/:resultId/thumb_uuid.jpg",
      "gpsLatitude": 52.3676,
      "gpsLongitude": 4.9041,
      "takenAt": "2025-11-20T18:00:00.000Z",
      "url": "http://localhost:5000/uploads/inspections/:inspectionId/:resultId/uuid.jpg",
      "thumbnailUrl": "http://localhost:5000/uploads/inspections/:inspectionId/:resultId/thumb_uuid.jpg",
      "annotations": {
        "arrows": [...],
        "circles": [...],
        "text": [...]
      }
    }
  },
  "message": "Photo annotations updated successfully"
}
```

**Error Responses:**
- 401: Not authenticated
- 403: No permission to update annotations for this inspection
- 404: Photo not found
- 400: Photo does not belong to this inspection result

**cURL Example:**
```bash
curl -X PATCH \
  http://localhost:5000/api/inspections/{inspectionId}/results/{resultId}/photos/{photoId}/annotations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "arrows": [],
    "circles": [{"x": 100, "y": 100, "radius": 30, "color": "#FF0000"}],
    "text": []
  }'
```

---

## Technical Implementation Details

### Packages Installed
- `sharp` (v0.33.5) - Image processing and thumbnail generation
- `exif-parser` (v0.1.12) - GPS metadata extraction
- `multer` (v1.4.5-lts.2) - File upload handling (already installed)

### Directory Structure
```
backend/
├── uploads/
│   ├── temp/                           # Temporary upload directory
│   └── inspections/
│       └── {inspectionId}/
│           └── {resultId}/
│               ├── {uuid}.jpg          # Original photo
│               └── thumb_{uuid}.jpg    # Thumbnail (300x300)
```

### Files Created/Modified

#### New Files:
1. **src/controllers/photo.controller.ts** - All photo management logic
   - `uploadPhoto()` - Handles file upload, validation, thumbnail generation, GPS extraction
   - `getPhotos()` - Retrieves all photos for an inspection result
   - `deletePhoto()` - Deletes photo and thumbnail from filesystem and database
   - `updatePhotoAnnotations()` - Updates annotation JSON data

2. **src/routes/photo.routes.ts** - Photo routes with multer middleware
   - Configures multer for file uploads
   - Defines all photo endpoints
   - Applies authentication middleware

3. **src/types/exif-parser.d.ts** - TypeScript type definitions for exif-parser

4. **PHASE4_PHOTO_MANAGEMENT.md** - This documentation file

#### Modified Files:
1. **src/routes/inspection.routes.ts**
   - Added import for photoRoutes
   - Mounted photo routes at `/:id/results/:resultId/photos`

2. **src/server.ts**
   - Added static file serving for `/uploads` directory
   - Updated helmet configuration to allow cross-origin resource policy

3. **package.json**
   - Added `sharp` and `exif-parser` dependencies

### Database Schema
The Photo model was already defined in the Prisma schema:

```prisma
model Photo {
  id                  String            @id @default(uuid())
  inspectionResultId  String
  filename            String
  originalName        String
  mimeType            String
  size                Int               // bytes
  path                String            // relative path
  thumbnailPath       String?
  gpsLatitude         Float?
  gpsLongitude        Float?
  takenAt             DateTime          @default(now())
  annotations         String?           // JSON: {arrows: [], circles: [], text: []}
  inspectionResult    InspectionResult  @relation(fields: [inspectionResultId], references: [id], onDelete: Cascade)
  @@map("photos")
}
```

### Security Features
- Authentication required for all endpoints
- Authorization checks ensure users can only access their own inspections (or admin)
- File type validation (only JPEG, PNG, WebP allowed)
- File size validation (max 10MB configurable)
- Path traversal protection via UUID-based filenames
- Cannot upload photos to completed inspections
- Files are cleaned up if database save fails

### Image Processing
- **Thumbnail Generation:** Automatically creates 300x300 thumbnails using sharp
- **GPS Extraction:** Extracts latitude/longitude from EXIF data if available
- **Format Support:** JPEG, PNG, WebP
- **Quality:** Thumbnails are saved as JPEG with 80% quality

### Error Handling
- Comprehensive validation and error messages
- Graceful handling of missing GPS data
- File cleanup on errors
- Detailed logging for debugging

---

## Testing the Implementation

### Prerequisites
1. Ensure the backend is running: `npm run dev`
2. Have a valid JWT token from authentication
3. Have an existing inspection and inspection result ID

### Test Flow

1. **Upload a Photo:**
```bash
curl -X POST \
  http://localhost:5000/api/inspections/YOUR_INSPECTION_ID/results/YOUR_RESULT_ID/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/photo.jpg"
```

2. **Get All Photos:**
```bash
curl -X GET \
  http://localhost:5000/api/inspections/YOUR_INSPECTION_ID/results/YOUR_RESULT_ID/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Update Annotations:**
```bash
curl -X PATCH \
  http://localhost:5000/api/inspections/YOUR_INSPECTION_ID/results/YOUR_RESULT_ID/photos/PHOTO_ID/annotations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"arrows":[],"circles":[{"x":100,"y":100,"radius":30}],"text":[]}'
```

4. **Delete Photo:**
```bash
curl -X DELETE \
  http://localhost:5000/api/inspections/YOUR_INSPECTION_ID/results/YOUR_RESULT_ID/photos/PHOTO_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

5. **Access Photo via Browser:**
```
http://localhost:5000/uploads/inspections/YOUR_INSPECTION_ID/YOUR_RESULT_ID/photo_filename.jpg
```

---

## Environment Variables

Make sure these are set in your `.env` file:

```env
# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR="./uploads"
```

---

## Next Steps

The photo management functionality is now complete. Next phases could include:

- **Phase 5:** Report Generation (PDF export with photos)
- **Phase 6:** Offline Sync & PWA Features
- **Phase 7:** Advanced Analytics & Dashboard
- **Phase 8:** Audit Logging & Compliance

---

## Troubleshooting

### Issue: "File size exceeds maximum allowed size"
**Solution:** Increase MAX_FILE_SIZE in .env file (value in bytes)

### Issue: "No GPS data found in image"
**Solution:** This is normal - not all photos have GPS data. The app handles this gracefully.

### Issue: "Cannot upload photos to completed inspections"
**Solution:** This is by design. Photos can only be uploaded to DRAFT or IN_PROGRESS inspections.

### Issue: Thumbnails not generating
**Solution:** Ensure sharp is properly installed: `npm install sharp`

### Issue: Photos not accessible via URL
**Solution:** Check that the uploads directory exists and has proper permissions

---

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/results/:resultId/photos` | Upload photo |
| GET | `/api/inspections/:id/results/:resultId/photos` | Get all photos |
| DELETE | `/api/inspections/:id/results/:resultId/photos/:photoId` | Delete photo |
| PATCH | `/api/inspections/:id/results/:resultId/photos/:photoId/annotations` | Update annotations |
| GET | `/uploads/*` | Serve static photo files |

All endpoints require authentication via Bearer token.
