import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// This endpoint completes onboarding and updates all user fields
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('Received onboarding data:', data);
    const { clerkId, dateOfBirth, ...rest } = data;
    if (!clerkId) {
      console.log('Missing clerkId');
      return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 });
    }
    
    // Format dateOfBirth properly as DateTime
    // Append time part to make it a valid ISO-8601 DateTime
    const formattedDateOfBirth = dateOfBirth ? new Date(`${dateOfBirth}T00:00:00Z`) : undefined;
    
    // Try to update user, if not found, return 404
    let user;
    try {
      user = await prisma.user.update({
        where: { clerkId },
        data: {
          ...rest,
          dateOfBirth: formattedDateOfBirth,
          onboardingComplete: true,
        },
      });
    } catch (err) {
      console.log('User not found for clerkId:', clerkId);
      return NextResponse.json({ error: 'User not found for clerkId' }, { status: 404 });
    }
    console.log('Onboarding complete for user:', user);
    return NextResponse.json({ user });
  } catch (error: any) {
    console.log('Error in complete-onboarding:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete onboarding' }, { status: 500 });
  }
}
