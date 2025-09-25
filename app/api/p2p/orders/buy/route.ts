
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

// USDC transfer setup
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const USDC_CONTRACT_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4";
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
const provider = INFURA_API_KEY
  ? new ethers.JsonRpcProvider(`https://polygon-amoy.infura.io/v3/${INFURA_API_KEY}`, {
      chainId: 80002,
      name: "polygon-amoy",
    })
  : null;
const signer = PRIVATE_KEY && provider ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
const usdcContract = signer ? new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, signer) : null;

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

    // Transfer USDC to buyer after payment
    if (!signer || !usdcContract) {
      return NextResponse.json({ success: false, error: 'Server misconfiguration: missing keys or provider.' }, { status: 500 });
    }
    // Get buyer wallet address from DB
    const buyer = await prisma.user.findUnique({ where: { clerkId: buyerId } });
    if (!buyer || !buyer.walletAddress) {
      return NextResponse.json({ success: false, error: 'Buyer wallet address not found' }, { status: 404 });
    }
    // Check USDC balance
    const senderAddress = signer.address;
    const usdcBalance = await usdcContract.balanceOf(senderAddress);
    const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
    if (parseFloat(usdcFormatted) < parseFloat(amount)) {
      return NextResponse.json({ success: false, error: 'Insufficient USDC balance', currentBalance: usdcFormatted }, { status: 400 });
    }
    // Transfer USDC
    const usdcAmount = ethers.parseUnits(amount.toString(), 6);
    let tx, receipt;
    try {
      tx = await usdcContract.transfer(buyer.walletAddress, usdcAmount);
      receipt = await tx.wait();
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.shortMessage || err.message, details: err.reason || 'USDC transfer failed' }, { status: 500 });
    }

    // Optionally: create a transaction record here
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      usdcTransfer: {
        txHash: receipt.transactionHash,
        amount: amount,
        receiver: buyer.walletAddress,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
      }
    });
  } catch (error) {
    console.error('Buy order error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
