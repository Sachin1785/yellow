import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// This endpoint receives payout status webhooks from Razorpay
export async function POST(request: NextRequest) {
	try {
		const secret = process.env.RAZORPAY_KEY_SECRET || process.env.key_secret;
		if (!secret) {
			return NextResponse.json({ error: 'Webhook secret not set' }, { status: 500 });
		}

		// Razorpay sends the signature in this header
		const signature = request.headers.get('x-razorpay-signature');
		if (!signature) {
			return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
		}

		// Get the raw body for signature verification
		const rawBody = await request.text();
		// Re-parse JSON for use
		let payload;
		try {
			payload = JSON.parse(rawBody);
		} catch {
			return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		// Verify signature
		const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
		if (expected !== signature) {
			return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
		}

		// Log the webhook event (for demo, just print to console)
		console.log('Verified Razorpay payout webhook:', JSON.stringify(payload, null, 2));

		// TODO: Store the event in your database or trigger business logic as needed

		return NextResponse.json({ received: true, verified: true });
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Webhook error' }, { status: 500 });
	}
}
