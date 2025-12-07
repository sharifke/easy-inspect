import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Get all inspections for the authenticated user
 * GET /api/inspections
 * - Admins see all inspections
 * - Inspectors see only their own inspections
 * - Support filtering by status (DRAFT, IN_PROGRESS, COMPLETED)
 * - Order by most recent first
 */
export const getAllInspections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { status } = req.query;

    // Build where clause based on role
    const whereClause: any = {};

    // If user is not admin, only show their inspections
    if (user.role !== 'ADMIN') {
      whereClause.inspectorId = user.userId;
    }

    // Add status filter if provided
    if (status && typeof status === 'string') {
      const validStatuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }
      whereClause.status = status;
    }

    const inspections = await prisma.inspection.findMany({
      where: whereClause,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            installationType: true,
          },
        },
        inspector: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        results: {
          include: {
            subComponent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      status: 'success',
      data: { inspections },
      message: `Found ${inspections.length} inspection(s)`,
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch inspections',
    });
  }
};

/**
 * Get single inspection with full details
 * GET /api/inspections/:id
 * - Include template, mainComponents, subComponents
 * - Include all inspection results with ratings, classifications, notes
 * - Include photos (if any exist in results)
 * - Authorization: Users can only view their own inspections (admins can view all)
 */
export const getInspectionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { id } = req.params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        template: {
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
        },
        inspector: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        results: {
          include: {
            subComponent: {
              select: {
                id: true,
                name: true,
                criterion: true,
                expectedOutcome: true,
              },
            },
            photos: true,
          },
        },
      },
    });

    if (!inspection) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
      });
      return;
    }

    // Authorization check: Users can only view their own inspections (unless admin)
    if (user.role !== 'ADMIN' && inspection.inspectorId !== user.userId) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this inspection',
      });
      return;
    }

    // Transform photos to include relative URLs
    const cacheBuster = Date.now();

    const inspectionWithUrls = {
      ...inspection,
      results: inspection.results.map((result) => ({
        ...result,
        photos: result.photos.map((photo) => ({
          ...photo,
          url: `/uploads/${photo.path}?t=${cacheBuster}`,
          thumbnailUrl: photo.thumbnailPath
            ? `/uploads/${photo.thumbnailPath}?t=${cacheBuster}`
            : null,
          annotations: typeof photo.annotations === 'string'
            ? JSON.parse(photo.annotations)
            : photo.annotations,
        })),
      })),
    };

    res.status(200).json({
      status: 'success',
      data: { inspection: inspectionWithUrls },
      message: 'Inspection retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch inspection',
    });
  }
};

/**
 * Create new inspection from template
 * POST /api/inspections
 * - Required fields: templateId, clientName, location
 * - Optional fields: clientEmail, clientPhone, address, city, postalCode, scheduledFor
 * - Set inspectorId from authenticated user (req.user.userId)
 * - Set status to "DRAFT"
 * - Set startedAt to current timestamp
 * - Validate that template exists and is active
 */
export const createInspection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const {
      templateId,
      clientName,
      location,
      clientEmail,
      clientPhone,
      address,
      city,
      postalCode,
      scheduledFor,
    } = req.body;

    // Validation
    if (!templateId || !clientName || !location) {
      res.status(400).json({
        status: 'error',
        message: 'templateId, clientName, and location are required',
      });
      return;
    }

    // Validate that template exists and is active
    const template = await prisma.inspectionTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        name: true,
        active: true,
        installationType: true,
      },
    });

    if (!template) {
      res.status(404).json({
        status: 'error',
        message: 'Template not found',
      });
      return;
    }

    if (!template.active) {
      res.status(400).json({
        status: 'error',
        message: 'Cannot create inspection from inactive template',
      });
      return;
    }

    // Create inspection
    const inspection = await prisma.inspection.create({
      data: {
        templateId,
        inspectorId: user.userId,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        location,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        status: 'DRAFT',
        startedAt: new Date(),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            installationType: true,
          },
        },
        inspector: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { inspection },
      message: 'Inspection created successfully',
    });
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create inspection',
    });
  }
};

/**
 * Update inspection
 * PUT /api/inspections/:id
 * - Allow updating client info, location, status, notes, recommendations
 * - Only allow inspector who created it (or admin) to update
 * - Cannot update completed inspections
 * - Validate status transitions (DRAFT -> IN_PROGRESS -> COMPLETED)
 */
export const updateInspection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { id } = req.params;
    const {
      clientName,
      clientEmail,
      clientPhone,
      location,
      address,
      city,
      postalCode,
      status,
      scheduledFor,
      overallNotes,
      recommendations,
    } = req.body;

    // Check if inspection exists
    const existingInspection = await prisma.inspection.findUnique({
      where: { id },
    });

    if (!existingInspection) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
      });
      return;
    }

    // Authorization check: Only inspector who created it (or admin) can update
    if (user.role !== 'ADMIN' && existingInspection.inspectorId !== user.userId) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this inspection',
      });
      return;
    }

    // Cannot update completed inspections (unless admin)
    if (existingInspection.status === 'COMPLETED' && user.role !== 'ADMIN') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot update completed inspections. Only admins can edit completed inspections.',
      });
      return;
    }

    // Validate status transitions if status is being updated
    if (status && status !== existingInspection.status) {
      const validStatuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          status: 'error',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      // Validate status transition logic
      if (existingInspection.status === 'DRAFT' && status === 'COMPLETED') {
        res.status(400).json({
          status: 'error',
          message: 'Cannot change status from DRAFT to COMPLETED directly. Must go through IN_PROGRESS first.',
        });
        return;
      }

      if (existingInspection.status === 'IN_PROGRESS' && status === 'DRAFT') {
        res.status(400).json({
          status: 'error',
          message: 'Cannot change status from IN_PROGRESS back to DRAFT',
        });
        return;
      }

      if (existingInspection.status === 'COMPLETED' && status !== 'COMPLETED' && user.role !== 'ADMIN') {
        res.status(400).json({
          status: 'error',
          message: 'Cannot change status of completed inspection. Only admins can modify completed inspections.',
        });
        return;
      }
    }

    // Build update data object
    const updateData: any = {};
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (location !== undefined) updateData.location = location;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (status !== undefined) updateData.status = status;
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
    if (overallNotes !== undefined) updateData.overallNotes = overallNotes;
    if (recommendations !== undefined) updateData.recommendations = recommendations;

    // Update inspection
    const updatedInspection = await prisma.inspection.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            installationType: true,
          },
        },
        inspector: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { inspection: updatedInspection },
      message: 'Inspection updated successfully',
    });
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update inspection',
    });
  }
};

/**
 * Delete inspection
 * DELETE /api/inspections/:id
 * - Only allow deletion of DRAFT inspections
 * - Only inspector who created it (or admin) can delete
 * - Hard delete (not soft delete)
 */
export const deleteInspection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { id } = req.params;

    // Check if inspection exists
    const existingInspection = await prisma.inspection.findUnique({
      where: { id },
    });

    if (!existingInspection) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
      });
      return;
    }

    // Authorization check: Only inspector who created it (or admin) can delete
    if (user.role !== 'ADMIN' && existingInspection.inspectorId !== user.userId) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this inspection',
      });
      return;
    }

    // Only allow deletion of DRAFT inspections
    if (existingInspection.status !== 'DRAFT') {
      res.status(400).json({
        status: 'error',
        message: 'Only DRAFT inspections can be deleted',
      });
      return;
    }

    // Hard delete
    await prisma.inspection.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Inspection deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete inspection',
    });
  }
};

/**
 * Save/update inspection result for a sub-component
 * POST /api/inspections/:id/results
 * - Required: subComponentId, rating (0-5)
 * - Optional: classification (C1, C2, C3, ACCEPTABLE, NA), notes
 * - Create or update result (upsert pattern)
 * - Validate that subComponent belongs to the inspection's template
 */
export const saveInspectionResult = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('=== saveInspectionResult called ===');
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);

    const user = (req as any).user;
    if (!user) {
      console.log('No user found');
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { id } = req.params;
    const { subComponentId, rating, classification, notes } = req.body;
    console.log('Parsed data:', { id, subComponentId, rating, classification, notes });

    // Validation
    if (!subComponentId || rating === undefined) {
      console.log('Validation failed: missing subComponentId or rating');
      res.status(400).json({
        status: 'error',
        message: 'subComponentId and rating are required',
      });
      return;
    }

    // Validate rating (0-5)
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      res.status(400).json({
        status: 'error',
        message: 'Rating must be a number between 0 and 5',
      });
      return;
    }

    // Validate classification if provided
    if (classification) {
      const validClassifications = ['C1', 'C2', 'C3', 'ACCEPTABLE', 'N_A'];
      if (!validClassifications.includes(classification)) {
        res.status(400).json({
          status: 'error',
          message: `Invalid classification. Must be one of: ${validClassifications.join(', ')}`,
        });
        return;
      }
    }

    // Check if inspection exists
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            mainComponents: {
              include: {
                subComponents: true,
              },
            },
          },
        },
      },
    });

    if (!inspection) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
      });
      return;
    }

    // Authorization check
    if (user.role !== 'ADMIN' && inspection.inspectorId !== user.userId) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this inspection',
      });
      return;
    }

    // Cannot update results for completed inspections (admins can edit)
    if (inspection.status === 'COMPLETED' && user.role !== 'ADMIN') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot update results for completed inspections. Only admins can edit completed inspections.',
      });
      return;
    }

    // Validate that subComponent belongs to the inspection's template
    const allSubComponents = inspection.template.mainComponents.flatMap(
      (mc) => mc.subComponents
    );
    const subComponentExists = allSubComponents.some(
      (sc) => sc.id === subComponentId
    );

    if (!subComponentExists) {
      console.log('SubComponent validation failed!');
      console.log('Requested subComponentId:', subComponentId);
      console.log('Valid subComponentIds:', allSubComponents.map(sc => sc.id));
      res.status(400).json({
        status: 'error',
        message: 'SubComponent does not belong to this inspection template',
      });
      return;
    }

    // Upsert inspection result
    const result = await prisma.inspectionResult.upsert({
      where: {
        inspectionId_subComponentId: {
          inspectionId: id,
          subComponentId,
        },
      },
      update: {
        rating,
        classification: classification || null,
        notes: notes || null,
      },
      create: {
        inspectionId: id,
        subComponentId,
        rating,
        classification: classification || null,
        notes: notes || null,
      },
      include: {
        subComponent: {
          select: {
            id: true,
            name: true,
            criterion: true,
          },
        },
        photos: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { result },
      message: 'Inspection result saved successfully',
    });
  } catch (error) {
    console.error('Error saving inspection result:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save inspection result',
    });
  }
};

/**
 * Mark inspection as completed
 * PUT /api/inspections/:id/complete
 * - Set status to "COMPLETED"
 * - Set completedAt to current timestamp
 * - Validate all required sub-components have results
 */
export const completeInspection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { id } = req.params;

    // Get inspection with template and results
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            mainComponents: {
              include: {
                subComponents: true,
              },
            },
          },
        },
        results: true,
      },
    });

    if (!inspection) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
      });
      return;
    }

    // Authorization check
    if (user.role !== 'ADMIN' && inspection.inspectorId !== user.userId) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to complete this inspection',
      });
      return;
    }

    // Check if already completed
    if (inspection.status === 'COMPLETED') {
      res.status(400).json({
        status: 'error',
        message: 'Inspection is already completed',
      });
      return;
    }

    // Validate all sub-components have results
    const allSubComponents = inspection.template.mainComponents.flatMap(
      (mc) => mc.subComponents
    );
    const resultSubComponentIds = new Set(
      inspection.results.map((r) => r.subComponentId)
    );

    const missingResults = allSubComponents.filter(
      (sc) => !resultSubComponentIds.has(sc.id)
    );

    if (missingResults.length > 0) {
      res.status(400).json({
        status: 'error',
        message: `Cannot complete inspection. Missing results for ${missingResults.length} sub-component(s)`,
        data: {
          missingSubComponents: missingResults.map((sc) => ({
            id: sc.id,
            name: sc.name,
          })),
        },
      });
      return;
    }

    // Update inspection to completed
    const completedInspection = await prisma.inspection.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            installationType: true,
          },
        },
        inspector: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        results: {
          include: {
            subComponent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { inspection: completedInspection },
      message: 'Inspection completed successfully',
    });
  } catch (error) {
    console.error('Error completing inspection:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete inspection',
    });
  }
};

/**
 * Save signature for completed inspection
 * POST /api/inspections/:id/signature
 * - Required: signatureData (base64 string), signedBy (name)
 * - Set signedAt to current timestamp
 * - Can only sign COMPLETED inspections
 */
export const saveSignature = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { id } = req.params;
    const { signatureData, signedBy } = req.body;

    // Validation
    if (!signatureData || !signedBy) {
      res.status(400).json({
        status: 'error',
        message: 'signatureData and signedBy are required',
      });
      return;
    }

    // Check if inspection exists
    const inspection = await prisma.inspection.findUnique({
      where: { id },
    });

    if (!inspection) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
      });
      return;
    }

    // Authorization check
    if (user.role !== 'ADMIN' && inspection.inspectorId !== user.userId) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to sign this inspection',
      });
      return;
    }

    // Can only sign COMPLETED inspections
    if (inspection.status !== 'COMPLETED') {
      res.status(400).json({
        status: 'error',
        message: 'Only COMPLETED inspections can be signed',
      });
      return;
    }

    // Save signature
    const signedInspection = await prisma.inspection.update({
      where: { id },
      data: {
        signatureData,
        signedBy,
        signedAt: new Date(),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            installationType: true,
          },
        },
        inspector: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: { inspection: signedInspection },
      message: 'Signature saved successfully',
    });
  } catch (error) {
    console.error('Error saving signature:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save signature',
    });
  }
};
