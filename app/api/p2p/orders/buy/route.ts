import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/p2p/orders/buy
export async function POST(req: NextRequest) {
  try {
    const { orderId, amount, buyerId } = await req.json();
    if (!orderId || !amount || !buyerId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    // Find the order
    const order = await prisma.p2POrder.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    // Check available amount
    if (Number(order.availableAmount) < Number(amount)) {
      return NextResponse.json({ success: false, error: 'Not enough tokens available' }, { status: 400 });
    }
    // Subtract amount
    const updatedOrder = await prisma.p2POrder.update({
      where: { id: orderId },
      data: {
        availableAmount: {
          decrement: amount
        }
      }
    });
    // Optionally: create a transaction record here
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Buy order error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
