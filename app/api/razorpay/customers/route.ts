import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateJWT } from '../../auth/auth-helper';
import { getUserById } from '@/components/data/data_userManager';
import { db } from '@/lib/db';

const razorpay = new Razorpay({
 key_id: process.env.RAZORPAY_TEST_KEY_ID!,
 key_secret: process.env.RAZORPAY_TEST_KEY_SECRET!,
});

// GET - Fetch all customers
export async function GET(request: NextRequest) {
 try {
  // Get token from cookies for authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  
  if (!token) {
   return NextResponse.json(
    { error: 'Not authenticated' },
    { status: 401 }
   );
  }
  
  // Validate the JWT token
  const decoded = await validateJWT(token.value);
  
  if (!decoded || decoded.res !== 1) {
   return NextResponse.json(
    { error: 'Invalid token' },
    { status: 401 }
   );
  }

  // Fetch customers from Razorpay
  const customers = await razorpay.customers.all();
  
  return NextResponse.json({
   customers: customers.items,
   count: customers.count
  });
 } catch (error) {
  console.error('Error fetching customers:', error);
  return NextResponse.json(
   { error: 'Failed to fetch customers' },
   { status: 500 }
  );
 }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
 try {
  // Get token from cookies for authentication
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  
  if (!token) {
   return NextResponse.json(
    { error: 'Not authenticated' },
    { status: 401 }
   );
  }
  
  // Validate the JWT token
  const decoded = await validateJWT(token.value);
  
  if (!decoded || decoded.res !== 1 || !decoded.userId) {
   return NextResponse.json(
    { error: 'Invalid token' },
    { status: 401 }
   );
  }

  // Get user data from database
  const userData = await getUserById(decoded.userId);
  
  if (!userData) {
   return NextResponse.json(
    { error: 'User not found' },
    { status: 404 }
   );
  }

  const { name, email, contact, fail_existing = false, notes } = await request.json();

  // Use user data if not provided
  const customerData = {
   name: name || userData.name || 'Customer',
   email: email || userData.email,
   contact: contact || userData.phone || '',
   fail_existing: fail_existing,
   notes: {
    internal_user_id: decoded.userId,
    ...notes
   }
  };

  // Validate required fields
  if (!customerData.email) {
   return NextResponse.json(
    { error: 'Email is required' },
    { status: 400 }
   );
  }

  const customer = await razorpay.customers.create(customerData);
  console.log('Customer created:', customer);

  // Log customer creation in database
  await db.createTransaction({
   userId: decoded.userId,
   type: 'CUSTOMER_CREATED',
   amount: 0,
   status: 'SUCCESS',
   description: `Customer created: ${customer.id} - ${customer.email}`
  });

  return NextResponse.json({
   customer: customer,
   message: 'Customer created successfully'
  });
 } catch (error) {
  console.error('Error creating customer:', error);
  
  // Log error in database
  try {
   const cookieStore = await cookies();
   const token = cookieStore.get('token');
   let userId = 'unknown';
   
   if (token) {
    const decoded = await validateJWT(token.value);
    if (decoded && decoded.userId) {
     userId = decoded.userId;
    }
   }
   
   await db.createTransaction({
    userId: userId,
    type: 'CUSTOMER_ERROR',
    amount: 0,
    status: 'ERROR',
    description: error instanceof Error ? error.message : 'Unknown error'
   });
  } catch (dbError) {
   console.error('Error logging to database:', dbError);
  }

  return NextResponse.json(
   { error: 'Failed to create customer' },
   { status: 500 }
  );
 }
}
