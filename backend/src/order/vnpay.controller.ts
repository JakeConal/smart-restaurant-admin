import {
    Controller,
    Post,
    Body,
    Get,
    Query,
    Req,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import express from 'express';
import { VNPayService } from './vnpay.service';
import { OrderService } from './order.service';

@Controller('api/vnpay')
export class VNPayController {
    constructor(
        private readonly vnpayService: VNPayService,
        private readonly orderService: OrderService,
    ) { }

    @Post('create-payment')
    async createPayment(
        @Body()
        body: {
            orderIds: string[];
            totalAmount: number;
            returnUrl: string;
        },
        @Req() req: express.Request,
    ) {
        try {
            console.log('[VNPay Controller] Creating payment request body:', body);

            // 1. Clean TxnRef: Must be unique for every request even for the same order
            // Format: [id1]n[id2]z[timestamp]
            // 'n' separates IDs, 'z' separates IDs from unique timestamp
            const baseIds = body.orderIds.join('n');
            const uniqueSuffix = 'z' + Date.now().toString().slice(-7); // 7 digits of timestamp

            let txnRef = baseIds + uniqueSuffix;
            if (txnRef.length > 24) {
                // If too long (many orders), use the first ID and mark as "multiple" with 'm'
                // We'll have to rely on the fact that these orders are usually processed together
                // or just truncate IDs until it fits.
                txnRef = 'm' + body.orderIds[0] + uniqueSuffix;
                if (txnRef.length > 24) {
                    txnRef = txnRef.substring(txnRef.length - 24);
                }
            }

            // 2. Normalize IP Address: Must be IPv4 format
            let ipAddr =
                (req.headers['x-forwarded-for'] as string) ||
                req.ip ||
                '13.160.92.202'; // Official VNPay doc example IP

            // Handle IPv6 mapped IPv4 or local IPv6
            if (ipAddr.includes('::ffff:')) {
                ipAddr = ipAddr.split('::ffff:')[1];
            } else if (ipAddr === '::1') {
                ipAddr = '127.0.0.1';
            }

            console.log(`[VNPay Controller] Client IP: ${ipAddr}, Generated TxnRef: ${txnRef}`);
            console.log(`[VNPay Controller] Return URL Length: ${body.returnUrl.length} chars`);

            const paymentUrl = this.vnpayService.createPaymentUrl({
                amount: Math.floor(body.totalAmount),
                orderId: txnRef,
                ipAddr,
                returnUrl: body.returnUrl,
            });

            console.log('[VNPay Controller] Generated Payment URL:', paymentUrl);

            return {
                success: true,
                paymentUrl,
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Failed to create VNPay payment URL',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('vnpay-return')
    async vnpayReturn(@Query() query: any) {
        try {
            const verify = this.vnpayService.verifyReturnUrl(query);

            if (!verify.isVerified) {
                return {
                    success: false,
                    message: 'Data integrity verification failed',
                };
            }

            if (!verify.isSuccess) {
                return {
                    success: false,
                    message: 'Payment failed or cancelled',
                };
            }

            // Payment successful, update orders
            const fullTxnRef = verify.vnp_TxnRef;

            // Extract the IDs part (before 'z')
            const idsPart = fullTxnRef.split('z')[0];

            let orderIdsToUpdate: string[] = [];

            if (idsPart.startsWith('m')) {
                // Only one ID was stored due to length
                orderIdsToUpdate = [idsPart.substring(1)];
            } else {
                // Split by 'n' or '_' separator
                orderIdsToUpdate = idsPart.includes('n') ? idsPart.split('n') : idsPart.split('_');
            }

            for (const idStr of orderIdsToUpdate) {
                const id = parseInt(idStr);
                if (!isNaN(id)) {
                    console.log(`[VNPay] Marking order ${id} as paid`);
                    await this.orderService.markAsPaid(id);
                }
            }

            return {
                success: true,
                message: 'Payment verified and orders updated',
                orderIds: orderIdsToUpdate,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error processing VNPay return',
                error: error.message,
            };
        }
    }
}
