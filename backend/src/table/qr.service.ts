import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

type TableTokenPayload = jwt.JwtPayload & {
  tableId: string;
  restaurantId: string;
  timestamp: string;
};

@Injectable()
export class QrService {
  private readonly jwtSecret: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }

    this.jwtSecret = jwtSecret;
    this.baseUrl =
      this.configService.get<string>('CUSTOMER_FRONTEND_URL') ||
      this.configService.get<string>('BASE_URL') ||
      'http://localhost:4000';
  }

  /**
   * Generate a signed JWT token for a table
   */
  generateToken(
    tableId: string,
    restaurantId: string,
    expiresIn?: string | number,
  ): string {
    const payload = {
      tableId,
      restaurantId,
      timestamp: new Date().toISOString(),
    };

    const options: jwt.SignOptions = {
      issuer: 'smart-restaurant',
      subject: 'table-qr-code',
      ...(expiresIn && {
        expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
      }),
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Verify a QR code token
   */
  verifyToken(
    token: string,
  ): { tableId: string; restaurantId: string; timestamp: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TableTokenPayload;
      return {
        tableId: decoded.tableId,
        restaurantId: decoded.restaurantId,
        timestamp: decoded.timestamp,
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate QR code URL for a table
   */
  generateQrUrl(token: string): string {
    return `${this.baseUrl}/login?token=${token}`;
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
    },
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
      const qrSize = 250;
      doc.image(qrImageBuffer, (doc.page.width - qrSize) / 2, doc.y, {
        fit: [qrSize, qrSize],
      });

      doc.y += qrSize;
      doc.moveDown(1);

      // Instruction text
      doc.fontSize(16).fillColor('#666').text('Scan to Order', {
        align: 'center',
      });

      doc.moveDown(0.5);

      doc
        .fontSize(12)
        .fillColor('#999')
        .text('Point your camera at the QR code to view our menu', {
          align: 'center',
        });

      // Optional WiFi information
      if (options?.includeWifi && options?.wifiSsid) {
        doc.moveDown(2);
        doc.fontSize(14).fillColor('#333').text('WiFi Information', {
          align: 'center',
        });

        doc.moveDown(0.3);
        doc
          .fontSize(12)
          .fillColor('#666')
          .text(`Network: ${options.wifiSsid}`, {
            align: 'center',
          });

        if (options?.wifiPassword) {
          doc
            .fontSize(12)
            .fillColor('#666')
            .text(`Password: ${options.wifiPassword}`, {
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
        const qrImageBuffer = Buffer.from(
          table.qrCodeDataUrl.split(',')[1],
          'base64',
        );
        const qrSize = 250;
        doc.image(qrImageBuffer, (doc.page.width - qrSize) / 2, doc.y, {
          fit: [qrSize, qrSize],
        });

        doc.y += qrSize;
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
