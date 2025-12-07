import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getTemplateById,
  duplicateTemplate,
  Template,
  MainComponent,
  SubComponent,
} from '../services/template';
import Layout from '../components/Layout';

const TemplateDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getTemplateById(id!);
      setTemplate(response.data.template);
    } catch (err: any) {
      console.error('Failed to fetch template:', err);
      setError(err.response?.data?.message || 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    setError('');
    try {
      const response = await duplicateTemplate(id!);
      navigate(`/templates/${response.data.template.id}`);
    } catch (err: any) {
      console.error('Failed to duplicate template:', err);
      setError(err.response?.data?.message || 'Failed to duplicate template');
    } finally {
      setIsDuplicating(false);
    }
  };

  const getInstallationTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      RESIDENTIAL: 'Residential',
      COMMERCIAL: 'Commercial',
      INDUSTRIAL: 'Industrial',
      OTHER: 'Other',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading template...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !template) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 px-4">
          <div className="card max-w-md w-full text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error || 'Template not found'}</p>
            <button
              onClick={() => navigate('/templates')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Templates
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header with Back Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/templates')}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="mt-1 text-sm text-gray-600">Template Details</p>
          </div>
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

        {/* Template Info Card */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                {template.active && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
                {!template.active && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                )}
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                {getInstallationTypeLabel(template.installationType)}
              </span>
            </div>

            {isAdmin && (
              <div className="flex space-x-2">
                <button
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                </button>
                <button
                  onClick={() => navigate(`/templates/${id}/edit`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                  Edit
                </button>
              </div>
            )}
          </div>

          {template.description && (
            <p className="text-gray-600 mt-4">{template.description}</p>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-500">Main Components</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {template.mainComponents?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sub-Components</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {template.mainComponents?.reduce(
                  (acc, mc) => acc + (mc.subComponents?.length || 0),
                  0
                ) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-900">
                {template.createdAt
                  ? new Date(template.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Components */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Components Hierarchy</h3>

          {!template.mainComponents || template.mainComponents.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No components defined for this template.</p>
            </div>
          ) : (
            template.mainComponents
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((mainComp: MainComponent, mcIndex: number) => (
                <div key={mainComp.id || mcIndex} className="card">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-semibold mr-3">
                      {mcIndex + 1}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {mainComp.name}
                    </h4>
                    <span className="ml-3 text-sm text-gray-500">
                      ({mainComp.subComponents?.length || 0} sub-component
                      {(mainComp.subComponents?.length || 0) !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Sub-Components */}
                  {mainComp.subComponents && mainComp.subComponents.length > 0 ? (
                    <div className="ml-11 space-y-3">
                      {mainComp.subComponents
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((subComp: SubComponent, scIndex: number) => (
                          <div
                            key={subComp.id || scIndex}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900">
                                {scIndex + 1}. {subComp.name}
                              </h5>
                              {subComp.requiresPhoto && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  <svg
                                    className="h-3 w-3 mr-1"
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
                                  Photo Required
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">
                                  Criterion:
                                </span>
                                <p className="text-gray-600 mt-1">{subComp.criterion}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Expected Outcome:
                                </span>
                                <p className="text-gray-600 mt-1">
                                  {subComp.expectedOutcome}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="ml-11 text-sm text-gray-500 italic">
                      No sub-components defined
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TemplateDetail;
