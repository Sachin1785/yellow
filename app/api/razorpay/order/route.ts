
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
// import { writeOrder } from './orders-util';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const { amount, currency = 'INR', email, number } = (await request.json()) as {
            amount: number;
            currency?: string;
            email?: string;
            number?: string;
        };

        if (!amount || amount < 500) {
            return NextResponse.json(
                { error: 'Invalid amount. Minimum amount is ₹5' },
                { status: 400 }
            );
        }

        const options = {
            amount: amount,
            currency: currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        console.log('Order created:', order);

        // No need to store order in orders.json anymore

        return NextResponse.json({
            orderId: order.id,
            email,
            number,
        }, { status: 200 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

