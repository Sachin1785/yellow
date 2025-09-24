import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'SELL'
    const cryptocurrency = searchParams.get('cryptocurrency') || 'USDC'
    const sortBy = searchParams.get('sortBy') || 'price'
    const paymentMethod = searchParams.get('paymentMethod')

    // Build where clause
    const where: any = {
      type: type.toUpperCase(),
      cryptocurrency: cryptocurrency.toUpperCase(),
      status: 'ACTIVE',
      availableAmount: {
        gt: 0
      }
    }

    // Add payment method filter if specified
    if (paymentMethod && paymentMethod !== 'All payment methods') {
      where.paymentMethods = {
        has: paymentMethod.toUpperCase()
      }
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'Price':
        orderBy = { price: 'asc' }
        break
      case 'Completion Rate':
        orderBy = { completionRate: 'desc' }
        break
      case 'Amount':
        orderBy = { availableAmount: 'desc' }
        break
      default:
        orderBy = { price: 'asc' }
    }

    const orders = await prisma.p2POrder.findMany({
      where,
      orderBy,
      take: 50, // Limit to 50 orders
      select: {
        id: true,
        userId: true,
        type: true,
        cryptocurrency: true,
        fiatCurrency: true,
        price: true,
        totalAmount: true,
        availableAmount: true,
        minLimit: true,
        maxLimit: true,
        paymentMethods: true,
        timeLimit: true,
        completionRate: true,
        totalOrders: true,
        verified: true,
        rating: true,
        createdAt: true
      }
    })

    // Transform the data to match the frontend format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      trader: {
        name: `User${order.userId.slice(-4)}`, // Show last 4 chars of userId for privacy
        completion: `${order.completionRate.toFixed(2)}%`,
        orders: order.totalOrders,
        verified: order.verified,
        rating: parseFloat(order.rating.toString())
      },
      price: `₹${order.price.toFixed(2)}`,
      available: `${order.availableAmount.toFixed(2)} ${order.cryptocurrency}`,
      limits: `₹${order.minLimit.toFixed(2)} - ₹${order.maxLimit.toFixed(2)}`,
      paymentMethods: order.paymentMethods.map(method => {
        switch (method) {
          case 'UPI': return 'UPI'
          case 'IMPS': return 'IMPS'
          case 'BANK_TRANSFER': return 'Bank Transfer (India)'
          default: return method
        }
      }),
      timeLimit: `${order.timeLimit} min`
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })
  } catch (error) {
    console.error('Error fetching P2P orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
      const {
      cryptocurrency,
      price,
      totalAmount
    } = body

    // Validation
    if (!cryptocurrency || !price || !totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }// For now, we'll use a sample user ID - in production, get this from auth
    const userId = 'user_' + Date.now()

    const newOrder = await prisma.p2POrder.create({
      data: {
        userId,
        type: 'SELL', // Always SELL for this form
        cryptocurrency: cryptocurrency.toUpperCase(),
        fiatCurrency: 'INR',
        price,
        totalAmount,        availableAmount: totalAmount, // Initially all amount is available
        minLimit: 0, // Default minimum limit
        maxLimit: totalAmount * price, // Default maximum limit based on total available
        paymentMethods: ['UPI', 'IMPS'], // Default payment methods
        timeLimit: 30, // Default 30 minutes
        status: 'ACTIVE',
        completionRate: 95.0, // Default completion rate for new users
        totalOrders: 0,
        verified: false,
        rating: 4.5 // Default rating for new users
      }
    })

    return NextResponse.json({
      success: true,
      order: newOrder
    })

  } catch (error) {
    console.error('Error creating P2P order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
