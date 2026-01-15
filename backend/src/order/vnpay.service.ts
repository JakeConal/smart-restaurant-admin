import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VNPay } from 'vnpay';
import { ProductCode, VnpLocale } from 'vnpay/enums';

@Injectable()
export class VNPayService {
    private vnpay: VNPay;

    constructor(private readonly configService: ConfigService) {
        this.vnpay = new VNPay({
            tmnCode: this.configService.get<string>('VNPAY_TMN_CODE', '2QX6CBMX'),
            secureSecret: this.configService.get<string>(
                'VNPAY_HASH_SECRET',
                '9748689531818B11B20A9C16C4D02C1F',
            ), // Default sandbox secrets for demo if not provided
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

    verifyReturnUrl(query: any) {
        return this.vnpay.verifyReturnUrl(query);
    }
}
