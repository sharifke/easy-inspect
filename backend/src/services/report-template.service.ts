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
   * Generate complete HTML for inspection report
   */
  static generateHTML(data: ReportData): string {
    const { inspection, template, results } = data;

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
  ${this.generateHeader(inspection, template)}
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
        color: #000;
        padding: 40px;
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #0066cc;
      }

      .header h1 {
        font-size: 24pt;
        color: #0066cc;
        margin-bottom: 10px;
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
        color: #0066cc;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 2px solid #e0e0e0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 8px 15px;
        margin-bottom: 15px;
      }

      .info-label {
        font-weight: bold;
        color: #555;
      }

      .info-value {
        color: #000;
      }

      .summary-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }

      .summary-table th {
        text-align: left;
        padding: 8px;
        background-color: #f0f0f0;
        border-bottom: 2px solid #ddd;
        color: #333;
      }

      .summary-table td {
        padding: 8px;
        border-bottom: 1px solid #eee;
        vertical-align: top;
      }

      .summary-row-C1 {
        background-color: #fff5f5;
      }

      .summary-row-C2 {
        background-color: #fffaf0;
      }

      .quotation-box {
        background-color: #f0f9ff;
        border: 1px solid #b9e6fe;
        padding: 15px;
        border-radius: 5px;
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
        padding: 12px;
        background: #f9f9f9;
        border-left: 4px solid #0066cc;
        page-break-inside: avoid;
      }

      .result-header {
        font-weight: bold;
        font-size: 11pt;
        margin-bottom: 8px;
        color: #0066cc;
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

      .result-value {
        color: #000;
      }

      .rating {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 9pt;
      }

      .rating.GOED {
        background: #d4edda;
        color: #155724;
      }

      .rating.ACCEPTABEL {
        background: #fff3cd;
        color: #856404;
      }

      .rating.ONVOLDOENDE {
        background: #f8d7da;
        color: #721c24;
      }

      .classification {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 9pt;
      }

      .classification.C1 {
        background: #fee2e2;
        color: #991b1b;
      }

      .classification.C2 {
        background: #ffedd5;
        color: #9a3412;
      }

      .classification.C3 {
        background: #fef3c7;
        color: #92400e;
      }

      .classification.ACCEPTABLE {
        background: #dcfce7;
        color: #166534;
      }

      .photos-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-top: 10px;
      }

      .photo-item {
        page-break-inside: avoid;
        text-align: center;
      }

      .photo-wrapper {
        position: relative;
        width: 100%;
        border: 1px solid #ddd;
        background: #fff;
        padding: 5px;
      }

      .photo-wrapper img {
        width: 100%;
        height: auto;
        display: block;
      }

      .photo-wrapper canvas {
        position: absolute;
        top: 5px;
        left: 5px;
        pointer-events: none;
      }

      .photo-caption {
        font-size: 8pt;
        color: #666;
        margin-top: 5px;
        font-style: italic;
      }

      .notes-section {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin-top: 10px;
      }

      .signature-section {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e0e0e0;
      }

      .signature-img {
        max-width: 300px;
        height: auto;
        border: 1px solid #ddd;
        padding: 10px;
        background: #fff;
      }

      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 2px solid #e0e0e0;
        text-align: center;
        font-size: 8pt;
        color: #666;
      }

      @media print {
        body {
          padding: 20px;
        }

        .section {
          page-break-inside: avoid;
        }
      }
    `;
  }

  /**
   * Generate header section
   */
  private static generateHeader(inspection: any, template: any): string {
    const completedDate = inspection.completedAt
      ? new Date(inspection.completedAt).toLocaleDateString('nl-NL')
      : 'Niet afgerond';

    return `
      <div class="header">
        <h1>INSPECTIE RAPPORT</h1>
        <div class="subtitle">${template.name}</div>
        <div class="subtitle">Installatietype: ${template.installationType}</div>
        <div class="subtitle">Inspectie ID: ${inspection.id.substring(0, 8)}</div>
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
        <div class="section-title">Klantgegevens</div>
        <div class="info-grid">
          <div class="info-label">Naam:</div>
          <div class="info-value">${inspection.clientName || '-'}</div>

          <div class="info-label">Email:</div>
          <div class="info-value">${inspection.clientEmail || '-'}</div>

          <div class="info-label">Telefoon:</div>
          <div class="info-value">${inspection.clientPhone || '-'}</div>

          <div class="info-label">Locatie:</div>
          <div class="info-value">${inspection.location || '-'}</div>

          <div class="info-label">Adres:</div>
          <div class="info-value">${inspection.address || '-'}</div>

          <div class="info-label">Stad:</div>
          <div class="info-value">${inspection.city || '-'}</div>

          <div class="info-label">Postcode:</div>
          <div class="info-value">${inspection.postalCode || '-'}</div>
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
          <div class="section-title">Prioriteiten Overzicht</div>
          <p>Er zijn geen kritieke (C1), ernstige (C2) of minder ernstige (C3) gebreken geconstateerd die directe aandacht vereisen.</p>
        </div>
      `;
    }

    const summaryRows = priorityItems
      .map(
        (item) => `
        <tr class="summary-row-${item.classification}">
          <td><strong>${item.classification}</strong></td>
          <td>${item.subComponent.mainComponent.name} - ${item.subComponent.name}</td>
          <td>${item.notes || '-'}</td>
        </tr>
      `
      )
      .join('');

    return `
      <div class="section">
        <div class="section-title">Prioriteiten Overzicht (Actie Vereist)</div>
        <p style="margin-bottom: 10px;">Onderstaande punten vereisen uw aandacht op basis van de classificatie:</p>
        <table class="summary-table">
          <thead>
            <tr>
              <th style="width: 60px;">Code</th>
              <th>Onderdeel</th>
              <th>Opmerking</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
          </tbody>
        </table>
        <div style="font-size: 9pt; color: #666;">
          <strong>Legenda:</strong><br>
          <strong>C1:</strong> Direct gevaar - Onmiddellijke actie vereist.<br>
          <strong>C2:</strong> Potentieel gevaar - Actie vereist op korte termijn.<br>
          <strong>C3:</strong> Minder ernstig gebrek - Actie vereist op langere termijn (aanbeveling).
        </div>
      </div>
    `;
  }

  /**
   * Generate quotation request text
   */
  private static generateQuotationText(results: any[]): string {
    if (!results) return '';

    const hasPriorityItems = results.some(
      (r) => r.classification === 'C1' || r.classification === 'C2' || r.classification === 'C3'
    );

    if (!hasPriorityItems) return '';

    return `
      <div class="section quotation-box">
        <div class="quotation-title">Offerte Aanvraag</div>
        <p>
          Op basis van de geconstateerde gebreken (met classificatie C1, C2 en/of C3) adviseren wij u dringend om deze te laten herstellen om de veiligheid van uw installatie te waarborgen.
        </p>
        <p style="margin-top: 10px;">
          U kunt hiervoor vrijblijvend een offerte bij ons aanvragen. Neem contact met ons op via de gegevens in dit rapport of reageer op de e-mail waarmee u dit rapport heeft ontvangen. Wij stellen graag een herstelplan voor u op.
        </p>
      </div>
    `;
  }

  /**
   * Generate inspection results section
   */
  private static generateResults(results: any[]): string {
    if (!results || results.length === 0) {
      return `
        <div class="section">
          <div class="section-title">Inspectie Resultaten</div>
          <p>Geen resultaten beschikbaar.</p>
        </div>
      `;
    }

    const resultsHTML = results
      .map(
        (result) => `
        <div class="result-item">
          <div class="result-header">${result.subComponent.mainComponent.name} - ${result.subComponent.name}</div>
          <div class="result-details">
            <div class="result-label">Criterium:</div>
            <div class="result-value">${result.subComponent.criterion || '-'}</div>

            <div class="result-label">Beoordeling:</div>
            <div class="result-value">
              <span class="rating ${result.rating}">${result.rating}</span>
            </div>

            <div class="result-label">Classificatie:</div>
            <div class="result-value">
              <span class="classification ${result.classification}">${result.classification}</span>
            </div>

            ${
              result.notes
                ? `
            <div class="result-label">Opmerkingen:</div>
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
        <div class="section-title">Inspectie Resultaten</div>
        ${resultsHTML}
      </div>
    `;
  }

  /**
   * Generate photos section for a result
   */
  private static generatePhotos(photos: any[]): string {
    if (!photos || photos.length === 0) {
      return '';
    }

    const photosHTML = photos
      .map((photo) => {
        console.log('[TEMPLATE] Processing photo:', photo.originalName);
        console.log('[TEMPLATE] Raw annotations:', photo.annotations);

        const annotations = photo.annotations ? JSON.parse(photo.annotations) : null;
        console.log('[TEMPLATE] Parsed annotations:', annotations);

        // Generate canvas for annotations if they exist
        const canvasHTML = annotations ? this.generateAnnotationsCanvas(photo, annotations) : '';
        console.log('[TEMPLATE] Canvas HTML length:', canvasHTML.length);

        // Use base64 data URL if available, otherwise skip the photo
        if (!photo.base64Data) {
          return '';
        }

        return `
          <div class="photo-item">
            <div class="photo-wrapper">
              <img src="${photo.base64Data}" alt="${photo.originalName}" />
              ${canvasHTML}
            </div>
            <div class="photo-caption">${photo.originalName}</div>
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
    // We'll render annotations using inline SVG with viewBox for better PDF compatibility
    const svgElements: string[] = [];

    // Use viewBox 0 0 1000 1000 to work with normalized coordinates
    const scale = 1000;

    // NOTE: Coordinates are stored as percentages (0-100), so we divide by 100 first
    const toViewBox = (percentage: number) => (percentage / 100) * scale;

    // Render arrows
    if (annotations.arrows && annotations.arrows.length > 0) {
      annotations.arrows.forEach((arrow: any) => {
        const x1 = toViewBox(arrow.startX);
        const y1 = toViewBox(arrow.startY);
        const x2 = toViewBox(arrow.endX);
        const y2 = toViewBox(arrow.endY);
        const color = arrow.color || '#ff0000';
        const width = arrow.width || 2;

        // Arrow line
        svgElements.push(`
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                stroke="${color}" stroke-width="${width * 2}" />
        `);

        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 20;
        const head1X = x2 - headLength * Math.cos(angle - Math.PI / 6);
        const head1Y = y2 - headLength * Math.sin(angle - Math.PI / 6);
        const head2X = x2 - headLength * Math.cos(angle + Math.PI / 6);
        const head2Y = y2 - headLength * Math.sin(angle + Math.PI / 6);

        svgElements.push(`
          <line x1="${x2}" y1="${y2}" x2="${head1X}" y2="${head1Y}"
                stroke="${color}" stroke-width="${width * 2}" />
          <line x1="${x2}" y1="${y2}" x2="${head2X}" y2="${head2Y}"
                stroke="${color}" stroke-width="${width * 2}" />
        `);
      });
    }

    // Render circles
    if (annotations.circles && annotations.circles.length > 0) {
      annotations.circles.forEach((circle: any) => {
        const cx = toViewBox(circle.x);
        const cy = toViewBox(circle.y);
        const r = toViewBox(circle.radius) * 0.5;
        const color = circle.color || '#ff0000';
        const width = circle.width || 2;

        svgElements.push(`
          <circle cx="${cx}" cy="${cy}" r="${r}"
                  fill="none" stroke="${color}" stroke-width="${width * 2}" />
        `);
      });
    }

    // Render text annotations
    if (annotations.text && annotations.text.length > 0) {
      annotations.text.forEach((textItem: any) => {
        const x = toViewBox(textItem.x);
        const y = toViewBox(textItem.y);
        const color = textItem.color || '#ff0000';
        const fontSize = (textItem.fontSize || 12) * 2;

        svgElements.push(`
          <text x="${x}" y="${y}" fill="${color}"
                font-size="${fontSize}" font-weight="bold" font-family="Helvetica">
            ${textItem.text}
          </text>
        `);
      });
    }

    if (svgElements.length === 0) {
      return '';
    }

    return `
      <svg viewBox="0 0 ${scale} ${scale}" preserveAspectRatio="none" style="position: absolute; top: 5px; left: 5px; width: calc(100% - 10px); height: calc(100% - 10px); pointer-events: none;">
        ${svgElements.join('')}
      </svg>
    `;
  }

  /**
   * Generate notes and recommendations section
   */
  private static generateNotes(inspection: any): string {
    if (!inspection.overallNotes && !inspection.recommendations) {
      return '';
    }

    return `
      <div class="section">
        <div class="section-title">Opmerkingen en Aanbevelingen</div>
        <div class="notes-section">
          ${
            inspection.overallNotes
              ? `
          <div style="margin-bottom: 15px;">
            <strong>Algemene opmerkingen:</strong>
            <div style="margin-top: 5px;">${inspection.overallNotes}</div>
          </div>
          `
              : ''
          }
          ${
            inspection.recommendations
              ? `
          <div>
            <strong>Aanbevelingen:</strong>
            <div style="margin-top: 5px;">${inspection.recommendations}</div>
          </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  /**
   * Generate signature section
   */
  private static generateSignature(inspection: any): string {
    if (!inspection.signatureData) {
      return '';
    }

    return `
      <div class="section signature-section">
        <div class="section-title">Handtekening</div>
        <div>
          <img src="${inspection.signatureData}" alt="Handtekening" class="signature-img" />
          <div style="margin-top: 10px;">
            <strong>Getekend door:</strong> ${inspection.signedBy || '-'}
          </div>
          <div style="margin-top: 5px;">
            <strong>Datum:</strong> ${
              inspection.signedAt
                ? new Date(inspection.signedAt).toLocaleDateString('nl-NL')
                : '-'
            }
          </div>
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
        <p>Dit rapport is automatisch gegenereerd door ElektroInspect</p>
        <p>© ${new Date().getFullYear()} ElektroInspect - Alle rechten voorbehouden</p>
      </div>
    `;
  }
}
