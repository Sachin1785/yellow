import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Load environment variables
const MONAD_PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY;
const MONAD_WALLET_ADDRESS = process.env.MONAD_WALLET_ADDRESS;
const MONAD_RPC_URL = process.env.MONAD_RPC_URL;
const MONAD_CHAIN_ID = process.env.MONAD_CHAIN_ID;
const PAYMENT_CONTRACT_ADDRESS = process.env.PAYMENT_ADDRESS;

// Payment contract ABI (replace with your actual ABI)
const PAYMENT_ABI = [
  "function sendPayment(address receiver) payable"
];

// Set up provider and signer for Monad testnet
const provider = MONAD_RPC_URL 
  ? new ethers.JsonRpcProvider(MONAD_RPC_URL, {
      chainId: MONAD_CHAIN_ID ? Number(MONAD_CHAIN_ID) : 10143,
      name: "monad-testnet",
    })
  : null;
const signer = MONAD_PRIVATE_KEY && provider ? new ethers.Wallet(MONAD_PRIVATE_KEY, provider) : null;
const paymentContract = signer && PAYMENT_CONTRACT_ADDRESS
  ? new ethers.Contract(PAYMENT_CONTRACT_ADDRESS, PAYMENT_ABI, signer)
  : null;

export async function POST(req: NextRequest) {
  if (!signer || !paymentContract || !provider) {
    return NextResponse.json({ error: "Server misconfiguration: missing keys, provider, or contract address." }, { status: 500 });
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
    // Check MON balance
    const senderAddress = signer.address;
    console.log("Sender address:", senderAddress);
    const monBalance = await provider.getBalance(senderAddress);
    const monFormatted = ethers.formatEther(monBalance);
    console.log("Current balance:", monFormatted, "MON");
    const gasReserve = 0.01;
    const totalRequired = parseFloat(amount) + gasReserve;
    console.log("Required amount:", amount, "MON");
    console.log("Gas reserve:", gasReserve, "MON");
    console.log("Total required:", totalRequired, "MON");
    
    if (parseFloat(monFormatted) < totalRequired) {
      return NextResponse.json({
        error: "Insufficient MON balance (including gas reserve)",
        currentBalance: monFormatted,
        requiredAmount: amount,
        totalRequired: totalRequired,
        gasReserve: gasReserve,
        token: "MON",
        senderAddress: senderAddress
      }, { status: 400 });
    }
    // Send MON through the Payment contract
    const tx = await paymentContract.sendPayment(receiver, {
      value: ethers.parseEther(amount.toString()),
    });
    const receipt = await tx.wait();
    return NextResponse.json({
      message: "MON payment sent successfully",
      txHash: receipt.transactionHash,
      token: "MON",
      amount: amount,
      receiver: receiver,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.shortMessage || error.message,
      details: error.reason || "Transaction failed",
    }, { status: 500 });
  }
}
