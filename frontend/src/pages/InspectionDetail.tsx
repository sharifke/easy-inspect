import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInspectionById } from '../services/inspectionService';
import type { Inspection, InspectionResult, Classification } from '../types/inspection';
import Layout from '../components/Layout';

const InspectionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

      // If inspection is not completed, redirect to execution page
      if (inspectionData.status !== 'COMPLETED') {
        navigate(`/inspections/${inspectionId}/execute`);
        return;
      }

      setInspection(inspectionData);
    } catch (err: any) {
      console.error('Failed to fetch inspection:', err);
      setError(err.response?.data?.message || 'Failed to load inspection');
    } finally {
      setIsLoading(false);
    }
  };

  const getResultForSubComponent = (subComponentId: string): InspectionResult | undefined => {
    return inspection?.results?.find((r) => r.subComponentId === subComponentId);
  };

  const getRatingLabel = (rating: number) => {
    const labels = ['N/A', 'Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
    return labels[rating] || 'N/A';
  };

  const getRatingColor = (rating: number) => {
    if (rating === 0) return 'text-gray-600';
    if (rating <= 2) return 'text-red-600';
    if (rating === 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getClassificationLabel = (classification: Classification) => {
    const labels: Record<Classification, string> = {
      C1: 'C1 - Critical',
      C2: 'C2 - Major',
      C3: 'C3 - Minor',
      ACCEPTABLE: 'Acceptable',
      N_A: 'N/A',
    };
    return labels[classification] || classification;
  };

  const getClassificationColor = (classification: Classification) => {
    switch (classification) {
      case 'C1':
        return 'bg-red-100 text-red-800';
      case 'C2':
        return 'bg-orange-100 text-orange-800';
      case 'C3':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTABLE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportPDF = async () => {
    if (!inspection) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Show loading state
      setIsLoading(true);
      setError('');

      // Fetch PDF from backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/reports/inspections/${inspection.id}/pdf`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF report');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspectie-rapport-${inspection.id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setError(err.message || 'Failed to export PDF report');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading inspection report...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!inspection) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspectie Rapport</h1>
          <p className="mt-1 text-sm text-gray-600">
            Afgerond op {inspection.completedAt ? formatDate(inspection.completedAt) : 'N/A'}
          </p>
        </div>
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

        {/* Action Bar */}
        <div className="mb-6 flex justify-end gap-3">
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate(`/inspections/${id}/execute`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Inspectie Bewerken
            </button>
          )}
          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isLoading ? 'Genereren...' : 'Download PDF Rapport'}
          </button>
        </div>

        {/* Inspection Information */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Inspection Information</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Completed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{inspection.clientName}</dd>
                </div>
                {inspection.clientEmail && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{inspection.clientEmail}</dd>
                  </div>
                )}
                {inspection.clientPhone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{inspection.clientPhone}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">{inspection.location}</dd>
                </div>
                {inspection.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900">{inspection.address}</dd>
                  </div>
                )}
                {(inspection.city || inspection.postalCode) && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">City / Postal Code</dt>
                    <dd className="text-sm text-gray-900">
                      {inspection.city} {inspection.postalCode}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Template & Inspector */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Template</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Template Name</dt>
                  <dd className="text-sm text-gray-900">{inspection.template?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Installation Type</dt>
                  <dd className="text-sm text-gray-900">
                    {inspection.template?.installationType}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">{formatDate(inspection.createdAt)}</dd>
                </div>
                {inspection.completedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Completed</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(inspection.completedAt)}
                    </dd>
                  </div>
                )}
                {inspection.scheduledFor && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Scheduled For</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDate(inspection.scheduledFor)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Inspector */}
          {inspection.inspector && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inspector</h3>
              <p className="text-sm text-gray-900">
                {inspection.inspector.firstName} {inspection.inspector.lastName}
                {' - '}
                <span className="text-gray-600">{inspection.inspector.email}</span>
              </p>
            </div>
          )}
        </div>

        {/* Inspection Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Inspection Results</h2>

          {inspection.template?.mainComponents
            ?.sort((a, b) => a.sortOrder - b.sortOrder)
            .map((mainComponent) => (
              <div key={mainComponent.id} className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {mainComponent.name}
                </h3>

                <div className="space-y-4">
                  {mainComponent.subComponents
                    ?.sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((subComponent) => {
                      const result = getResultForSubComponent(subComponent.id);

                      return (
                        <div
                          key={subComponent.id}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <h4 className="font-medium text-gray-900 mb-2">
                            {subComponent.name}
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 mb-1">
                                <span className="font-medium">Criterion:</span>{' '}
                                {subComponent.criterion}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Expected:</span>{' '}
                                {subComponent.expectedOutcome}
                              </p>
                            </div>

                            <div>
                              {result ? (
                                <>
                                  <div className="mb-2">
                                    <span className="text-gray-600 font-medium">Rating: </span>
                                    <span
                                      className={`font-semibold ${getRatingColor(result.rating)}`}
                                    >
                                      {result.rating} - {getRatingLabel(result.rating)}
                                    </span>
                                  </div>
                                  <div className="mb-2">
                                    <span className="text-gray-600 font-medium">
                                      Classification:{' '}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getClassificationColor(
                                        result.classification
                                      )}`}
                                    >
                                      {getClassificationLabel(result.classification)}
                                    </span>
                                  </div>
                                  {result.notes && (
                                    <div className="mt-2">
                                      <p className="text-gray-600 font-medium mb-1">Notes:</p>
                                      <p className="text-gray-900 text-sm">{result.notes}</p>
                                    </div>
                                  )}
                                  
                                  {/* Photos Display */}
                                  {result.photos && result.photos.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                      <p className="text-gray-600 font-medium mb-2">Photos:</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        {result.photos.map((photo) => (
                                          <div 
                                            key={photo.id} 
                                            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                                          >
                                            <img
                                              src={photo.thumbnailUrl || photo.url}
                                              alt={photo.filename}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-gray-500 italic">No result recorded</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>

        {/* Overall Notes and Recommendations */}
        {(inspection.overallNotes || inspection.recommendations) && (
          <div className="card mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Overall Notes and Recommendations
            </h2>
            {inspection.overallNotes && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{inspection.overallNotes}</p>
              </div>
            )}
            {inspection.recommendations && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{inspection.recommendations}</p>
              </div>
            )}
          </div>
        )}

        {/* Signature */}
        {inspection.signature && (
          <div className="card mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Signature</h2>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <img
                src={inspection.signature.signatureData}
                alt="Signature"
                className="max-w-md h-32 border border-gray-200"
              />
              <p className="mt-2 text-sm text-gray-600">
                Signed by: <span className="font-medium">{inspection.signature.signedBy}</span>
              </p>
              {inspection.signature.signedAt && (
                <p className="text-sm text-gray-600">
                  Date: {formatDate(inspection.signature.signedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/inspections')}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Inspections
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default InspectionDetail;
