import fs from 'fs';
import path from 'path';

/**
 * HTML Template Service for PDF Reports
 * Generates HTML templates for inspection reports
 */

interface ReportData {
  inspection: any;
  template: any;
  inspector: any;
  results: any[];
}

export class ReportTemplateService {
  /**
    * Get logo as base64
    */
  private static getLogoBase64(): string {
    try {
      // In production (Docker), path is /app/dist/assets/logo.jpg
      // In development, it might be src/assets/logo.jpg
      // We look relative to __dirname
      const possiblePaths = [
        path.join(__dirname, '../assets/logo.jpg'), // Production: dist/services/../assets -> dist/assets
        path.join(__dirname, '../../src/assets/logo.jpg'), // Dev: src/services/../../src/assets -> src/assets
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          const bitmap = fs.readFileSync(p);
          return `data:image/jpeg;base64,${bitmap.toString('base64')}`;
        }
      }
      return '';
    } catch (e) {
      console.error('Error reading logo file:', e);
      return '';
    }
  }

  /**
   * Generate complete HTML for inspection report
   */
  static generateHTML(data: ReportData): string {
    const { inspection, template, results } = data;
    const logoBase64 = this.getLogoBase64();

    return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inspectie Rapport - ${inspection.clientName}</title>
  <style>
    ${this.getStyles()}
  </style>
</head>
<body>
  ${this.generateHeader(inspection, template, logoBase64)}
  ${this.generateClientInfo(inspection)}
  ${this.generatePrioritySummary(results)}
  ${this.generateResults(results)}
  ${this.generateNotes(inspection)}
  ${this.generateQuotationText(results)}
  ${this.generateSignature(inspection)}
  ${this.generateFooter()}
</body>
</html>
    `.trim();
  }

  /**
   * CSS Styles for the report
   */
  private static getStyles(): string {
    // Easy Data Theme Colors
    // Primary: #0284c7 (Sky 600)
    // Secondary: #0ea5e9 (Sky 500)
    // Dark: #0c4a6e (Sky 900)

    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Helvetica', Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #1a1a1a;
        padding: 40px;
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #0284c7;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .logo-img {
        max-height: 80px;
        margin-bottom: 15px;
      }

      .header h1 {
        font-size: 24pt;
        color: #0c4a6e;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .header .subtitle {
        font-size: 12pt;
        color: #555;
        margin-bottom: 5px;
      }

      .section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }

      .section-title {
        font-size: 14pt;
        font-weight: bold;
        color: #0284c7;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 2px solid #e0f2fe;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 8px 15px;
        margin-bottom: 15px;
      }

      .info-label {
        font-weight: bold;
        color: #0c4a6e;
      }

      .info-value {
        color: #333;
      }

      .summary-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }

      .summary-table th {
        text-align: left;
        padding: 8px;
        background-color: #f0f9ff;
        border-bottom: 2px solid #bae6fd;
        color: #0c4a6e;
      }

      .summary-table td {
        padding: 8px;
        border-bottom: 1px solid #f0f0f0;
        vertical-align: top;
      }

      .quotation-box {
        background-color: #f0f9ff;
        border-left: 4px solid #0284c7;
        padding: 15px;
        margin-bottom: 25px;
        page-break-inside: avoid;
      }

      .quotation-title {
        font-weight: bold;
        color: #0284c7;
        margin-bottom: 8px;
        font-size: 11pt;
      }

      .result-item {
        margin-bottom: 20px;
        padding: 15px;
        background: #fafafa;
        border: 1px solid #eee;
        border-radius: 4px;
        page-break-inside: avoid;
      }

      .result-header {
        font-weight: bold;
        font-size: 11pt;
        margin-bottom: 10px;
        color: #0c4a6e;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }

      .result-details {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 5px 10px;
        margin-bottom: 8px;
      }

      .result-label {
        font-weight: bold;
        color: #555;
        font-size: 9pt;
      }

      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
        font-size: 8pt;
        color: #888;
      }
      
      /* Keep other classes like .rating, .classification same but customized if needed */
      .rating {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 9pt;
      }
      .rating.GOED { background: #dcfce7; color: #166534; }
      .rating.ACCEPTABEL { background: #fef9c3; color: #854d0e; }
      .rating.ONVOLDOENDE { background: #fee2e2; color: #991b1b; }
      
      .classification {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 9pt;
      }
      .classification.C1 { background: #fee2e2; color: #991b1b; }
      .classification.C2 { background: #ffedd5; color: #9a3412; }
      .classification.C3 { background: #fef3c7; color: #92400e; }

      .photos-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-top: 15px;
      }

      .photo-item {
        text-align: center;
      }

      .photo-wrapper {
        position: relative;
        width: 100%;
        border: 1px solid #ddd;
        padding: 4px;
        background: white;
      }
      
      .photo-wrapper img { width: 100%; height: auto; display: block; }
      .photo-caption { font-size: 8pt; color: #666; margin-top: 4px; font-style: italic; }
      
      .signature-img {
         border-bottom: 1px solid #000;
         padding-bottom: 5px;
         max-width: 250px;
       }
    `;
  }

  /**
   * Generate header section
   */
  private static generateHeader(inspection: any, template: any, logoBase64: string): string {
    const completedDate = inspection.completedAt
      ? new Date(inspection.completedAt).toLocaleDateString('nl-NL')
      : 'Niet afgerond';

    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" class="logo-img" alt="Logo" />`
      : '';

    return `
      <div class="header">
        ${logoHtml}
        <h1>Easy Data Rapportage</h1>
        <div class="subtitle">${template.name}</div>
        <div class="subtitle">${inspection.clientName} | ${inspection.location}</div>
        <div class="subtitle">Datum: ${completedDate}</div>
      </div>
    `;
  }

  /**
   * Generate client information section
   */
  private static generateClientInfo(inspection: any): string {
    return `
      <div class="section">
        <div class="section-title">Projectgegevens</div>
        <div class="info-grid">
          <div class="info-label">Klant:</div>
          <div class="info-value">${inspection.clientName || '-'}</div>

          <div class="info-label">Locatie:</div>
          <div class="info-value">${inspection.location || '-'}</div>

          <div class="info-label">Adres:</div>
          <div class="info-value">${inspection.address || ''} ${inspection.city ? ', ' + inspection.city : ''}</div>
          
          <div class="info-label">Inspecteur:</div>
          <div class="info-value">${inspection.inspector?.firstName} ${inspection.inspector?.lastName}</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate priority summary section
   */
  private static generatePrioritySummary(results: any[]): string {
    if (!results) return '';

    // Filter for C1 (Critical), C2 (Major), and C3 (Minor) items
    const priorityItems = results.filter(
      (r) => r.classification === 'C1' || r.classification === 'C2' || r.classification === 'C3'
    );

    if (priorityItems.length === 0) {
      return `
        <div class="section">
          <div class="section-title">Managementsamenvatting</div>
          <p>Tijdens de inspectie zijn geen gebreken geconstateerd die classificatie C1, C2 of C3 hebben.</p>
        </div>
      `;
    }

    const summaryRows = priorityItems
      .map(
        (item) => `
        <tr>
          <td><strong>${item.classification}</strong></td>
          <td>${item.subComponent.mainComponent.name} - ${item.subComponent.name}</td>
          <td>${item.notes || '-'}</td>
        </tr>
      `
      )
      .join('');

    return `
      <div class="section">
        <div class="section-title">Managementsamenvatting</div>
        <p style="margin-bottom: 10px;">De volgende aandachtspunten zijn geconstateerd:</p>
        <table class="summary-table">
          <thead>
            <tr>
              <th style="width: 50px;">Code</th>
              <th>Onderdeel</th>
              <th>Bevinding</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate quotation request text
   */
  private static generateQuotationText(results: any[]): string {
    // Keep existing implementation but styled with new CSS
    if (!results) return '';
    const hasPriorityItems = results.some(
      (r) => r.classification === 'C1' || r.classification === 'C2' || r.classification === 'C3'
    );
    if (!hasPriorityItems) return '';

    return `
      <div class="section quotation-box">
        <div class="quotation-title">Opvolging & Offerte</div>
        <p>
          Wij adviseren u om de geconstateerde gebreken te laten verhelpen. 
          Neem contact op voor een vrijblijvende herstelofferte.
        </p>
      </div>
    `;
  }

  /**
   * Generate inspection results section
   */
  private static generateResults(results: any[]): string {
    if (!results || results.length === 0) return '';

    const resultsHTML = results
      .map(
        (result) => `
        <div class="result-item">
          <div class="result-header">${result.subComponent.mainComponent.name} : ${result.subComponent.name}</div>
          <div class="result-details">
            <div class="result-label">Status:</div>
            <div class="result-value">
               <span class="rating ${result.rating}">${result.rating}</span>
               ${result.classification ? `<span class="classification ${result.classification}" style="margin-left:10px;">${result.classification}</span>` : ''}
            </div>
             ${result.notes
            ? `
            <div class="result-label">Opmerking:</div>
            <div class="result-value">${result.notes}</div>
            `
            : ''
          }
          </div>
          ${this.generatePhotos(result.photos)}
        </div>
      `
      )
      .join('');

    return `
      <div class="section">
        <div class="section-title">Gedetailleerde Bevindingen</div>
        ${resultsHTML}
      </div>
    `;
  }

  /**
   * Generate photos section for a result
   */
  private static generatePhotos(photos: any[]): string {
    if (!photos || photos.length === 0) return '';

    const photosHTML = photos
      .map((photo) => {
        const annotations = photo.annotations ? JSON.parse(photo.annotations) : null;
        const canvasHTML = annotations ? this.generateAnnotationsCanvas(photo, annotations) : '';
        if (!photo.base64Data) return '';

        return `
          <div class="photo-item">
            <div class="photo-wrapper">
              <img src="${photo.base64Data}" alt="Foto" />
              ${canvasHTML}
            </div>
            ${photo.originalName ? `<div class="photo-caption">${photo.originalName}</div>` : ''}
          </div>
        `;
      })
      .join('');

    return `
      <div class="photos-container">
        ${photosHTML}
      </div>
    `;
  }

  /**
   * Generate canvas element with annotations
   */
  private static generateAnnotationsCanvas(_photo: any, annotations: any): string {
    const svgElements: string[] = [];
    const scale = 1000;
    const toViewBox = (percentage: number) => (percentage / 100) * scale;

    if (annotations.arrows) {
      annotations.arrows.forEach((arrow: any) => {
        const x1 = toViewBox(arrow.startX);
        const y1 = toViewBox(arrow.startY);
        const x2 = toViewBox(arrow.endX);
        const y2 = toViewBox(arrow.endY);
        const color = arrow.color || '#ef4444'; // Red-500
        const width = arrow.width || 3;

        svgElements.push(`
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width * 2}" />
        `);
        // Arrowhead logic simplified for brevity (could reuse existing)
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headlen = 20;
        svgElements.push(`
           <line x1="${x2}" y1="${y2}" x2="${x2 - headlen * Math.cos(angle - Math.PI / 6)}" y2="${y2 - headlen * Math.sin(angle - Math.PI / 6)}" stroke="${color}" stroke-width="${width * 2}" />
           <line x1="${x2}" y1="${y2}" x2="${x2 - headlen * Math.cos(angle + Math.PI / 6)}" y2="${y2 - headlen * Math.sin(angle + Math.PI / 6)}" stroke="${color}" stroke-width="${width * 2}" />
        `);
      });
    }

    if (annotations.circles) {
      annotations.circles.forEach((circle: any) => {
        svgElements.push(`
          <circle cx="${toViewBox(circle.x)}" cy="${toViewBox(circle.y)}" r="${toViewBox(circle.radius) * 0.5}" 
                  fill="none" stroke="${circle.color || '#ef4444'}" stroke-width="${(circle.width || 3) * 2}" />
        `);
      });
    }

    if (annotations.text) {
      annotations.text.forEach((textItem: any) => {
        svgElements.push(`
            <text x="${toViewBox(textItem.x)}" y="${toViewBox(textItem.y)}" fill="${textItem.color || '#ef4444'}"
                    font-size="${(textItem.fontSize || 14) * 2}" font-weight="bold" font-family="Helvetica">
                ${textItem.text}
            </text>
            `);
      });
    }

    if (svgElements.length === 0) return '';

    return `
      <svg viewBox="0 0 ${scale} ${scale}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
        ${svgElements.join('')}
      </svg>
    `;
  }

  /**
   * Generate notes and recommendations section
   */
  private static generateNotes(inspection: any): string {
    if (!inspection.overallNotes && !inspection.recommendations) return '';

    return `
      <div class="section">
        <div class="section-title">Overige Opmerkingen</div>
        <div style="background: #f9fafb; padding: 15px; border-radius: 4px;">
          ${inspection.overallNotes ? `<p><strong>Opmerkingen:</strong><br>${inspection.overallNotes}</p>` : ''}
          ${inspection.recommendations ? `<p style="margin-top:10px;"><strong>Aanbevelingen:</strong><br>${inspection.recommendations}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate signature section
   */
  private static generateSignature(inspection: any): string {
    if (!inspection.signatureData) return '';

    return `
      <div class="section signature-section" style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
        <div class="section-title">Ondertekening</div>
        <div>
          <img src="${inspection.signatureData}" class="signature-img" alt="Sign" />
          <p><strong>Inspecteur:</strong> ${inspection.signedBy || 'Onbekend'}</p>
          <p><strong>Datum:</strong> ${inspection.signedAt ? new Date(inspection.signedAt).toLocaleDateString('nl-NL') : '-'}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate footer
   */
  private static generateFooter(): string {
    return `
      <div class="footer">
        <p>Easy Data Inspectie platform - Powered by Easy Data</p>
      </div>
    `;
  }
}
