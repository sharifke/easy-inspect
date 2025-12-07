import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getInspectionById,
  saveResult,
  completeInspection,
  updateInspection,
} from '../services/inspectionService';
import { photoService } from '../services/photoService';
import type { Inspection, Classification, Photo, PhotoAnnotations } from '../types/inspection';
import PhotoCapture from '../components/inspector/PhotoCapture';
import PhotoGallery from '../components/inspector/PhotoGallery';
import PhotoAnnotation from '../components/inspector/PhotoAnnotation';
import PhotoThumbnail from '../components/inspector/PhotoThumbnail';

interface ResultState {
  [subComponentId: string]: {
    rating: number;
    classification: Classification;
    notes: string;
    isSaving: boolean;
    isSaved: boolean;
    photos?: Photo[];
  };
}

interface PhotoModalState {
  isOpen: boolean;
  mode: 'capture' | 'gallery' | 'annotate' | null;
  subComponentId: string | null;
  resultId: string | null;
  selectedPhoto: Photo | null;
}

const InspectionExecution: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [results, setResults] = useState<ResultState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [photoModal, setPhotoModal] = useState<PhotoModalState>({
    isOpen: false,
    mode: null,
    subComponentId: null,
    resultId: null,
    selectedPhoto: null,
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState<string>('');
  const [isSavingAnnotations, setIsSavingAnnotations] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInspection(id);
    }
  }, [id]);

  const fetchInspection = async (inspectionId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getInspectionById(inspectionId);
      const inspectionData = response.data.inspection;

      // Check if inspection can be edited (admins can edit completed inspections)
      if (inspectionData.status === 'COMPLETED' && user?.role !== 'ADMIN') {
        navigate(`/inspections/${inspectionId}/view`);
        return;
      }

      setInspection(inspectionData);

      // Update status to IN_PROGRESS if it's still DRAFT (don't change COMPLETED status)
      if (inspectionData.status === 'DRAFT') {
        await updateInspection(inspectionId, { status: 'IN_PROGRESS' });
      }

      // Initialize results state from existing results
      const initialResults: ResultState = {};
      if (inspectionData.results) {
        inspectionData.results.forEach((result) => {
          initialResults[result.subComponentId] = {
            rating: result.rating,
            classification: result.classification,
            notes: result.notes || '',
            isSaving: false,
            isSaved: true,
            photos: result.photos || [], // Initialize with photos directly from inspectionData
          };
        });
      }
      setResults(initialResults);

      // Remove the separate asynchronous photo loading loop, as photos are already in inspectionData
      // if (inspectionData.results) {
      //   inspectionData.results.forEach(async (result) => {
      //     if (result.id) {
      //       try {
      //         const photos = await photoService.getPhotos(inspectionId, result.id);
      //         setResults((prev) => ({
      //           ...prev,
      //           [result.subComponentId]: {
      //             ...prev[result.subComponentId],
      //             photos: photos,
      //           },
      //         }));
      //       } catch (err) {
      //         console.error('Failed to load photos for result:', result.id, err);
      //       }
      //     }
      //   });
      // }

      // Expand all components by default
      if (inspectionData.template?.mainComponents) {
        const allComponentIds = inspectionData.template.mainComponents.map(mc => mc.id);
        setExpandedComponents(new Set(allComponentIds));
      }
    } catch (err: any) {
      console.error('Failed to fetch inspection:', err);
      setError(err.response?.data?.message || 'Failed to load inspection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = async (subComponentId: string, rating: number) => {
    // Initialize result if it doesn't exist
    if (!results[subComponentId]) {
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          rating,
          classification: 'N_A',
          notes: '',
          isSaving: false,
          isSaved: false,
        },
      }));
    } else {
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          ...prev[subComponentId],
          rating,
          isSaved: false,
        },
      }));
    }

    // Auto-save
    await saveResultToBackend(subComponentId, { rating });
  };

  const handleClassificationChange = async (
    subComponentId: string,
    classification: Classification
  ) => {
    // Initialize result if it doesn't exist
    if (!results[subComponentId]) {
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          rating: 0,
          classification,
          notes: '',
          isSaving: false,
          isSaved: false,
        },
      }));
    } else {
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          ...prev[subComponentId],
          classification,
          isSaved: false,
        },
      }));
    }

    // Auto-save
    await saveResultToBackend(subComponentId, { classification });
  };

  const handleNotesChange = (subComponentId: string, notes: string) => {
    if (!results[subComponentId]) {
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          rating: 0,
          classification: 'N_A',
          notes,
          isSaving: false,
          isSaved: false,
        },
      }));
    } else {
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          ...prev[subComponentId],
          notes,
          isSaved: false,
        },
      }));
    }
  };

  const saveResultToBackend = async (
    subComponentId: string,
    updates: Partial<{ rating: number; classification: Classification; notes: string }>
  ) => {
    if (!inspection?.id) return;

    // Mark as saving
    setResults(prev => ({
      ...prev,
      [subComponentId]: {
        ...prev[subComponentId],
        ...updates,
        isSaving: true,
      },
    }));

    try {
      const currentResult = results[subComponentId];
      const resultData = {
        subComponentId,
        rating: updates.rating !== undefined ? updates.rating : currentResult?.rating || 0,
        classification:
          updates.classification !== undefined
            ? updates.classification
            : currentResult?.classification || 'N_A',
        notes: updates.notes !== undefined ? updates.notes : currentResult?.notes || '',
      };

      const savedResult = await saveResult(inspection.id, resultData);

      // Update inspection with the saved result
      setInspection(prev => {
        if (!prev) return prev;
        const existingResultIndex = prev.results?.findIndex(r => r.subComponentId === subComponentId);
        const updatedResults = [...(prev.results || [])];

        if (existingResultIndex !== undefined && existingResultIndex >= 0) {
          updatedResults[existingResultIndex] = savedResult.data.result;
        } else {
          updatedResults.push(savedResult.data.result);
        }

        return {
          ...prev,
          results: updatedResults,
        };
      });

      // Mark as saved
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          ...prev[subComponentId],
          isSaving: false,
          isSaved: true,
        },
      }));

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setResults(prev => ({
          ...prev,
          [subComponentId]: {
            ...prev[subComponentId],
            isSaved: false,
          },
        }));
      }, 2000);
    } catch (err: any) {
      console.error('Failed to save result:', err);
      setResults(prev => ({
        ...prev,
        [subComponentId]: {
          ...prev[subComponentId],
          isSaving: false,
          isSaved: false,
        },
      }));
      setError('Failed to save result');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveItemNotes = async (subComponentId: string) => {
    const notes = results[subComponentId]?.notes || '';
    await saveResultToBackend(subComponentId, { notes });
  };

  const getResultIdForSubComponent = (subComponentId: string): string | null => {
    const result = inspection?.results?.find((r) => r.subComponentId === subComponentId);
    return result?.id || null;
  };

  const handleOpenPhotoCapture = (subComponentId: string) => {
    const resultId = getResultIdForSubComponent(subComponentId);
    if (!resultId) {
      setError('Sla eerst een beoordeling op voordat je foto\'s toevoegt');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setPhotoModal({
      isOpen: true,
      mode: 'capture',
      subComponentId,
      resultId,
      selectedPhoto: null,
    });
  };

  const handlePhotoCapture = async (
    file: File,
    gpsData?: { latitude: number; longitude: number }
  ) => {
    if (!inspection?.id || !photoModal.resultId || !photoModal.subComponentId) return;

    setIsUploadingPhoto(true);
    setError('');

    try {
      const photo = await photoService.uploadPhoto(
        inspection.id,
        photoModal.resultId,
        {
          file,
          gpsLatitude: gpsData?.latitude,
          gpsLongitude: gpsData?.longitude,
        },
        (progressEvent) => {
          // Optional: Show upload progress
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log('Upload progress:', percentCompleted);
        }
      );

      // Update results with new photo
      setResults((prev) => ({
        ...prev,
        [photoModal.subComponentId!]: {
          ...prev[photoModal.subComponentId!],
          photos: [...(prev[photoModal.subComponentId!]?.photos || []), photo],
        },
      }));

      // Close modal and show gallery
      setPhotoModal({
        isOpen: true,
        mode: 'gallery',
        subComponentId: photoModal.subComponentId,
        resultId: photoModal.resultId,
        selectedPhoto: null,
      });
    } catch (err: any) {
      console.error('Failed to upload photo:', err);
      setError(err.response?.data?.message || 'Kon foto niet uploaden');
      throw err;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!inspection?.id || !photoModal.resultId || !photoModal.subComponentId) return;

    setIsDeletingPhoto(photoId);
    setError('');

    try {
      await photoService.deletePhoto(inspection.id, photoModal.resultId, photoId);

      // Update results by removing deleted photo
      setResults((prev) => ({
        ...prev,
        [photoModal.subComponentId!]: {
          ...prev[photoModal.subComponentId!],
          photos: prev[photoModal.subComponentId!]?.photos?.filter((p) => p.id !== photoId) || [],
        },
      }));
    } catch (err: any) {
      console.error('Failed to delete photo:', err);
      setError(err.response?.data?.message || 'Kon foto niet verwijderen');
    } finally {
      setIsDeletingPhoto('');
    }
  };

  const handleOpenAnnotation = (photo: Photo) => {
    setPhotoModal((prev) => ({
      ...prev,
      mode: 'annotate',
      selectedPhoto: photo,
    }));
  };

  const handleSaveAnnotations = async (annotations: PhotoAnnotations) => {
    if (
      !inspection?.id ||
      !photoModal.resultId ||
      !photoModal.selectedPhoto ||
      !photoModal.subComponentId
    )
      return;

    console.log('Saving annotations for photo:', photoModal.selectedPhoto.id);
    console.log('Annotations:', annotations);

    setIsSavingAnnotations(true);
    setError('');

    try {
      const updatedPhoto = await photoService.updateAnnotations(
        inspection.id,
        photoModal.resultId,
        photoModal.selectedPhoto.id,
        annotations
      );

      console.log('Updated photo received:', updatedPhoto);
      console.log('Updated photo annotations:', updatedPhoto.annotations);

      // Update results with annotated photo
      setResults((prev) => ({
        ...prev,
        [photoModal.subComponentId!]: {
          ...prev[photoModal.subComponentId!],
          photos:
            prev[photoModal.subComponentId!]?.photos?.map((p) =>
              p.id === updatedPhoto.id ? updatedPhoto : p
            ) || [],
        },
      }));

      console.log('Results updated in state');

      // Close annotation and return to gallery
      setPhotoModal((prev) => ({
        ...prev,
        mode: 'gallery',
        selectedPhoto: null,
      }));
    } catch (err: any) {
      console.error('Failed to save annotations:', err);
      setError(err.response?.data?.message || 'Kon annotaties niet opslaan');
    } finally {
      setIsSavingAnnotations(false);
    }
  };

  const handleClosePhotoModal = () => {
    setPhotoModal({
      isOpen: false,
      mode: null,
      subComponentId: null,
      resultId: null,
      selectedPhoto: null,
    });
  };

  const toggleComponent = (componentId: string) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  const calculateProgress = () => {
    if (!inspection?.template?.mainComponents) return { completed: 0, total: 0, percentage: 0 };

    const total = inspection.template.mainComponents.reduce(
      (acc, mc) => acc + (mc.subComponents?.length || 0),
      0
    );

    const completed = Object.keys(results).filter(
      key => results[key].rating > 0 || results[key].classification !== 'N_A'
    ).length;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const handleSaveDraft = async () => {
    navigate('/inspections');
  };

  const handleCompleteInspection = async () => {
    if (!inspection?.id) return;

    const progress = calculateProgress();
    if (progress.completed < progress.total) {
      const confirmed = window.confirm(
        `You have only completed ${progress.completed} of ${progress.total} items. Are you sure you want to complete this inspection?`
      );
      if (!confirmed) return;
    }

    setIsCompleting(true);
    setError('');

    try {
      await completeInspection(inspection.id);
      navigate('/inspections');
    } catch (err: any) {
      console.error('Failed to complete inspection:', err);
      setError(err.response?.data?.message || 'Failed to complete inspection');
      setIsCompleting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    const labels = ['N/A', 'Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
    return labels[rating] || 'N/A';
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading inspection...</p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Inspection not found</h3>
          <button
            onClick={() => navigate('/inspections')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Back to Inspections
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{inspection.clientName}</h1>
                <p className="text-sm text-gray-600">{inspection.location}</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/inspections')}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
                <span className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Template: <span className="font-medium">{inspection.template?.name}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  In Progress
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Progress: {progress.completed} / {progress.total} items ({progress.percentage}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Components and Sub-Components */}
        <div className="space-y-4">
          {inspection.template?.mainComponents
            ?.sort((a, b) => a.sortOrder - b.sortOrder)
            .map((mainComponent) => (
              <div key={mainComponent.id} className="card">
                {/* Main Component Header */}
                <button
                  onClick={() => toggleComponent(mainComponent.id)}
                  className="w-full flex justify-between items-center text-left"
                >
                  <h2 className="text-xl font-semibold text-gray-900">
                    {mainComponent.name}
                  </h2>
                  <svg
                    className={`h-6 w-6 text-gray-500 transition-transform ${expandedComponents.has(mainComponent.id) ? 'transform rotate-180' : ''
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Sub-Components */}
                {expandedComponents.has(mainComponent.id) && (
                  <div className="mt-6 space-y-6">
                    {mainComponent.subComponents
                      ?.sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((subComponent) => {
                        const result = results[subComponent.id];
                        const isCompleted =
                          result && (result.rating > 0 || result.classification !== 'N_A');

                        return (
                          <div
                            key={subComponent.id}
                            className={`p-4 border rounded-lg ${isCompleted
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white'
                              }`}
                          >
                            {/* Sub-Component Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                  {subComponent.name}
                                  {isCompleted && (
                                    <svg
                                      className="ml-2 h-5 w-5 text-green-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Criterion:</span>{' '}
                                  {subComponent.criterion}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">Expected:</span>{' '}
                                  {subComponent.expectedOutcome}
                                </p>
                              </div>
                              {result?.isSaving && (
                                <div className="text-xs text-gray-500">Saving...</div>
                              )}
                              {result?.isSaved && (
                                <div className="text-xs text-green-600">Saved</div>
                              )}
                            </div>

                            {/* Rating Selector */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rating
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {[0, 1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    onClick={() => handleRatingChange(subComponent.id, rating)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${result?.rating === rating
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                      }`}
                                  >
                                    {rating} - {getRatingLabel(rating)}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Classification Selector */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Classification
                              </label>
                              <select
                                value={result?.classification || 'N_A'}
                                onChange={(e) =>
                                  handleClassificationChange(
                                    subComponent.id,
                                    e.target.value as Classification
                                  )
                                }
                                className="block w-full sm:w-auto rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                              >
                                <option value="N_A">N/A</option>
                                <option value="C1">C1 - Critical</option>
                                <option value="C2">C2 - Major</option>
                                <option value="C3">C3 - Minor</option>
                                <option value="ACCEPTABLE">Acceptable</option>
                              </select>
                            </div>

                            {/* Notes */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                              </label>
                              <textarea
                                value={result?.notes || ''}
                                onChange={(e) => handleNotesChange(subComponent.id, e.target.value)}
                                rows={3}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                placeholder="Add any observations or notes..."
                              />
                              <button
                                onClick={() => handleSaveItemNotes(subComponent.id)}
                                className="mt-2 px-3 py-1 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100"
                              >
                                Save Notes
                              </button>
                            </div>

                            {/* Photos Section */}
                            <div className="border-t pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                  Foto's (Debug Count: {result?.photos?.length || 0})
                                  {result?.photos && result.photos.length > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                      {result.photos.length}
                                    </span>
                                  )}
                                </label>
                                <button
                                  onClick={() => handleOpenPhotoCapture(subComponent.id)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:bg-primary-800"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  Foto toevoegen
                                </button>
                              </div>

                              {result?.photos && result.photos.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                  {result.photos.map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-primary-500 transition-all"
                                    >
                                      <PhotoThumbnail
                                        photo={photo}
                                        onClick={() => {
                                          const resultId = getResultIdForSubComponent(subComponent.id);
                                          if (resultId) {
                                            setPhotoModal({
                                              isOpen: true,
                                              mode: 'gallery',
                                              subComponentId: subComponent.id,
                                              resultId,
                                              selectedPhoto: null,
                                            });
                                          }
                                        }}
                                        className="cursor-pointer"
                                      />
                                      {photo.gpsLatitude && photo.gpsLongitude && (
                                        <div className="absolute top-1 right-1 p-0.5 bg-black bg-opacity-60 rounded z-20 pointer-events-none">
                                          <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  Nog geen foto's toegevoegd
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>

      {/* Photo Modals */}
      {photoModal.isOpen && photoModal.mode === 'capture' && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={handleClosePhotoModal}
        />
      )}

      {photoModal.isOpen && photoModal.mode === 'gallery' && photoModal.subComponentId && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Foto's</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleOpenPhotoCapture(photoModal.subComponentId!)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Nieuwe foto
                    </button>
                    <button
                      onClick={handleClosePhotoModal}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {isUploadingPhoto && (
                <div className="mb-6 rounded-lg bg-primary-50 p-4 border border-primary-200">
                  <div className="flex items-center">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-3"></div>
                    <p className="text-sm text-primary-800">Foto uploaden...</p>
                  </div>
                </div>
              )}
              <PhotoGallery
                photos={results[photoModal.subComponentId]?.photos || []}
                onDelete={handleDeletePhoto}
                onAnnotate={handleOpenAnnotation}
                isDeleting={isDeletingPhoto}
              />
            </div>
          </div>
        </div>
      )}

      {photoModal.isOpen && photoModal.mode === 'annotate' && photoModal.selectedPhoto && (
        <PhotoAnnotation
          photo={photoModal.selectedPhoto}
          onSave={handleSaveAnnotations}
          onCancel={() =>
            setPhotoModal((prev) => ({
              ...prev,
              mode: 'gallery',
              selectedPhoto: null,
            }))
          }
          isSaving={isSavingAnnotations}
        />
      )}

      {/* Fixed Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isCompleting}
            >
              Save Draft
            </button>
            <button
              onClick={handleCompleteInspection}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCompleting}
            >
              {isCompleting ? 'Completing...' : 'Complete Inspection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionExecution;
