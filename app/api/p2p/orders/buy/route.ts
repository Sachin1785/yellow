
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

// Transfer setup
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const MONAD_PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY;
const USDC_CONTRACT_ADDRESS = "0x8B0180f2101c8260d49339abfEe87927412494B4";
const PAYMENT_CONTRACT_ADDRESS = process.env.PAYMENT_ADDRESS;

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const PAYMENT_ABI = [
  "function sendPayment(address receiver) payable"
];

// Set up providers for different networks
const polygonProvider = INFURA_API_KEY
  ? new ethers.JsonRpcProvider(`https://polygon-amoy.infura.io/v3/${INFURA_API_KEY}`, {
      chainId: 80002,
      name: "polygon-amoy",
    })
  : null;
const monadProvider = process.env.MONAD_RPC_URL
  ? new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL, {
      chainId: process.env.MONAD_CHAIN_ID ? Number(process.env.MONAD_CHAIN_ID) : 10143,
      name: "monad-testnet",
    })
  : null;

// Set up signers
const usdcSigner = PRIVATE_KEY && polygonProvider ? new ethers.Wallet(PRIVATE_KEY, polygonProvider) : null;
const usdcContract = usdcSigner ? new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, usdcSigner) : null;

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

    // Get buyer wallet address from DB
    const buyer = await prisma.user.findUnique({ where: { clerkId: buyerId } });
    if (!buyer || !buyer.walletAddress) {
      return NextResponse.json({ success: false, error: 'Buyer wallet address not found' }, { status: 404 });
    }

    let tx, receipt;
    
    // Handle different cryptocurrencies
    if (order.cryptocurrency === 'USDC') {
      // Transfer USDC
      if (!usdcSigner || !usdcContract || !polygonProvider) {
        return NextResponse.json({ success: false, error: 'Server misconfiguration: missing USDC contract.' }, { status: 500 });
      }
      const senderAddress = usdcSigner.address;
      console.log("[USDC] Sender address:", senderAddress);
      const usdcBalance = await usdcContract.balanceOf(senderAddress);
      const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
      console.log("[USDC] Current balance:", usdcFormatted, "USDC");
      console.log("[USDC] Required amount:", amount, "USDC");
      if (parseFloat(usdcFormatted) < parseFloat(amount)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Insufficient USDC balance', 
          currentBalance: usdcFormatted,
          requiredAmount: amount,
          senderAddress: senderAddress 
        }, { status: 400 });
      }
      try {
        const usdcAmount = ethers.parseUnits(amount.toString(), 6);
        tx = await usdcContract.transfer(buyer.walletAddress, usdcAmount);
        receipt = await tx.wait();
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.shortMessage || err.message, details: err.reason || 'USDC transfer failed' }, { status: 500 });
      }
    } else if (order.cryptocurrency === 'MON') {
      // Transfer MON - Use MONAD_PRIVATE_KEY for MON transactions
      if (!MONAD_PRIVATE_KEY || !monadProvider || !PAYMENT_CONTRACT_ADDRESS) {
        return NextResponse.json({ success: false, error: 'Server misconfiguration: missing MON credentials.' }, { status: 500 });
      }
      const monSigner = new ethers.Wallet(MONAD_PRIVATE_KEY, monadProvider);
      const monPaymentContract = new ethers.Contract(PAYMENT_CONTRACT_ADDRESS, PAYMENT_ABI, monSigner);
      
      // Check MON balance
      const senderAddress = monSigner.address;
      console.log("[MON] Sender address:", senderAddress);
      const senderBalance = await monadProvider.getBalance(senderAddress);
      const monFormatted = ethers.formatEther(senderBalance);
      console.log("[MON] Current balance:", monFormatted, "MON");
      const gasReserve = 0.01; // Keep some MON for gas
      const totalRequired = parseFloat(amount) + gasReserve;
      console.log("[MON] Required amount:", amount, "MON");
      console.log("[MON] Gas reserve:", gasReserve, "MON");
      console.log("[MON] Total required:", totalRequired, "MON");
      if (parseFloat(monFormatted) < totalRequired) {
        return NextResponse.json({ 
          success: false, 
          error: 'Insufficient MON balance (including gas reserve)', 
          currentBalance: monFormatted,
          requiredAmount: amount,
          totalRequired: totalRequired,
          gasReserve: gasReserve,
          token: "MON",
          senderAddress: senderAddress
        }, { status: 400 });
      }
      try {
        tx = await monPaymentContract.sendPayment(buyer.walletAddress, {
          value: ethers.parseEther(amount.toString())
        });
        receipt = await tx.wait();
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.shortMessage || err.message, details: err.reason || 'MON transfer failed' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported cryptocurrency' }, { status: 400 });
    }

    // Optionally: create a transaction record here
    return NextResponse.json({
      success: true,
      order: updatedOrder,
      transfer: {
        type: order.cryptocurrency,
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
