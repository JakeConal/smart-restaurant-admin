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
            // We use numeric IDs (digits only) + unique suffix
            const baseIds = body.orderIds.join('n');
            const uniqueSuffix = 'z' + Date.now().toString().slice(-4);

            let txnRef = baseIds + uniqueSuffix;
            if (txnRef.length > 24) {
                // FALLBACK: Use only the first numeric ID if too long
                txnRef = 'm' + body.orderIds[0] + uniqueSuffix;
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
            console.log('[VNPay Controller] Return URL Query:', query);
            const verify = this.vnpayService.verifyReturnUrl(query);
            console.log('[VNPay Controller] Verification Result:', verify);

            if (!verify.isVerified) {
                console.error('[VNPay Controller] Signature verification failed!');
                return {
                    success: false,
                    message: 'Data integrity verification failed (Invalid Signature)',
                };
            }

            if (!verify.isSuccess) {
                return {
                    success: false,
                    message: `Payment failed or cancelled (Code: ${verify.vnp_ResponseCode})`,
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
                    console.log(`[VNPay] Marking order #${id} as paid via ReturnURL`);
                    await this.orderService.markAsPaid(id);
                }
            }

            return {
                success: true,
                message: 'Payment verified and orders updated',
                orderIds: orderIdsToUpdate,
            };
        } catch (error) {
            console.error('[VNPay Controller] Error in Return URL handler:', error);
            return {
                success: false,
                message: 'Error processing VNPay return',
                error: error.message,
            };
        }
    }

    /**
     * VNPay IPN (Instant Payment Notification)
     * This is the secure way to confirm payment in production.
     * VNPay server will call this endpoint automatically and asynchronously.
     */
    @Get('vnpay-ipn')
    async vnpayIpn(@Query() query: any) {
        try {
            console.log('[VNPay IPN] Received notification:', query);
            const verify = this.vnpayService.verifyReturnUrl(query);

            if (!verify.isVerified) {
                console.error('[VNPay IPN] Invalid signature!');
                return { RspCode: '97', Message: 'Invalid signature' };
            }

            // Check if order exists and if payment already processed
            // (In a real app, you should check your DB here)

            const fullTxnRef = verify.vnp_TxnRef;
            const idsPart = fullTxnRef.split('z')[0];
            let orderIdsToUpdate: string[] = [];

            if (idsPart.startsWith('m')) {
                orderIdsToUpdate = [idsPart.substring(1)];
            } else {
                orderIdsToUpdate = idsPart.includes('n') ? idsPart.split('n') : idsPart.split('_');
            }

            if (verify.vnp_ResponseCode === '00') {
                for (const idStr of orderIdsToUpdate) {
                    const id = parseInt(idStr);
                    if (!isNaN(id)) {
                        console.log(`[VNPay IPN] Success - Updating order #${id}`);
                        await this.orderService.markAsPaid(id);
                    }
                }
                return { RspCode: '00', Message: 'Success' };
            } else {
                console.warn(`[VNPay IPN] Payment failed for ${fullTxnRef}. Code: ${verify.vnp_ResponseCode}`);
                return { RspCode: '00', Message: 'Confirm Success (Payment failed status recorded)' };
            }
        } catch (error) {
            console.error('[VNPay IPN] Error:', error);
            return { RspCode: '99', Message: 'Unknown error: ' + error.message };
        }
    }
}
