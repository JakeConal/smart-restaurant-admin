import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

@Injectable()
export class QrService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  private readonly restaurantId = process.env.RESTAURANT_ID || 'default-restaurant';

  /**
   * Generate a signed JWT token for a table
   */
  generateToken(tableId: string, expiresIn?: string | number): string {
    const payload = {
      tableId,
      restaurantId: this.restaurantId,
      timestamp: new Date().toISOString(),
    };

    const options: jwt.SignOptions = {
      issuer: 'smart-restaurant',
      subject: 'table-qr-code',
      ...(expiresIn && { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }),
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Verify a QR code token
   */
  verifyToken(token: string): { tableId: string; restaurantId: string; timestamp: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        tableId: decoded.tableId,
        restaurantId: decoded.restaurantId,
        timestamp: decoded.timestamp,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate QR code URL for a table
   */
  generateQrUrl(tableId: string, token: string): string {
    return `${this.baseUrl}/menu?table=${tableId}&token=${token}`;
  }

  /**
   * Generate QR code as PNG buffer
   */
  async generateQrCodePng(url: string): Promise<Buffer> {
    return QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 2,
    });
  }

  /**
   * Generate QR code as Data URL (base64)
   */
  async generateQrCodeDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });
  }

  /**
   * Generate QR code PDF with table information
   */
  async generateQrCodePdf(
    tableNumber: string,
    qrCodeDataUrl: string,
    options?: {
      includeWifi?: boolean;
      wifiSsid?: string;
      wifiPassword?: string;
    }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).font('Helvetica-Bold').text('Smart Restaurant', {
        align: 'center',
      });

      doc.moveDown(0.5);

      // Table Number
      doc.fontSize(36).fillColor('#333').text(`Table ${tableNumber}`, {
        align: 'center',
      });

      doc.moveDown(1);

      // QR Code
      const qrImageBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrImageBuffer, {
        fit: [250, 250],
        align: 'center',
      });

      doc.moveDown(1);

      // Instruction text
      doc.fontSize(16).fillColor('#666').text('Scan to Order', {
        align: 'center',
      });

      doc.moveDown(0.5);

      doc.fontSize(12).fillColor('#999').text('Point your camera at the QR code to view our menu', {
        align: 'center',
      });

      // Optional WiFi information
      if (options?.includeWifi && options?.wifiSsid) {
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#333').text('WiFi Information', {
          align: 'center',
        });

        doc.moveDown(0.3);
        doc.fontSize(12).fillColor('#666').text(`Network: ${options.wifiSsid}`, {
          align: 'center',
        });

        if (options?.wifiPassword) {
          doc.fontSize(12).fillColor('#666').text(`Password: ${options.wifiPassword}`, {
            align: 'center',
          });
        }
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).fillColor('#ccc').text('Thank you for dining with us!', {
        align: 'center',
      });

      doc.end();
    });
  }

  /**
   * Generate multiple QR codes as a single PDF
   */
  async generateBulkQrCodesPdf(
    tables: Array<{ tableNumber: string; qrCodeDataUrl: string }>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      tables.forEach((table, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Table Number
        doc.fontSize(36).fillColor('#333').text(`Table ${table.tableNumber}`, {
          align: 'center',
        });

        doc.moveDown(1);

        // QR Code
        const qrImageBuffer = Buffer.from(table.qrCodeDataUrl.split(',')[1], 'base64');
        doc.image(qrImageBuffer, {
          fit: [250, 250],
          align: 'center',
        });

        doc.moveDown(1);

        // Instruction text
        doc.fontSize(16).fillColor('#666').text('Scan to Order', {
          align: 'center',
        });
      });

      doc.end();
    });
  }
}
