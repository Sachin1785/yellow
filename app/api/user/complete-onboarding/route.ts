import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// Helper to create Razorpay contact
async function createRazorpayContact({ name, email, contact }: { name: string, email?: string, contact: string }) {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay credentials not set');
  const res = await fetch('https://api.razorpay.com/v1/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64'),
    },
    body: JSON.stringify({
      name,
      email,
      contact,
      type: 'customer',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || 'Failed to create contact');
  return data;
}

// Helper to create Razorpay fund account
async function createRazorpayFundAccount({ contact_id, bank_account_number, ifsc, account_holder_name }: { contact_id: string, bank_account_number: string, ifsc: string, account_holder_name: string }) {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay credentials not set');
  const res = await fetch('https://api.razorpay.com/v1/fund_accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64'),
    },
    body: JSON.stringify({
      contact_id,
      account_type: 'bank_account',
      bank_account: {
        name: account_holder_name,
        ifsc,
        account_number: bank_account_number,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || 'Failed to create fund account');
  return data;
}


// This endpoint completes onboarding and updates all user fields
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Received onboarding data:', data);
    const { clerkId, dateOfBirth, firstName, lastName, phone, email, bankName, accountNumber, ifsc, ...rest } = data;
    if (!clerkId) {
      console.log('Missing clerkId');
      return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 });
    }
    // Format dateOfBirth properly as DateTime
    const formattedDateOfBirth = dateOfBirth ? new Date(`${dateOfBirth}T00:00:00Z`) : undefined;

    // 1. Create Razorpay contact
    let contactObj;
    try {
      contactObj = await createRazorpayContact({
        name: `${firstName} ${lastName}`.trim(),
        email,
        contact: phone,
      });
    } catch (err: any) {
      console.log('Failed to create Razorpay contact:', err);
      return NextResponse.json({ error: err.message || 'Failed to create Razorpay contact' }, { status: 500 });
    }

    // 2. Create Razorpay fund account
    let fundAccountObj;
    try {
      fundAccountObj = await createRazorpayFundAccount({
        contact_id: contactObj.id,
        bank_account_number: accountNumber,
        ifsc,
        account_holder_name: `${firstName} ${lastName}`.trim(),
      });
    } catch (err: any) {
      console.log('Failed to create Razorpay fund account:', err);
      return NextResponse.json({ error: err.message || 'Failed to create Razorpay fund account' }, { status: 500 });
    }

    // 3. Update user onboarding
    let user;
    try {
      user = await prisma.user.update({
        where: { clerkId },
        data: {
          ...rest,
          firstName,
          lastName,
          phone,
          email,
          bankName,
          accountNumber,
          ifsc,
          dateOfBirth: formattedDateOfBirth,
          onboardingComplete: true,
        },
      });
    } catch (err) {
      console.log('User not found for clerkId:', clerkId);
      return NextResponse.json({ error: 'User not found for clerkId' }, { status: 404 });
    }

    // 4. Store Razorpay IDs in DB
    try {
      await prisma.razorpay.create({
        data: {
          contactId: contactObj.id,
          fundAccountId: fundAccountObj.id,
        },
      });
    } catch (err) {
      console.log('Failed to store Razorpay IDs in DB:', err);
      // Not a blocker for onboarding, so continue
    }

    console.log('Onboarding complete for user:', user);
    return NextResponse.json({ user, razorpay: { contact: contactObj, fundAccount: fundAccountObj } });
  } catch (error: any) {
    console.log('Error in complete-onboarding:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete onboarding' }, { status: 500 });
  }
}
