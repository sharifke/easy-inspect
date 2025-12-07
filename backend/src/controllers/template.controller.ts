import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Get all active inspection templates with their components
 * GET /api/templates
 */
export const getAllTemplates = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const templates = await prisma.inspectionTemplate.findMany({
      where: {
        active: true,
      },
      include: {
        mainComponents: {
          include: {
            subComponents: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      status: 'success',
      data: { templates },
      message: `Found ${templates.length} template(s)`,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch templates',
    });
  }
};

/**
 * Get single template by ID with full hierarchy
 * GET /api/templates/:id
 */
export const getTemplateById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await prisma.inspectionTemplate.findUnique({
      where: { id },
      include: {
        mainComponents: {
          include: {
            subComponents: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!template) {
      res.status(404).json({
        status: 'error',
        message: 'Template not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { template },
      message: 'Template retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch template',
    });
  }
};

/**
 * Create new inspection template with components
 * POST /api/templates
 * Admin only
 */
export const createTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, installationType, mainComponents } = req.body;

    // Validation
    if (!name || !installationType) {
      res.status(400).json({
        status: 'error',
        message: 'Name and installationType are required',
      });
      return;
    }

    // Validate installation type
    const validInstallationTypes = ['woning', 'kantoor', 'industrie'];
    if (!validInstallationTypes.includes(installationType)) {
      res.status(400).json({
        status: 'error',
        message: `Installation type must be one of: ${validInstallationTypes.join(', ')}`,
      });
      return;
    }

    // Ensure at least one main component
    if (!mainComponents || !Array.isArray(mainComponents) || mainComponents.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'At least one main component is required',
      });
      return;
    }

    // Validate main components structure
    for (const mainComp of mainComponents) {
      if (!mainComp.name) {
        res.status(400).json({
          status: 'error',
          message: 'Each main component must have a name',
        });
        return;
      }
    }

    // Create template with nested components
    const template = await prisma.inspectionTemplate.create({
      data: {
        name,
        description: description || null,
        installationType,
        active: true,
        mainComponents: {
          create: mainComponents.map((mainComp: any, index: number) => ({
            name: mainComp.name,
            description: mainComp.description || null,
            sortOrder: mainComp.sortOrder !== undefined ? mainComp.sortOrder : index,
            subComponents: {
              create: (mainComp.subComponents || []).map((subComp: any, subIndex: number) => ({
                name: subComp.name,
                criterion: subComp.criterion,
                expectedOutcome: subComp.expectedOutcome || null,
                sortOrder: subComp.sortOrder !== undefined ? subComp.sortOrder : subIndex,
                requiresPhoto: subComp.requiresPhoto || false,
              })),
            },
          })),
        },
      },
      include: {
        mainComponents: {
          include: {
            subComponents: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { template },
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create template',
    });
  }
};

/**
 * Update existing template
 * PUT /api/templates/:id
 * Admin only
 */
export const updateTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, installationType, active } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.inspectionTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      res.status(404).json({
        status: 'error',
        message: 'Template not found',
      });
      return;
    }

    // Validate installation type if provided
    if (installationType) {
      const validInstallationTypes = ['woning', 'kantoor', 'industrie'];
      if (!validInstallationTypes.includes(installationType)) {
        res.status(400).json({
          status: 'error',
          message: `Installation type must be one of: ${validInstallationTypes.join(', ')}`,
        });
        return;
      }
    }

    // Update template (basic fields only, not nested components)
    const updatedTemplate = await prisma.inspectionTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(installationType && { installationType }),
        ...(active !== undefined && { active }),
      },
      include: {
        mainComponents: {
          include: {
            subComponents: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { template: updatedTemplate },
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update template',
    });
  }
};

/**
 * Soft delete template (set active=false)
 * DELETE /api/templates/:id
 * Admin only
 */
export const deleteTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existingTemplate = await prisma.inspectionTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      res.status(404).json({
        status: 'error',
        message: 'Template not found',
      });
      return;
    }

    // Soft delete by setting active to false
    const deletedTemplate = await prisma.inspectionTemplate.update({
      where: { id },
      data: {
        active: false,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { template: deletedTemplate },
      message: 'Template deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete template',
    });
  }
};

/**
 * Duplicate/clone existing template
 * POST /api/templates/:id/duplicate
 * Admin only
 */
export const duplicateTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Fetch original template with all nested data
    const originalTemplate = await prisma.inspectionTemplate.findUnique({
      where: { id },
      include: {
        mainComponents: {
          include: {
            subComponents: true,
          },
        },
      },
    });

    if (!originalTemplate) {
      res.status(404).json({
        status: 'error',
        message: 'Template not found',
      });
      return;
    }

    // Create new template name
    const newTemplateName = name || `${originalTemplate.name} (Copy)`;

    // Duplicate template with all components
    const duplicatedTemplate = await prisma.inspectionTemplate.create({
      data: {
        name: newTemplateName,
        description: originalTemplate.description,
        installationType: originalTemplate.installationType,
        active: true,
        mainComponents: {
          create: originalTemplate.mainComponents.map((mainComp) => ({
            name: mainComp.name,
            description: mainComp.description,
            sortOrder: mainComp.sortOrder,
            subComponents: {
              create: mainComp.subComponents.map((subComp) => ({
                name: subComp.name,
                criterion: subComp.criterion,
                expectedOutcome: subComp.expectedOutcome,
                sortOrder: subComp.sortOrder,
                requiresPhoto: subComp.requiresPhoto,
              })),
            },
          })),
        },
      },
      include: {
        mainComponents: {
          include: {
            subComponents: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { template: duplicatedTemplate },
      message: 'Template duplicated successfully',
    });
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to duplicate template',
    });
  }
};
