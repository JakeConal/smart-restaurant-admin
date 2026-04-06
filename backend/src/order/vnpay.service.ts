import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VNPay } from 'vnpay';
import { ProductCode, VnpLocale } from 'vnpay/enums';

type VNPayReturnQuery = Record<string, string> & {
    vnp_OrderInfo?: string;
    vnp_TxnRef?: string;
    vnp_Amount?: string | number;
    vnp_ResponseCode?: string | number;
};

@Injectable()
export class VNPayService {
    private vnpay: VNPay;

    constructor(private readonly configService: ConfigService) {
        const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
        const secureSecret = this.configService.get<string>('VNPAY_HASH_SECRET');

        if (!tmnCode || !secureSecret) {
            throw new Error('VNPAY_TMN_CODE and VNPAY_HASH_SECRET are required');
        }

        this.vnpay = new VNPay({
            tmnCode,
            secureSecret,
            vnpayHost: 'https://sandbox.vnpayment.vn',
            testMode: true,
        });
    }

    createPaymentUrl(params: {
        amount: number;
        orderId: string;
        ipAddr: string;
        orderInfo?: string;
        returnUrl: string;
    }) {
        return this.vnpay.buildPaymentUrl({
            vnp_Amount: params.amount,
            vnp_IpAddr: params.ipAddr,
            vnp_TxnRef: params.orderId,
            vnp_OrderInfo: params.orderInfo || `Thanh toan don hang ${params.orderId}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: params.returnUrl,
            vnp_Locale: VnpLocale.VN,
        });
    }

    verifyReturnUrl(query: VNPayReturnQuery) {
        if (
            !query.vnp_OrderInfo ||
            !query.vnp_TxnRef ||
            query.vnp_Amount === undefined ||
            query.vnp_ResponseCode === undefined
        ) {
            throw new Error('Invalid VNPay return query');
        }

        return this.vnpay.verifyReturnUrl(
            query as VNPayReturnQuery & {
                vnp_OrderInfo: string;
                vnp_TxnRef: string;
                vnp_Amount: string | number;
                vnp_ResponseCode: string | number;
            },
        );
    }
}
