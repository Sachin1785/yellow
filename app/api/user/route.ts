import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { clerkId, email } = await req.json();
    if (!clerkId) {
      return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 });
    }
    // Upsert user: create if not exists, else update email if provided
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: email ? { email } : {},
      create: {
        clerkId,
        email: email || '',
        firstName: '',
        lastName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        dateOfBirth: new Date(0),
        gender: '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
        termsAccepted: false,
        privacyAccepted: false,
        marketingAccepted: false,
        onboardingComplete: false,
      },
    });
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upsert user' }, { status: 500 });
  }
}
