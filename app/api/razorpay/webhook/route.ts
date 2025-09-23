import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { db } from '@/lib/db';

// Function to verify webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
}

// Function to determine credit limit based on plan
const getCreditLimitForPlan = (planId: string): number => {
  const planCredits: { [key: string]: number } = {
    'plan_QrUWA1nD05DtIa': 100, // Basic plan
    'plan_QsvJUogFISamtN': 500, // Pro plan (this is what's in your webhook data)
    // Add more plans as needed
  };
  
  console.log(`Getting credit limit for plan: ${planId}`);
  const credits = planCredits[planId] || 50; // Default to 50 credits
  console.log(`Credit limit for plan ${planId}: ${credits}`);
  return credits;
};

// Function to log webhook events to JSON file
function logWebhookEvent(event: string, payload: any, status: 'success' | 'error' | 'processing', error?: any) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      status,
      payload,
      error: error ? { message: error.message, stack: error.stack } : undefined
    };

    const logFilePath = join(process.cwd(), 'webhook-events.json');
    let existingLogs = [];

    // Read existing logs if file exists
    if (existsSync(logFilePath)) {
      try {
        const fileContent = readFileSync(logFilePath, 'utf-8');
        existingLogs = JSON.parse(fileContent);
      } catch (readError) {
        console.error('Error reading existing logs:', readError);
        existingLogs = [];
      }
    }

    // Add new log entry
    existingLogs.push(logEntry);

    // Keep only last 100 entries to prevent file from growing too large
    if (existingLogs.length > 100) {
      existingLogs = existingLogs.slice(-100);
    }

    // Write updated logs
    writeFileSync(logFilePath, JSON.stringify(existingLogs, null, 2));
  } catch (logError) {
    console.error('Error logging webhook event:', logError);
  }
}

export async function POST(request: NextRequest) {
  let body: string;
  let parsedPayload: any;
  
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get the raw body and signature (cache the body)
    body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    parsedPayload = JSON.parse(body);
    const { event, payload: eventPayload } = parsedPayload;

    console.log('Webhook received:', event);
    console.log('Payload:', eventPayload);

    // Log the webhook event
    logWebhookEvent(event, eventPayload, 'processing');

    // Handle different webhook events

    switch (event) {
      case 'subscription.charged':
        await handleSubscriptionCharged(eventPayload);
        logWebhookEvent(event, eventPayload, 'success');
        break;

      case 'subscription.activated':
        // await handleSubscriptionActivated(eventPayload);
        // logWebhookEvent(event, eventPayload, 'success');
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(eventPayload);
        logWebhookEvent(event, eventPayload, 'success');
        break;

      case 'subscription.paused':
        await handleSubscriptionPaused(eventPayload);
        logWebhookEvent(event, eventPayload, 'success');
        break;

      case 'subscription.resumed':
        await handleSubscriptionResumed(eventPayload);
        logWebhookEvent(event, eventPayload, 'success');
        break;

      case 'payment.captured':
        await handlePaymentCaptured(eventPayload);
        logWebhookEvent(event, eventPayload, 'success');
        break;

      case 'payment.failed':
        await handlePaymentFailed(eventPayload);
        logWebhookEvent(event, eventPayload, 'success');
        break;

      default:
        console.log('Unhandled webhook event:', event);
        logWebhookEvent(event, eventPayload, 'success', { message: 'Unhandled event type' });
        break;
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Log the error using cached data
    try {
      const eventName = parsedPayload?.event || 'unknown';
      const eventPayload = parsedPayload?.payload || {};
      logWebhookEvent(eventName, eventPayload, 'error', error);
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



// Handle subscription.charged event (recurring payment)
// Always reset credits and monthly limit, and log payment if present
async function handleSubscriptionCharged(payload: any) {
  try {
    const subscription = payload.subscription?.entity || payload.subscription || null;
    const payment = payload.payment?.entity || payload.payment || null;
    if (!subscription) {
      console.error('No subscription found in payload');
      return;
    }
    const subscriptionId = subscription.id;
    if (!subscriptionId) {
      console.error('No subscription ID found in subscription');
      return;
    }
    // Find the subscription in our database
    const dbSubscription = await db.getSubscriptionByRazorpayId(subscriptionId);
    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscriptionId);
      return;
    }
    // Update subscription status and payment count
    await db.updateSubscriptionByRazorpayId(subscriptionId, {
      status: 'active',
      paidCount: (dbSubscription.paidCount || 0) + 1,
      currentPeriodStart: subscription.current_start ? new Date(subscription.current_start * 1000) : undefined,
      currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : undefined
    });
    // Always reset credits and monthly limit
    const planId = dbSubscription.planId;
    const creditLimit = getCreditLimitForPlan(planId);

    // Fetch user before update to get previous credit balance
    const userBefore = await db.prisma.user.findUnique({ where: { id: dbSubscription.userId } });
    const prevCredits = userBefore?.creditBalance || 0;

    // Log negative credit for remaining credits (if any)
    if (prevCredits > 0) {
      await db.createCreditLog({
        userId: dbSubscription.userId,
        amount: -prevCredits,
        reason: `Remaining credits cleared on subscription renewal.`
      });
    }

    // Update credits and monthly limit
    await db.updateUserCredits(dbSubscription.userId, creditLimit);
    await db.prisma.user.update({
      where: { id: dbSubscription.userId },
      data: {
        monthlyCreditLimit: creditLimit,
        lastResetDate: new Date()
      }
    });

    // Log positive credit for new allocation
    await db.createCreditLog({
      userId: dbSubscription.userId,
      amount: creditLimit,
      reason: `Allocated new credits for subscription renewal.`
    });
    // Log the transaction using payment info if available
    let paymentId = payment?.id;
    let paymentAmount = payment?.amount || 0;
    let paymentCurrency = payment?.currency || 'INR';
    let transactionType = 'SUBSCRIPTION_CHARGED';
    let transactionDescription = `Subscription charged successfully. Credits reset to ${creditLimit}.`;
    if (payment && payment.description && typeof payment.description === 'string' && payment.description.trim() !== '') {
      transactionType = payment.description;
    }
    if (paymentId && paymentAmount > 0) {
      await db.createTransaction({
        userId: dbSubscription.userId,
        subscriptionId: dbSubscription.id,
        razorpayPaymentId: paymentId,
        amount: paymentAmount / 100, // Convert paise to rupees
        currency: paymentCurrency,
        type: transactionType,
        status: 'SUCCESS',
        description: transactionDescription
      });
    } else {
      // Log the activation event even if no payment info
      await db.createTransaction({
        userId: dbSubscription.userId,
        subscriptionId: dbSubscription.id,
        amount: 0,
        type: 'SUBSCRIPTION_CHARGED',
        status: 'SUCCESS',
        description: transactionDescription
      });
    }
    console.log('Subscription charged and credits reset:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription.charged:', error);
    throw error;
  }
}

// Handle subscription.activated event
// Always reset credits and monthly limit, and log payment if present
async function handleSubscriptionActivated(payload: any) {
  try {
    const subscription = payload.subscription?.entity || payload.subscription || null;
    const payment = payload.payment?.entity || payload.payment || null;
    // Extract subscription ID from the nested entity structure
    const subscriptionId = subscription?.id;
    if (!subscriptionId) {
      console.error('No subscription ID found in payload');
      return;
    }
    const dbSubscription = await db.getSubscriptionByRazorpayId(subscriptionId);
    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscriptionId);
      return;
    }
    // Update subscription status
    await db.updateSubscriptionByRazorpayId(subscriptionId, {
      status: 'active',
      currentPeriodStart: subscription.current_start ? new Date(subscription.current_start * 1000) : undefined,
      currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : undefined
    });
    // Always reset credits and monthly limit
    const planId = dbSubscription.planId;
    const creditLimit = getCreditLimitForPlan(planId);
    await db.updateUserCredits(dbSubscription.userId, creditLimit);
    await db.prisma.user.update({
      where: { id: dbSubscription.userId },
      data: {
        monthlyCreditLimit: creditLimit,
        lastResetDate: new Date()
      }
    });
    // Log the transaction using payment info if available
    let paymentId = payment?.id;
    let paymentAmount = payment?.amount || 0;
    let paymentCurrency = payment?.currency || 'INR';
    let transactionType = 'SUBSCRIPTION_ACTIVATED';
    let transactionDescription = `Subscription activated and credits reset to ${creditLimit}.`;
    if (payment && payment.description && typeof payment.description === 'string' && payment.description.trim() !== '') {
      transactionType = payment.description;
    }
    if (paymentId && paymentAmount > 0) {
      await db.createTransaction({
        userId: dbSubscription.userId,
        subscriptionId: dbSubscription.id,
        razorpayPaymentId: paymentId,
        amount: paymentAmount / 100, // Convert paise to rupees
        currency: paymentCurrency,
        type: transactionType,
        status: 'SUCCESS',
        description: transactionDescription
      });
    } else {
      // Log the activation event even if no payment info
      await db.createTransaction({
        userId: dbSubscription.userId,
        subscriptionId: dbSubscription.id,
        amount: 0,
        type: 'SUBSCRIPTION_ACTIVATED',
        status: 'SUCCESS',
        description: transactionDescription
      });
    }
    console.log('Subscription activated and credits reset:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription.activated:', error);
    throw error;
  }
}

// Handle subscription.cancelled event
async function handleSubscriptionCancelled(payload: any) {
  try {
    const { subscription } = payload;
    
    // Extract subscription ID from the nested entity structure
    const subscriptionId = subscription?.entity?.id || subscription?.id;
    
    if (!subscriptionId) {
      console.error('No subscription ID found in payload');
      return;
    }
    
    const dbSubscription = await db.getSubscriptionByRazorpayId(subscriptionId);
    
    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscriptionId);
      return;
    }

    // Update subscription status
    await db.updateSubscriptionByRazorpayId(subscriptionId, {
      status: 'cancelled'
    });

    // No transaction logging for webhook-based cancellation
    console.log('Subscription cancelled (no credit reset, no transaction log in webhook):', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription.cancelled:', error);
    throw error;
  }
}

// Handle subscription.paused event
async function handleSubscriptionPaused(payload: any) {
  try {
    const { subscription } = payload;
    
    // Extract subscription ID from the nested entity structure
    const subscriptionId = subscription?.entity?.id || subscription?.id;
    
    if (!subscriptionId) {
      console.error('No subscription ID found in payload');
      return;
    }
    
    const dbSubscription = await db.getSubscriptionByRazorpayId(subscriptionId);
    
    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscriptionId);
      return;
    }

    // Update subscription status
    await db.updateSubscriptionByRazorpayId(subscriptionId, {
      status: 'paused'
    });

    // Log the transaction
    await db.createTransaction({
      userId: dbSubscription.userId,
      subscriptionId: dbSubscription.id,
      amount: 0,
      type: 'SUBSCRIPTION_PAUSED',
      status: 'SUCCESS',
      description: 'Subscription paused.'
    });

    console.log('Subscription paused:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription.paused:', error);
    throw error;
  }
}

// Handle subscription.resumed event
async function handleSubscriptionResumed(payload: any) {
  try {
    const { subscription } = payload;
    
    // Extract subscription ID from the nested entity structure
    const subscriptionId = subscription?.entity?.id || subscription?.id;
    
    if (!subscriptionId) {
      console.error('No subscription ID found in payload');
      return;
    }
    
    const dbSubscription = await db.getSubscriptionByRazorpayId(subscriptionId);
    
    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscriptionId);
      return;
    }

    // Update subscription status
    await db.updateSubscriptionByRazorpayId(subscriptionId, {
      status: 'active'
    });

    // Log the transaction
    await db.createTransaction({
      userId: dbSubscription.userId,
      subscriptionId: dbSubscription.id,
      amount: 0,
      type: 'SUBSCRIPTION_RESUMED',
      status: 'SUCCESS',
      description: 'Subscription resumed.'
    });

    console.log('Subscription resumed:', subscriptionId);
  } catch (error) {
    console.error('Error handling subscription.resumed:', error);
    throw error;
  }
}

// Handle payment.captured event (one-time payments)
async function handlePaymentCaptured(payload: any) {
  try {
    const { payment } = payload;
    // Extract payment details
    const paymentEntity = payment?.entity || payment;
    const paymentId = paymentEntity?.id;
    const paymentAmount = paymentEntity?.amount || 0;
    const paymentCurrency = paymentEntity?.currency || 'INR';
    const userId = paymentEntity?.notes?.userId;

    // Only log if we have valid payment data and user exists
    if (paymentId && paymentAmount > 0 && userId) {
      // Check if user exists before creating transaction
      const user = await db.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await db.createTransaction({
          userId: userId,
          razorpayPaymentId: paymentId,
          amount: paymentAmount / 100, // Convert paise to rupees
          currency: paymentCurrency,
          type: 'PAYMENT_CAPTURED',
          status: 'SUCCESS',
          description: `Payment captured: ${paymentEntity?.description || 'One-time payment'}`
        });
      } else {
        console.warn('User not found for payment.captured event:', userId);
      }
    } else {
      console.warn('Missing userId or payment info for payment.captured event:', { paymentId, paymentAmount, userId });
    }

    console.log('Payment captured:', paymentId);
  } catch (error) {
    console.error('Error handling payment.captured:', error);
    throw error;
  }
}

// Handle payment.failed event
async function handlePaymentFailed(payload: any) {
  try {
    const { payment } = payload;
    
    // Extract payment details
    const paymentEntity = payment?.entity || payment;
    const paymentId = paymentEntity?.id;
    const paymentAmount = paymentEntity?.amount || 0;
    const paymentCurrency = paymentEntity?.currency || 'INR';
    const userId = paymentEntity?.notes?.userId;
    
    // Only log if we have valid payment data
    if (paymentId) {
      await db.createTransaction({
        userId: userId || 'unknown',
        razorpayPaymentId: paymentId,
        amount: paymentAmount / 100, // Convert paise to rupees
        currency: paymentCurrency,
        type: 'PAYMENT_FAILED',
        status: 'FAILED',
        description: `Payment failed: ${paymentEntity?.error_description || 'Unknown error'}`
      });
    }

    console.log('Payment failed:', paymentId);
  } catch (error) {
    console.error('Error handling payment.failed:', error);
    throw error;
  }
}
