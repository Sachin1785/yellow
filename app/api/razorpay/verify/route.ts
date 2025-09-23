
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { writeOrder, updateOrder, getOrderByOrderId } from '../order/orders-util';

const generatedSignature = (
    razorpayOrderId: string,
    razorpayPaymentId: string
) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new Error(
            'Razorpay key secret is not defined in environment variables.'
        );
    }
    const sig = crypto
        .createHmac('sha256', keySecret)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex');
    return sig;
};


export async function POST(request: NextRequest) {
    try {
        const { orderCreationId, razorpayPaymentId, razorpaySignature, email, number, amount, failureReason, isFailedPayment } =
            await request.json();

        // Handle failed payment logging
        if (isFailedPayment) {
            await writeOrder({
                email,
                number,
                razorpayOrderId: orderCreationId,
                amount: amount ? amount / 100 : 0,
                type: 'PAYMENT_FAILED',
                status: 'FAILED',
                description: failureReason || 'Payment failed',
                createdAt: new Date().toISOString(),
            });
            return NextResponse.json(
                { message: 'Payment failure logged', isOk: false },
                { status: 200 }
            );
        }

        if (!orderCreationId || !razorpayPaymentId || !razorpaySignature) {
            await writeOrder({
                email: email || 'unknown',
                number: number || 'unknown',
                razorpayOrderId: orderCreationId || 'unknown',
                razorpayPaymentId: razorpayPaymentId || 'unknown',
                amount: amount ? amount / 100 : 0,
                type: 'PAYMENT_VERIFICATION_FAILED',
                status: 'FAILED',
                description: 'Missing required payment parameters',
                createdAt: new Date().toISOString(),
            });
            return NextResponse.json(
                { message: 'Missing required payment parameters', isOk: false },
                { status: 400 }
            );
        }

        const signature = generatedSignature(orderCreationId, razorpayPaymentId);
        if (signature !== razorpaySignature) {
            console.log('Payment verification failed - signature mismatch');
            await writeOrder({
                email,
                number,
                razorpayOrderId: orderCreationId,
                razorpayPaymentId: razorpayPaymentId,
                amount: amount ? amount / 100 : 0,
                type: 'PAYMENT_VERIFICATION_FAILED',
                status: 'FAILED',
                description: 'Signature mismatch',
                createdAt: new Date().toISOString(),
            });
            return NextResponse.json(
                { message: 'Payment verification failed', isOk: false },
                { status: 400 }
            );
        }


        // Always log a new entry for successful payment
        await writeOrder({
            email,
            number,
            razorpayOrderId: orderCreationId,
            razorpayPaymentId: razorpayPaymentId,
            amount: amount ? amount / 100 : 0,
            type: 'PAYMENT_SUCCESS',
            status: 'SUCCESS',
            description: 'Payment verified successfully',
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json(
            { message: 'Payment verified successfully', isOk: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error verifying payment:', error);
        await writeOrder({
            email: 'unknown',
            number: 'unknown',
            razorpayOrderId: 'unknown',
            amount: 0,
            type: 'PAYMENT_ERROR',
            status: 'ERROR',
            description: error instanceof Error ? error.message : 'Unknown error',
            createdAt: new Date().toISOString(),
        });
        return NextResponse.json(
            { message: 'Internal server error', isOk: false },
            { status: 500 }
        );
    }
}