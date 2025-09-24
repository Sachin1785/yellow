import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clerkId = searchParams.get('clerkId');
  if (!clerkId) {
    return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { clerkId } });
  return NextResponse.json({ onboardingComplete: user?.onboardingComplete ?? false });
}
