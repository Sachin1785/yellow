import { NextRequest, NextResponse } from 'next/server';

// GET /api/razorpay/view-payouts?account_number=...&contact_id=...
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	let account_number = searchParams.get('account_number');
	if (!account_number) {
		account_number = process.env.RAZORPAYX_ACCOUNT_NUMBER || '';
	}
	if (!account_number) {
		return NextResponse.json({ error: 'Missing account_number. Please set RAZORPAYX_ACCOUNT_NUMBER in .env or provide as query param.' }, { status: 400 });
	}

	const params = new URLSearchParams();
	params.set('account_number', account_number);
	const contact_id = searchParams.get('contact_id');
	if (contact_id) params.set('contact_id', contact_id);

	const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
	const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.key_secret;
	if (!key_id || !key_secret) {
		return NextResponse.json({ error: 'Razorpay credentials not set' }, { status: 500 });
	}

	const apiUrl = `https://api.razorpay.com/v1/payouts?${params.toString()}`;

	try {
		const res = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64'),
			},
		});
		const data = await res.json();
		if (!res.ok) {
			return NextResponse.json({ error: data.error?.description || 'Failed to fetch payouts', details: data }, { status: res.status });
		}
		// Razorpay returns { items: [...] }
		return NextResponse.json({ payouts: data.items || [] });
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'Failed to fetch payouts' }, { status: 500 });
	}
}
