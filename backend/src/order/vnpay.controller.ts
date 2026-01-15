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
            // Use the first orderId as the transaction reference if multiple, 
            // or create a combined reference. For simplicity, we use orderIds joined by underscore or just the first one.
            const txnRef = body.orderIds.join('_');

            const ipAddr =
                (req.headers['x-forwarded-for'] as string) ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                '127.0.0.1';

            const paymentUrl = this.vnpayService.createPaymentUrl({
                amount: body.totalAmount,
                orderId: txnRef,
                ipAddr,
                returnUrl: body.returnUrl,
            });

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
            const txnRef = verify.vnp_TxnRef;
            const orderIds = txnRef.split('_');

            for (const orderId of orderIds) {
                await this.orderService.markAsPaidByOrderId(orderId, {
                    paymentMethod: 'VNPay',
                    // Note: Specific discount logic can be added here if needed, 
                    // but orderService already handles auto-discounts.
                });
            }

            return {
                success: true,
                message: 'Payment verified and orders updated',
                orderIds,
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
