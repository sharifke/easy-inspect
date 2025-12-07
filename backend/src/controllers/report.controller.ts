import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

export const generateInspectionReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { inspectionId } = req.params;

    if (!inspectionId) {
      res.status(400).json({
        status: 'error',
        message: 'Inspection ID is required',
      });
      return;
    }

    // Generate PDF buffer
    const pdfBuffer = await ReportService.generateInspectionReport(inspectionId);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="inspectie-rapport-${inspectionId.substring(0, 8)}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Generate report error:', error);

    if (error.message === 'Inspection not found') {
      res.status(404).json({
        status: 'error',
        message: 'Inspectie niet gevonden',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'Er is een fout opgetreden bij het genereren van het rapport',
    });
  }
};
