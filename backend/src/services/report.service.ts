import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { ReportTemplateService } from './report-template.service';

/**
 * Report Service
 * Handles PDF report generation for inspections using Puppeteer
 */
export class ReportService {
  /**
   * Generate PDF report for an inspection
   */
  static async generateInspectionReport(inspectionId: string): Promise<Buffer> {
    const startTime = Date.now();
    console.log('[PDF] Starting PDF generation for inspection:', inspectionId);

    // Fetch all required data
    const reportData = await this.fetchReportData(inspectionId);
    console.log('[PDF] Data fetched in', Date.now() - startTime, 'ms');

    // Generate HTML from template
    const html = ReportTemplateService.generateHTML(reportData);
    console.log('[PDF] HTML generated in', Date.now() - startTime, 'ms');

    // Convert HTML to PDF using Puppeteer
    const pdfBuffer = await this.convertHTMLtoPDF(html);
    console.log('[PDF] PDF generated in', Date.now() - startTime, 'ms');

    return pdfBuffer;
  }

  /**
   * Fetch all data needed for the report
   */
  private static async fetchReportData(inspectionId: string) {
    // Fetch inspection with all related data
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        template: {
          include: {
            mainComponents: {
              include: {
                subComponents: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        inspector: true,
        results: {
          include: {
            subComponent: {
              include: {
                mainComponent: true,
              },
            },
            photos: {
              orderBy: { takenAt: 'asc' },
            },
          },
        },
      },
    });

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Convert photo paths to base64 data URLs
    const results = inspection.results.map((result) => ({
      ...result,
      photos: result.photos.map((photo) => {
        console.log('[PDF] Photo ID:', photo.id, '| Annotations:', photo.annotations);
        return {
          ...photo,
          path: this.resolvePhotoPath(photo.path),
          thumbnailPath: photo.thumbnailPath ? this.resolvePhotoPath(photo.thumbnailPath) : null,
          base64Data: this.imageToBase64(photo.thumbnailPath || photo.path),
        };
      }),
    }));

    return {
      inspection,
      template: inspection.template,
      inspector: inspection.inspector,
      results,
    };
  }

  /**
   * Resolve photo path to absolute path
   */
  private static resolvePhotoPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    return path.join(__dirname, '../../uploads', relativePath);
  }

  /**
   * Convert image file to base64 data URL
   */
  private static imageToBase64(relativePath: string): string {
    try {
      const absolutePath = this.resolvePhotoPath(relativePath);

      if (!fs.existsSync(absolutePath)) {
        console.error(`Image not found: ${absolutePath}`);
        return '';
      }

      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Image = imageBuffer.toString('base64');

      // Detect mime type from file extension
      const ext = path.extname(absolutePath).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';

      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error(`Error converting image to base64:`, error);
      return '';
    }
  }

  /**
   * Convert HTML to PDF using Puppeteer
   */
  private static async convertHTMLtoPDF(html: string): Promise<Buffer> {
    let browser;

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Set content with proper encoding
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate PDF with specific settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('[PDF] Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
