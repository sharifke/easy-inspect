import React, { useState, useRef, useEffect } from 'react';
import {
  isCameraSupported,
  requestCameraAccess,
  capturePhotoFromStream,
  resizeImage,
  getCurrentPosition,
} from '../../services/photoService';

interface PhotoCaptureProps {
  onCapture: (file: File, gpsData?: { latitude: number; longitude: number }) => Promise<void>;
  onCancel: () => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onCapture, onCancel }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On-screen debug logger
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-10), `[${timestamp}] ${message}`]); // Keep last 10 logs
    console.log(message);
  };

  useEffect(() => {
    // Check if camera is supported
    const cameraSupported = isCameraSupported();
    addLog(`Camera supported: ${cameraSupported}`);
    addLog(`navigator.mediaDevices: ${!!navigator.mediaDevices}`);
    addLog(`getUserMedia: ${!!navigator.mediaDevices?.getUserMedia}`);
    setHasCamera(cameraSupported);

    // Start camera on mount
    if (cameraSupported) {
      addLog('Starting camera...');
      startCamera();
    } else {
      addLog('Camera not supported on this device/browser');
    }

    // Cleanup on unmount
    return () => {
      addLog('Component unmounting, stopping camera');
      stopCamera();
    };
  }, [facingMode]);

  useEffect(() => {
    // Attach stream to video element when stream becomes available
    if (stream && videoRef.current) {
      addLog('useEffect: Attaching stream to video element');
      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        addLog(`Video metadata loaded: ${video.videoWidth}x${video.videoHeight}`);
      };

      video.play().then(() => {
        addLog('Video play() succeeded');
      }).catch(err => {
        addLog(`Video play() failed: ${err.message}`);
      });
    }
  }, [stream]);

  const startCamera = async () => {
    addLog('startCamera called, setting isLoading=true');
    setIsLoading(true);
    setError('');

    try {
      addLog(`Requesting camera access with facingMode: ${facingMode}`);
      const mediaStream = await requestCameraAccess(facingMode);
      addLog('Camera access granted');
      addLog(`Stream active: ${mediaStream.active}`);
      addLog(`Stream tracks: ${mediaStream.getTracks().length}`);

      setStream(mediaStream);
      addLog('Stream state set');

      // NOTE: Stream attachment is now handled by the useEffect hook
      // dependent on [stream], because the video element might not exist yet.

      addLog('startCamera completed successfully');
    } catch (err: any) {
      addLog(`Failed to start camera: ${err.message}`);
      addLog(`Error name: ${err.name}`);

      // Provide more specific error messages
      let errorMessage = 'Kon camera niet starten';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera toegang geweigerd. Geef toestemming in browser instellingen.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Geen camera gevonden op dit apparaat.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is in gebruik door een andere app. Sluit andere camera apps.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera ondersteunt de gevraagde instellingen niet.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Camera geblokkeerd om beveiligingsredenen. Gebruik HTTPS of geef toestemming.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setHasCamera(false);
    } finally {
      addLog('Setting isLoading=false in finally block');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;

    try {
      setIsLoading(true);
      setError('');

      // Capture photo from video stream
      const blob = await capturePhotoFromStream(videoRef.current);
      if (!blob) {
        throw new Error('Failed to capture photo');
      }

      // Create data URL for preview
      const dataUrl = URL.createObjectURL(blob);
      setCapturedImage(dataUrl);

      // Stop camera
      stopCamera();
    } catch (err: any) {
      console.error('Failed to capture photo:', err);
      setError('Kon foto niet vastleggen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    startCamera();
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    try {
      setIsLoading(true);
      setError('');

      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Resize image
      const resizedBlob = await resizeImage(
        new File([blob], 'photo.jpg', { type: 'image/jpeg' }),
        2048,
        2048
      );

      // Get GPS coordinates
      let gpsData: { latitude: number; longitude: number } | undefined;
      try {
        const position = await getCurrentPosition();
        if (position.latitude !== 0 && position.longitude !== 0) {
          gpsData = position;
        }
      } catch (err) {
        console.warn('Could not get GPS position:', err);
      }

      // Create file from resized blob
      const file = new File([resizedBlob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      // Call onCapture callback
      await onCapture(file, gpsData);

      // Cleanup
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    } catch (err: any) {
      console.error('Failed to process photo:', err);
      setError('Kon foto niet verwerken');
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Selecteer een geldig afbeeldingsbestand');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Resize image
      const resizedBlob = await resizeImage(file, 2048, 2048);

      // Get GPS coordinates
      let gpsData: { latitude: number; longitude: number } | undefined;
      try {
        const position = await getCurrentPosition();
        if (position.latitude !== 0 && position.longitude !== 0) {
          gpsData = position;
        }
      } catch (err) {
        console.warn('Could not get GPS position:', err);
      }

      // Create file from resized blob
      const resizedFile = new File([resizedBlob], file.name, {
        type: 'image/jpeg',
      });

      // Call onCapture callback
      await onCapture(resizedFile, gpsData);
    } catch (err: any) {
      console.error('Failed to process file:', err);
      setError('Kon bestand niet verwerken');
      setIsLoading(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black h-[100dvh] w-screen overflow-hidden">
      <div className="h-full flex flex-col relative" style={{ maxHeight: '100dvh' }}>
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center z-10 shrink-0">
          <h2 className="text-lg font-semibold">Foto maken</h2>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-300"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Camera View or Captured Image */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg z-10 shadow-lg">
              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Camera Fout</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Debug info - shows camera state and logs */}
          {!capturedImage && !error && showDebug && (
            <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded text-xs z-10 max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-2 border-b border-gray-600 pb-1">
                <div className="font-bold">Camera Status</div>
                <button
                  onClick={() => setShowDebug(false)}
                  className="text-white bg-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-600"
                >
                  Hide
                </button>
              </div>
              <div>Status: {isLoading ? 'Laden...' : stream ? 'Camera actief ✓' : 'Camera inactief'}</div>
              <div>isLoading: {String(isLoading)} | stream: {stream ? 'YES' : 'NO'}</div>
              {stream && <div>Tracks: {stream.getTracks().length}</div>}
              <div>Button disabled: {String(isLoading || !stream)}</div>
              {videoRef.current && <div>Video readyState: {videoRef.current.readyState}</div>}

              <div className="font-bold mt-3 mb-2 border-b border-gray-600 pb-1">Debug Logs</div>
              <div className="space-y-1">
                {debugLogs.length === 0 ? (
                  <div className="text-gray-400">No logs yet...</div>
                ) : (
                  debugLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono break-all">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Show debug button when hidden */}
          {!capturedImage && !error && !showDebug && (
            <button
              onClick={() => setShowDebug(true)}
              className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-2 rounded text-xs z-10 hover:bg-gray-600"
            >
              Show Debug
            </button>
          )}

          {capturedImage ? (
            // Show captured image
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-full object-contain"
            />
          ) : hasCamera && stream ? (
            // Show camera feed
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ minHeight: '200px', backgroundColor: '#000' }}
            />
          ) : (
            // Fallback: No camera available
            <div className="text-center text-white p-8">
              <svg
                className="mx-auto h-16 w-16 mb-4 text-gray-400"
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
              <p className="text-lg mb-4">Camera niet beschikbaar</p>
              <p className="text-sm text-gray-400 mb-6">
                Gebruik de knop hieronder om een foto te selecteren
              </p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p>Bezig met verwerken...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 p-6 z-10 shrink-0 safe-pb" style={{ minHeight: '120px' }}>
          {capturedImage ? (
            // Captured image controls
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleRetake}
                className="flex-1 max-w-xs px-6 py-4 bg-gray-700 text-white text-lg font-medium rounded-lg hover:bg-gray-600 active:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Opnieuw
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 max-w-xs px-6 py-4 bg-primary-600 text-white text-lg font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Uploaden...' : 'Gebruiken'}
              </button>
            </div>
          ) : (
            // Camera controls
            <div className="flex justify-center items-center space-x-6">
              {/* Select from file */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#374151',
                  color: 'white'
                }}
                disabled={isLoading}
                title="Selecteer foto"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Capture button */}
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full flex items-center justify-center transition-colors border-4 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'white',
                  borderColor: 'black'
                }}
                disabled={isLoading || !stream}
                title="Foto maken"
              >
                <div className="w-16 h-16 rounded-full border-2" style={{ backgroundColor: 'white', borderColor: 'gray' }}></div>
              </button>

              {/* Switch camera */}
              {hasCamera && stream && (
                <button
                  onClick={toggleCamera}
                  className="w-14 h-14 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#374151',
                    color: 'white'
                  }}
                  disabled={isLoading}
                  title="Wissel camera"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoCapture;
