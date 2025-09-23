import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, prisma } from '@/lib/db';

const generatedSignature = (
  razorpayPaymentId: string,
  razorpaySubscriptionId: string
) => {
  const keySecret = process.env.RAZORPAY_TEST_KEY_SECRET;
  if (!keySecret) {
    throw new Error(
      'Razorpay key secret is not defined in environment variables.'
    );
  }
  const sig = crypto
    .createHmac('sha256', keySecret)
    .update(razorpayPaymentId + '|' + razorpaySubscriptionId)
    .digest('hex');
  return sig;
};

// Function to determine credit limit based on plan
const getCreditLimitForPlan = (planId: string): number => {
  // You can customize this based on your plan structure
  // For now, returning default values - you can update this logic
  const planCredits: { [key: string]: number } = {
    'plan_QrUWA1nD05DtIa': 100, // Basic plan
    'plan_QsvJUogFISamtN': 500, // Pro plan
    // Add more plans as needed
  };
  
  return planCredits[planId] || 50; // Default to 50 credits
};

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpayPaymentId, 
      razorpaySubscriptionId, 
      razorpaySignature, 
      userId,
      amount,
      failureReason,
      isFailedPayment 
    } = await request.json();

    // Handle failed payment logging
    if (isFailedPayment) {
      await db.createTransaction({
        userId: userId,
        razorpayPaymentId: razorpayPaymentId,
        amount: amount ? amount / 100 : 0,
        type: 'SUBSCRIPTION_PAYMENT_FAILED',
        status: 'FAILED',
        description: failureReason || 'Subscription payment failed'
      });

      return NextResponse.json(
        { message: 'Subscription payment failure logged', isOk: false },
        { status: 200 }
      );
    }

    if (!razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature) {
      // Try to find subscription and update status to failed if it exists
      if (razorpaySubscriptionId) {
        const existingSubscription = await db.getSubscriptionByRazorpayId(razorpaySubscriptionId);
        if (existingSubscription) {
          await db.updateSubscriptionByRazorpayId(razorpaySubscriptionId, {
            status: 'failed'
          });
        }
      }

      // Log failed verification attempt
      await db.createTransaction({
        userId: userId || 'unknown',
        razorpayPaymentId: razorpayPaymentId || 'unknown',
        amount: amount ? amount / 100 : 0,
        type: 'SUBSCRIPTION_VERIFICATION_FAILED',
        status: 'FAILED',
        description: 'Missing required subscription payment parameters'
      });

      return NextResponse.json(
        { message: 'Missing required subscription payment parameters', isOk: false },
        { status: 400 }
      );
    }

    const signature = generatedSignature(razorpayPaymentId, razorpaySubscriptionId);

    if (signature !== razorpaySignature) {
      console.log('Subscription payment verification failed - signature mismatch');

      // Update subscription status to failed if it exists
      const existingSubscription = await db.getSubscriptionByRazorpayId(razorpaySubscriptionId);
      if (existingSubscription) {
        await db.updateSubscriptionByRazorpayId(razorpaySubscriptionId, {
          status: 'failed'
        });
      }

      // Log failed verification
      await db.createTransaction({
        userId: userId,
        subscriptionId: existingSubscription?.id,
        razorpayPaymentId: razorpayPaymentId,
        amount: amount ? amount / 100 : 0,
        type: 'SUBSCRIPTION_VERIFICATION_FAILED',
        status: 'FAILED',
        description: 'Signature mismatch'
      });

      return NextResponse.json(
        { message: 'Subscription payment verification failed', isOk: false },
        { status: 400 }
      );
    }

    console.log('Subscription payment verified successfully for user:', userId);

    // Find the subscription in database
    const subscription = await db.getSubscriptionByRazorpayId(razorpaySubscriptionId);

    if (!subscription) {
      // Try to find any subscription with this razorpay ID and mark as failed
      const existingSubscription = await db.getSubscriptionByRazorpayId(razorpaySubscriptionId);
      if (existingSubscription) {
        await db.updateSubscriptionByRazorpayId(razorpaySubscriptionId, {
          status: 'failed'
        });
      }

      await db.createTransaction({
        userId: userId,
        subscriptionId: existingSubscription?.id,
        razorpayPaymentId: razorpayPaymentId,
        amount: amount ? amount / 100 : 0,
        type: 'SUBSCRIPTION_VERIFICATION_ERROR',
        status: 'ERROR',
        description: 'Subscription not found in database'
      });

      return NextResponse.json(
        { message: 'Subscription not found', isOk: false },
        { status: 404 }
      );
    }

    // Update subscription status to active and increment paid count
    await db.updateSubscriptionByRazorpayId(razorpaySubscriptionId, {
      status: 'active',
      paidCount: (subscription.paidCount || 0) + 1,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    // Do not allocate credits immediately after payment verification
    // Log successful subscription payment, but indicate credits will be allocated soon
    await db.createTransaction({
      userId: userId,
      subscriptionId: subscription.id,
      razorpayPaymentId: razorpayPaymentId,
      amount: amount ? amount / 100 : 0,
      type: 'SUBSCRIPTION_PAYMENT_SUCCESS',
      status: 'SUCCESS',
      description: 'Subscription payment verified successfully. Credits will be allocated soon.'
    });

    return NextResponse.json(
      {
        message: 'Subscription payment verified successfully. Credits will be allocated soon.',
        isOk: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying subscription payment:', error);

    // Log error
    await db.createTransaction({
      userId: 'unknown',
      razorpayPaymentId: 'unknown',
      amount: 0,
      type: 'SUBSCRIPTION_PAYMENT_ERROR',
      status: 'ERROR',
      description: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { message: 'Internal server error', isOk: false },
      { status: 500 }
    );
  }
}
