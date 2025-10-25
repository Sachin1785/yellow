import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Load environment variables
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const USDC_CONTRACT_ADDRESS = " "; // USDC on Polygon Amoy
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Set up provider and signer
const provider = INFURA_API_KEY
  ? new ethers.JsonRpcProvider(`https://polygon-amoy.infura.io/v3/${INFURA_API_KEY}`, {
      chainId: 80002,
      name: "polygon-amoy",
    })
  : null;
const signer = PRIVATE_KEY && provider ? new ethers.Wallet(PRIVATE_KEY, provider) : null;
const usdcContract = signer ? new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, signer) : null;

export async function POST(req: NextRequest) {
  if (!signer || !usdcContract) {
    return NextResponse.json({ error: "Server misconfiguration: missing keys or provider." }, { status: 500 });
  }
  try {
    const body = await req.json();
    const { receiver, amount } = body;
    if (!receiver || !amount) {
      return NextResponse.json({ error: "Missing required parameters: receiver, amount" }, { status: 400 });
    }
    if (!ethers.isAddress(receiver)) {
      return NextResponse.json({ error: "Invalid receiver address" }, { status: 400 });
    }
    // Check USDC balance
    const senderAddress = signer.address;
    const usdcBalance = await usdcContract.balanceOf(senderAddress);
    const usdcFormatted = ethers.formatUnits(usdcBalance, 6);
    if (parseFloat(usdcFormatted) < parseFloat(amount)) {
      return NextResponse.json({
        error: "Insufficient USDC balance",
        currentBalance: usdcFormatted,
        requiredAmount: amount,
      }, { status: 400 });
    }
    // Transfer USDC
    const usdcAmount = ethers.parseUnits(amount.toString(), 6);
    const tx = await usdcContract.transfer(receiver, usdcAmount);
    const receipt = await tx.wait();
    return NextResponse.json({
      message: "USDC transferred successfully",
      txHash: receipt.transactionHash,
      amount: amount,
      receiver: receiver,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.shortMessage || error.message,
      details: error.reason || "Transaction failed",
    }, { status: 500 });
  }
}