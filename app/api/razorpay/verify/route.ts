
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
// import { writeOrder, updateOrder, getOrderByOrderId } from '../order/orders-util';

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
            // No file logging needed
            return NextResponse.json(
                { message: 'Payment failure logged', isOk: false },
                { status: 200 }
            );
        }

        if (!orderCreationId || !razorpayPaymentId || !razorpaySignature) {
            // No file logging needed
            return NextResponse.json(
                { message: 'Missing required payment parameters', isOk: false },
                { status: 400 }
            );
        }

        const signature = generatedSignature(orderCreationId, razorpayPaymentId);
        if (signature !== razorpaySignature) {
            console.log('Payment verification failed - signature mismatch');
            // No file logging needed
            return NextResponse.json(
                { message: 'Payment verification failed', isOk: false },
                { status: 400 }
            );
        }


        // No file logging needed for successful payment
        return NextResponse.json(
            { message: 'Payment verified successfully', isOk: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error verifying payment:', error);
        // No file logging needed
        return NextResponse.json(
            { message: 'Internal server error', isOk: false },
            { status: 500 }
        );
    }
}