import React, { useState } from 'react';
import type { Photo } from '../../types/inspection';
import PhotoThumbnail from './PhotoThumbnail';
import PhotoViewer from './PhotoViewer';

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete: (photoId: string) => void;
  onAnnotate?: (photo: Photo) => void;
  isDeleting?: string; // Photo ID currently being deleted
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onDelete,
  onAnnotate,
  isDeleting,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handlePhotoClick = (photo: Photo) => {
    console.log('[PhotoGallery] Photo clicked:', photo);
    setSelectedPhoto(photo);
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  const handleDeleteClick = (photoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setShowDeleteConfirm(photoId);
  };

  const handleConfirmDelete = (photoId: string) => {
    onDelete(photoId);
    setShowDeleteConfirm(null);
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatGPS = (latitude?: number, longitude?: number) => {
    if (latitude === undefined || longitude === undefined) {
      return null;
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  const openInMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">Nog geen foto's toegevoegd</p>
        <p className="mt-1 text-xs text-gray-500">
          Gebruik de camera om foto's te maken
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
          >
            {/* Thumbnail with annotations */}
            <PhotoThumbnail
              photo={photo}
              onClick={() => handlePhotoClick(photo)}
              className="cursor-pointer transition-transform group-hover:scale-105"
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="flex space-x-2 pointer-events-auto">
                {onAnnotate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnnotate(photo);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Annoteer"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => handleDeleteClick(photo.id, e)}
                  className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                  title="Verwijderen"
                  disabled={isDeleting === photo.id}
                >
                  {isDeleting === photo.id ? (
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* GPS indicator */}
            {photo.gpsLatitude && photo.gpsLongitude && (
              <div className="absolute top-2 right-2 p-1 bg-black bg-opacity-60 rounded">
                <svg
                  className="w-4 h-4 text-white"
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            )}

            {/* Annotations indicator */}
            {photo.annotations &&
              (photo.annotations.arrows.length > 0 ||
                photo.annotations.circles.length > 0 ||
                photo.annotations.text.length > 0) && (
                <div className="absolute top-2 left-2 p-1 bg-primary-600 bg-opacity-90 rounded">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Foto verwijderen?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Weet je zeker dat je deze foto wilt verwijderen? Deze actie kan niet
              ongedaan worden gemaakt.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                disabled={isDeleting === showDeleteConfirm}
              >
                {isDeleting === showDeleteConfirm ? 'Verwijderen...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-size Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div className="relative max-w-7xl w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-white">
                <p className="text-sm font-medium">{selectedPhoto.filename}</p>
                <p className="text-xs text-gray-300">
                  {formatDateTime(selectedPhoto.takenAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {onAnnotate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnnotate(selectedPhoto);
                    }}
                    className="text-white hover:text-gray-300 p-2 flex items-center space-x-2"
                    title="Annoteer foto"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span className="text-sm">Annoteer</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(selectedPhoto.id, e);
                  }}
                  className="text-white hover:text-red-300 p-2 flex items-center space-x-2"
                  title="Verwijder foto"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="text-sm">Verwijder</span>
                </button>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:text-gray-300 p-2"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {/* Image with annotations */}
            <div
              className="flex-1 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <PhotoViewer photo={selectedPhoto} />
            </div>

            {/* Footer with metadata */}
            <div className="mt-4 bg-gray-900 bg-opacity-75 rounded-lg p-4 text-white">
              <div className="flex flex-wrap gap-4 text-sm">
                {selectedPhoto.gpsLatitude && selectedPhoto.gpsLongitude && (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-primary-400"
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {formatGPS(selectedPhoto.gpsLatitude, selectedPhoto.gpsLongitude)}
                    </span>
                    <button
                      onClick={() =>
                        openInMaps(selectedPhoto.gpsLatitude!, selectedPhoto.gpsLongitude!)
                      }
                      className="text-primary-400 hover:text-primary-300 underline text-xs"
                    >
                      Open in Maps
                    </button>
                  </div>
                )}
                {selectedPhoto.annotations &&
                  (selectedPhoto.annotations.arrows.length > 0 ||
                    selectedPhoto.annotations.circles.length > 0 ||
                    selectedPhoto.annotations.text.length > 0) && (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-primary-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <span>
                        {selectedPhoto.annotations.arrows.length +
                          selectedPhoto.annotations.circles.length +
                          selectedPhoto.annotations.text.length}{' '}
                        annotatie(s)
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
