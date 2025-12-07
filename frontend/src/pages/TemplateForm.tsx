import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTemplateById,
  createTemplate,
  updateTemplate,
  CreateTemplateData,
} from '../services/template';
import Layout from '../components/Layout';

interface SubComponentForm {
  name: string;
  criterion: string;
  expectedOutcome: string;
  requiresPhoto: boolean;
  sortOrder: number;
}

interface MainComponentForm {
  name: string;
  sortOrder: number;
  subComponents: SubComponentForm[];
}

const TemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [installationType, setInstallationType] = useState<
    'woning' | 'kantoor' | 'industrie' | ''
  >('');
  const [mainComponents, setMainComponents] = useState<MainComponentForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode && id) {
      fetchTemplate();
    }
  }, [id, isEditMode]);

  const fetchTemplate = async () => {
    setIsFetching(true);
    try {
      const response = await getTemplateById(id!);
      const template = response.data.template;

      setName(template.name);
      setDescription(template.description || '');
      setInstallationType(template.installationType);

      if (template.mainComponents) {
        const formattedMainComponents = template.mainComponents.map((mc) => ({
          name: mc.name,
          sortOrder: mc.sortOrder,
          subComponents: mc.subComponents
            ? mc.subComponents.map((sc) => ({
                name: sc.name,
                criterion: sc.criterion,
                expectedOutcome: sc.expectedOutcome,
                requiresPhoto: sc.requiresPhoto,
                sortOrder: sc.sortOrder,
              }))
            : [],
        }));
        setMainComponents(formattedMainComponents);
      }
    } catch (err: any) {
      console.error('Failed to fetch template:', err);
      setError(err.response?.data?.message || 'Failed to load template');
    } finally {
      setIsFetching(false);
    }
  };

  const addMainComponent = () => {
    setMainComponents([
      ...mainComponents,
      {
        name: '',
        sortOrder: mainComponents.length + 1,
        subComponents: [],
      },
    ]);
  };

  const removeMainComponent = (index: number) => {
    const updated = mainComponents.filter((_, i) => i !== index);
    // Update sort orders
    updated.forEach((mc, i) => {
      mc.sortOrder = i + 1;
    });
    setMainComponents(updated);
  };

  const updateMainComponent = (index: number, field: string, value: any) => {
    const updated = [...mainComponents];
    (updated[index] as any)[field] = value;
    setMainComponents(updated);
  };

  const addSubComponent = (mainIndex: number) => {
    const updated = [...mainComponents];
    updated[mainIndex].subComponents.push({
      name: '',
      criterion: '',
      expectedOutcome: '',
      requiresPhoto: false,
      sortOrder: updated[mainIndex].subComponents.length + 1,
    });
    setMainComponents(updated);
  };

  const removeSubComponent = (mainIndex: number, subIndex: number) => {
    const updated = [...mainComponents];
    updated[mainIndex].subComponents = updated[mainIndex].subComponents.filter(
      (_, i) => i !== subIndex
    );
    // Update sort orders
    updated[mainIndex].subComponents.forEach((sc, i) => {
      sc.sortOrder = i + 1;
    });
    setMainComponents(updated);
  };

  const updateSubComponent = (
    mainIndex: number,
    subIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...mainComponents];
    (updated[mainIndex].subComponents[subIndex] as any)[field] = value;
    setMainComponents(updated);
  };

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Template name is required');
    }

    if (mainComponents.length === 0) {
      errors.push('At least one main component is required');
    }

    mainComponents.forEach((mc, mcIndex) => {
      if (!mc.name.trim()) {
        errors.push(`Main component #${mcIndex + 1} name is required`);
      }

      if (mc.subComponents.length === 0) {
        errors.push(`Main component "${mc.name || '#' + (mcIndex + 1)}" must have at least one sub-component`);
      }

      mc.subComponents.forEach((sc, scIndex) => {
        if (!sc.name.trim()) {
          errors.push(
            `Sub-component #${scIndex + 1} in "${mc.name || 'Main #' + (mcIndex + 1)}" needs a name`
          );
        }
        if (!sc.criterion.trim()) {
          errors.push(
            `Sub-component "${sc.name || '#' + (scIndex + 1)}" in "${mc.name || 'Main #' + (mcIndex + 1)}" needs a criterion`
          );
        }
        if (!sc.expectedOutcome.trim()) {
          errors.push(
            `Sub-component "${sc.name || '#' + (scIndex + 1)}" in "${mc.name || 'Main #' + (mcIndex + 1)}" needs an expected outcome`
          );
        }
      });
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    const data: CreateTemplateData = {
      name,
      description: description || undefined,
      installationType: installationType as 'woning' | 'kantoor' | 'industrie',
      mainComponents: mainComponents.map((mc) => ({
        name: mc.name,
        sortOrder: mc.sortOrder,
        subComponents: mc.subComponents.map((sc) => ({
          name: sc.name,
          criterion: sc.criterion,
          expectedOutcome: sc.expectedOutcome,
          requiresPhoto: sc.requiresPhoto,
          sortOrder: sc.sortOrder,
        })),
      })),
    };

    try {
      if (isEditMode) {
        await updateTemplate(id!, data);
      } else {
        await createTemplate(data);
      }
      navigate('/templates');
    } catch (err: any) {
      console.error('Failed to save template:', err);
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
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

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Template Bewerken' : 'Nieuw Template'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {isEditMode
              ? 'Update de template details en componenten'
              : 'Maak een nieuw inspectie template'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Messages */}
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

          {validationErrors.length > 0 && (
            <div className="mb-6 rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Validation Errors
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Template Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Standard Residential Inspection"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe this template..."
                />
              </div>

              <div>
                <label
                  htmlFor="installationType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Installation Type *
                </label>
                <select
                  id="installationType"
                  value={installationType}
                  onChange={(e) =>
                    setInstallationType(
                      e.target.value as
                        | 'woning'
                        | 'kantoor'
                        | 'industrie'
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="woning">Woning (Residential)</option>
                  <option value="kantoor">Kantoor (Commercial)</option>
                  <option value="industrie">Industrie (Industrial)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Components */}
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Main Components
              </h2>
              <button
                type="button"
                onClick={addMainComponent}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg
                  className="h-5 w-5 mr-1"
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
                Add Main Component
              </button>
            </div>

            {mainComponents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No main components yet. Click "Add Main Component" to get started.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {mainComponents.map((mainComp, mcIndex) => (
                  <div
                    key={mcIndex}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Main Component #{mcIndex + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeMainComponent(mcIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg
                          className="h-5 w-5"
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
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={mainComp.name}
                        onChange={(e) =>
                          updateMainComponent(mcIndex, 'name', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Distribution Board"
                        required
                      />
                    </div>

                    {/* Sub-Components */}
                    <div className="ml-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">
                          Sub-Components
                        </h4>
                        <button
                          type="button"
                          onClick={() => addSubComponent(mcIndex)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200"
                        >
                          <svg
                            className="h-4 w-4 mr-1"
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
                          Add Sub-Component
                        </button>
                      </div>

                      {mainComp.subComponents.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No sub-components. Add at least one.
                        </p>
                      ) : (
                        mainComp.subComponents.map((subComp, scIndex) => (
                          <div
                            key={scIndex}
                            className="border border-gray-300 rounded-lg p-3 bg-white"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                Sub-Component #{scIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeSubComponent(mcIndex, scIndex)
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <svg
                                  className="h-4 w-4"
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

                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Name *
                                </label>
                                <input
                                  type="text"
                                  value={subComp.name}
                                  onChange={(e) =>
                                    updateSubComponent(
                                      mcIndex,
                                      scIndex,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  placeholder="e.g., Main Switch"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Criterion *
                                </label>
                                <input
                                  type="text"
                                  value={subComp.criterion}
                                  onChange={(e) =>
                                    updateSubComponent(
                                      mcIndex,
                                      scIndex,
                                      'criterion',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  placeholder="What to check..."
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Expected Outcome *
                                </label>
                                <input
                                  type="text"
                                  value={subComp.expectedOutcome}
                                  onChange={(e) =>
                                    updateSubComponent(
                                      mcIndex,
                                      scIndex,
                                      'expectedOutcome',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  placeholder="Expected result..."
                                  required
                                />
                              </div>

                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`photo-${mcIndex}-${scIndex}`}
                                  checked={subComp.requiresPhoto}
                                  onChange={(e) =>
                                    updateSubComponent(
                                      mcIndex,
                                      scIndex,
                                      'requiresPhoto',
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`photo-${mcIndex}-${scIndex}`}
                                  className="ml-2 block text-sm text-gray-700"
                                >
                                  Requires Photo
                                </label>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : isEditMode ? (
                'Update Template'
              ) : (
                'Create Template'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default TemplateForm;
