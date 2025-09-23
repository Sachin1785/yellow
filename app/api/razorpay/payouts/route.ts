import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to generate a random idempotency key
function generateIdempotencyKey() {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  try {
    const {
      account_number,
      fund_account_id,
      amount,
      currency = 'INR',
      mode = 'IMPS',
      purpose = 'payout',
      queue_if_low_balance = true,
      reference_id,
      narration,
      notes
    } = await request.json();

    if (!account_number || !fund_account_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay credentials not set' }, { status: 500 });
    }

    const idempotencyKey = generateIdempotencyKey();

    const payload = {
      account_number,
      fund_account_id,
      amount,
      currency,
      mode,
      purpose,
      queue_if_low_balance,
      reference_id,
      narration,
      notes,
    };

    const res = await fetch('https://api.razorpay.com/v1/payouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payout-Idempotency': idempotencyKey,
        'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64'),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.description || 'Payout failed', details: data }, { status: res.status });
    }
    return NextResponse.json({ message: 'Payout initiated', payout: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create payout' }, { status: 500 });
  }
}
