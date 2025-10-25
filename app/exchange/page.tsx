"use client"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@clerk/nextjs"
// Razorpay script loader
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });
};
import { motion } from "framer-motion"
import {
  ChevronDown,
  Filter,
  Search,
  Star,
  Shield,
  Clock,
  TrendingUp,
  Smartphone,
  CreditCard,
  User,
  Loader2,
  X,
  Plus
} from "lucide-react"
import Link from "next/link"

// Types for P2P orders
interface Trader {
  name: string;
  completion: string;
  orders: number;
  verified: boolean;
  rating: number;
}

interface P2POrder {
  id: string;
  trader: Trader;
  price: string;
  available: string;
  limits: string;
  paymentMethods: string[];
  timeLimit: string;
}

const Button = ({ 
  children, 
  variant = "default", 
  size = "default", 
  className = "", 
  onClick,
  disabled = false,
  type
}: {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost" | "success"
  size?: "default" | "sm" | "lg"
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    default: "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700",
    outline: "border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white",
    ghost: "text-gray-400 hover:bg-gray-800 hover:text-white",
    success: "bg-lime-400 text-black hover:bg-lime-300 font-semibold"
  }

  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs",
    lg: "px-6 py-3 text-base"
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

export default function ExchangePage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('sell')
  // Buy modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyOrder, setBuyOrder] = useState<P2POrder | null>(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [buyError, setBuyError] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyMessage, setBuyMessage] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerNumber, setBuyerNumber] = useState("");
  // Always fetch email and phone from backend using Clerk ID
  // Always fetch email and phone from backend using Clerk ID
  useEffect(() => {
    if (isLoaded && user) {
      fetch(`/api/user-status?clerkId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setBuyerEmail(data?.email || "");
          setBuyerNumber(data?.phone || "");
        });
    }
  }, [isLoaded, user]);

  // When modal opens, always use the latest fetched values
  useEffect(() => {
    if (showBuyModal && !buyerEmail && isLoaded && user) {
      fetch(`/api/user-status?clerkId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setBuyerEmail(data?.email || "");
          setBuyerNumber(data?.phone || "");
        });
    }
  }, [showBuyModal, isLoaded, user]);
  const buyInputRef = useRef<HTMLInputElement>(null);
  const [selectedCrypto, setSelectedCrypto] = useState('USDC')
  const [selectedCurrency, setSelectedCurrency] = useState('INR')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All payment methods')
  const [sortBy, setSortBy] = useState('Price')
  const [orders, setOrders] = useState<P2POrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateAd, setShowCreateAd] = useState(false)
  // Create Ad form state
  const [createAdForm, setCreateAdForm] = useState({
    cryptocurrency: 'USDC',
    price: '',
    totalAmount: ''
  })
  const [createAdLoading, setCreateAdLoading] = useState(false)

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        type: activeTab.toUpperCase(),
        cryptocurrency: selectedCrypto,
        sortBy: sortBy,
        ...(selectedPaymentMethod !== 'All payment methods' && { paymentMethod: selectedPaymentMethod })
      })

      const response = await fetch(`/api/p2p/orders?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders)
      } else {
        setError(data.error || 'Failed to fetch orders')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }
  // Fetch orders on component mount and when filters change
  useEffect(() => {
    fetchOrders()
  }, [activeTab, selectedCrypto, selectedPaymentMethod, sortBy])

  // Handle create ad form submission
  const handleCreateAd = async () => {
    try {
      setCreateAdLoading(true)
        const response = await fetch('/api/p2p/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createAdForm,
          price: parseFloat(createAdForm.price),
          totalAmount: parseFloat(createAdForm.totalAmount)
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowCreateAd(false)
        setCreateAdForm({
          cryptocurrency: 'USDC',
          price: '',
          totalAmount: ''
        })
        fetchOrders() // Refresh the orders list
      } else {
        alert(data.error || 'Failed to create ad')
      }
    } catch (err) {
      alert('Network error occurred')
      console.error('Error creating ad:', err)
    } finally {
      setCreateAdLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Exchange</h1>
            <p className="text-gray-400">Buy and sell crypto directly with other users</p>
          </div>
          <Button 
            variant="success" 
            size="lg"
            onClick={() => setShowCreateAd(true)}
            className="flex items-center gap-2"
          >
            + Create Ad
          </Button>
        </div>

        {/* Trading Controls */}
        <div className="bg-gray-900/50 rounded-xl p-6 mb-8 border border-gray-800">
          {/* Buy/Sell Tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'buy' 
                  ? 'bg-lime-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sell
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'sell' 
                  ? 'bg-lime-400 text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Buy
            </button>
          </div>

          {/* Crypto and Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">            {/* Crypto Selection */}
            <div className="flex bg-gray-800 rounded-lg">
              <button
                onClick={() => setSelectedCrypto('USDC')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-l-lg transition-all ${
                  selectedCrypto === 'USDC' 
                    ? 'bg-lime-400 text-black' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                USDC
              </button>
              <button
                onClick={() => setSelectedCrypto('USDT')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  selectedCrypto === 'USDT' 
                    ? 'bg-lime-400 text-black' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                USDT
              </button>
              <button
                onClick={() => setSelectedCrypto('MON')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-r-lg transition-all ${
                  selectedCrypto === 'MON' 
                    ? 'bg-lime-400 text-black' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                MON
              </button>
            </div>

            {/* Currency */}
            <div className="relative">
              <select 
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="INR">🇮🇳 INR</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Transaction Amount */}
            <div className="relative">
              <input
                type="text"
                placeholder="Transaction amount"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">INR</span>
            </div>

            {/* Payment Method */}
            <div className="relative">
              <select 
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="All payment methods">All payment methods</option>
                <option value="UPI">UPI</option>
                <option value="IMPS">IMPS</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Filter and Sort */}
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort By</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="Price">Price</option>
                {/* <option value="Completion Rate">Completion Rate</option> */}
                <option value="Amount">Amount</option>
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Trading Ads Table */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 p-4 bg-gray-800/50 border-b border-gray-700 text-sm font-medium text-gray-400">
            <div>Advertisers</div>
            <div>Price</div>
            <div>Available/Order Limit</div>
            <div>Payment</div>
            <div>Trade</div>
          </div>          {/* Table Rows */}
          <div className="divide-y divide-gray-800">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
                <span className="ml-3 text-gray-400">Loading orders...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-red-400 mb-2">Error loading orders</p>
                  <p className="text-gray-400 text-sm">{error}</p>
                  <button 
                    onClick={fetchOrders}
                    className="mt-3 px-4 py-2 bg-lime-400 text-black rounded-lg hover:bg-lime-300 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">No orders available</p>
                  <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
                </div>
              </div>
            ) : (
              orders.map((ad, index) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="grid grid-cols-5 gap-4 p-4 hover:bg-gray-800/30 transition-colors"
              >
                {/* Advertiser */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-white">{ad.trader.name}</span>
                        {ad.trader.verified && (
                          <Shield className="h-4 w-4 text-lime-400" />
                        )}
                      </div>
                      {/* <div className="text-xs text-gray-400">
                        {ad.trader.orders} orders • {ad.trader.completion} completion
                      </div> */}
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < Math.floor(ad.trader.rating) 
                              ? 'text-lime-400 fill-current' 
                              : 'text-gray-600'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{ad.trader.rating}</span>
                  </div> */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                      <span>100%</span>
                    </div>
                    {/* <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{ad.timeLimit}</span>
                    </div> */}
                  </div>
                </div>

                {/* Price */}
                <div className="flex flex-col justify-center">
                  <div className="text-lg font-semibold text-white">{ad.price}</div>
                  <div className="text-xs text-gray-400">Lowest price</div>
                </div>

                {/* Available/Limits */}
                <div className="flex flex-col justify-center">
                  <div className="text-white font-medium">{ad.available}</div>
                  <div className="text-xs text-gray-400">{ad.limits}</div>
                </div>

                {/* Payment Methods */}
                <div className="flex flex-col justify-center space-y-1">
                  {ad.paymentMethods.map((method, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      {method.includes('UPI') && <Smartphone className="h-3 w-3 text-lime-400" />}
                      {method.includes('Bank') && <CreditCard className="h-3 w-3 text-blue-400" />}
                      {method.includes('IMPS') && <TrendingUp className="h-3 w-3 text-purple-400" />}
                      <span className="text-gray-300">{method}</span>
                    </div>
                  ))}
                </div>

                {/* Trade Button */}
                <div className="flex items-center justify-center">
                  <Button 
                    variant="success" 
                    className="w-full max-w-[120px]"
                    onClick={() => {
                      setBuyOrder(ad);
                      setShowBuyModal(true);
                      setBuyAmount("");
                      setBuyError("");
                      setBuyMessage("");
                      setBuyerEmail("");
                      setBuyerNumber("");
                      setTimeout(() => buyInputRef.current?.focus(), 100);
                    }}
                  >
                    {activeTab === 'buy' ? `Buy ${selectedCrypto}` : `Buy ${selectedCrypto}`}
                  </Button>
                </div>
      {/* Buy Modal */}
      {showBuyModal && buyOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Buy {selectedCrypto}</h2>
              <button
                onClick={() => setShowBuyModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form
              className="p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBuyError("");
                setBuyMessage("");
                const available = Number((buyOrder.available || "0").toString().replace(/,/g, ""));
                const amountNum = parseFloat(buyAmount);
                const price = Number((buyOrder.price || "0").toString().replace(/[^\d.]/g, ""));
                if (isNaN(amountNum) || amountNum <= 0) {
                  setBuyError("Enter a valid amount greater than 0");
                  return;
                }
                if (amountNum > available) {
                  setBuyError(`Cannot buy more than seller's available (${buyOrder.available})`);
                  return;
                }
                if (!buyerEmail || !buyerNumber) {
                  setBuyError("Could not fetch your email or phone number. Please complete your profile.");
                  return;
                }
                if (isNaN(price) || price <= 0) {
                  setBuyError("Invalid price for this order. Please try another order.");
                  return;
                }
                setBuyLoading(true);
                try {
                  // Calculate fiat amount (price * tokens), convert to paise
                  const totalFiat = Math.round(price * amountNum * 100); // paise
                  if (isNaN(totalFiat) || totalFiat < 500) {
                    setBuyError(`Minimum payment is ₹5 (500 paise). Your total: ₹${isNaN(totalFiat) ? '0.00' : (totalFiat/100).toFixed(2)}`);
                    setBuyLoading(false);
                    return;
                  }
                  // 1. Create order
                  const res = await fetch("/api/razorpay/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: totalFiat, email: buyerEmail, number: buyerNumber }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Order creation failed");
                  // 2. Load Razorpay script
                  await loadRazorpay();
                  // 3. Open Razorpay modal
                  const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: totalFiat,
                    currency: "INR",
                    name: "CryptoBazaar",
                    description: `Buy ${amountNum} ${selectedCrypto}`,
                    order_id: data.orderId,
                    handler: async function (response: any) {
                      // 4. Verify payment
                      const verifyRes = await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          orderCreationId: data.orderId,
                          razorpayPaymentId: response.razorpay_payment_id,
                          razorpaySignature: response.razorpay_signature,
                          email: buyerEmail,
                          number: buyerNumber,
                          amount: totalFiat,
                        }),
                      });
                      const verifyData = await verifyRes.json();
                      if (verifyData.isOk) {
                        // 5. Subtract tokens from availableAmount in backend
                        if (!user) {
                          setBuyError("User not found. Please login again.");
                          return;
                        }
                        const buyRes = await fetch("/api/p2p/orders/buy", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            orderId: buyOrder.id,
                            amount: amountNum,
                            buyerId: user.id
                          })
                        });
                        const buyData = await buyRes.json();
                        if (buyData.success) {
                          setBuyMessage("Purchase successful!");
                          // Show transfer details if available
                          if (buyData.transfer?.txHash) {
                            setBuyMessage(
                              `Purchase successful! ${buyData.transfer.type} transferred. Tx Hash: ${buyData.transfer.txHash}`
                            );
                          }
                          setShowBuyModal(false);
                          setBuyOrder(null);
                          setBuyAmount("");
                          fetchOrders(); // Refresh orders to update available tokens
                        } else {
                          setBuyError(buyData.error || "Transaction failed");
                        }
                      } else {
                        setBuyError(verifyData.message || "Payment verification failed");
                      }
                    },
                    prefill: {
                      email: buyerEmail,
                      contact: buyerNumber,
                    },
                    theme: { color: "#3399cc" },
                  };
                  // @ts-ignore
                  const rzp = new window.Razorpay(options);
                  rzp.open();
                } catch (err: any) {
                  setBuyError(err.message || "Something went wrong");
                } finally {
                  setBuyLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Number of tokens to buy</label>
                <input
                  ref={buyInputRef}
                  type="number"
                  min={1}
                  step="any"
                  className="w-full border px-3 py-2 rounded bg-gray-800 border-gray-700 text-white"
                  value={buyAmount}
                  onChange={e => setBuyAmount(e.target.value)}
                  required
                />
                <div className="text-xs text-gray-400 mt-1">Available: {buyOrder.available} {selectedCrypto}</div>
                {/* Per token price and total price */}
                <div className="mt-2 text-sm text-gray-300">
                  <div>Per token price: <span className="font-semibold">{buyOrder.price}</span></div>
                  <div>Total price: <span className="font-semibold">
                    {(() => {
                      const price = Number((buyOrder.price || "0").toString().replace(/[^\d.]/g, ""));
                      const amountNum = parseFloat(buyAmount);
                      if (!isNaN(price) && !isNaN(amountNum) && amountNum > 0) {
                        return `₹${(price * amountNum).toFixed(2)}`;
                      } else {
                        return "₹0.00";
                      }
                    })()}
                  </span></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Your Email</label>
                <input
                  type="email"
                  className="w-full border px-3 py-2 rounded bg-gray-800 border-gray-700 text-white opacity-60"
                  value={buyerEmail}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Your Phone Number</label>
                <input
                  type="tel"
                  className="w-full border px-3 py-2 rounded bg-gray-800 border-gray-700 text-white opacity-60"
                  value={buyerNumber}
                  disabled
                  readOnly
                />
              </div>
              {buyError && <div className="text-red-400 text-sm">{buyError}</div>}
              {buyMessage && <div className="text-green-400 text-sm">{buyMessage}</div>}
              <Button
                variant="success"
                className="w-full"
                type="submit"
                disabled={buyLoading}
              >
                {buyLoading ? "Processing..." : "Pay Now"}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
              </motion.div>
            ))
            )}
          </div>
        </div>        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>All trades are protected by our escrow system. Trade safely and securely.</p>
        </div>

        {/* Create Ad Modal */}
        {showCreateAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-2xl font-bold text-white">Create Sell Advertisement</h2>
                <button
                  onClick={() => setShowCreateAd(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Cryptocurrency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cryptocurrency
                  </label>
                  <div className="flex bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setCreateAdForm({...createAdForm, cryptocurrency: 'USDC'})}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        createAdForm.cryptocurrency === 'USDC' 
                          ? 'bg-lime-400 text-black' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      USDC
                    </button>
                    <button
                      onClick={() => setCreateAdForm({...createAdForm, cryptocurrency: 'USDT'})}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        createAdForm.cryptocurrency === 'USDT' 
                          ? 'bg-lime-400 text-black' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      USDT
                    </button>
                    <button
                      onClick={() => setCreateAdForm({...createAdForm, cryptocurrency: 'MON'})}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        createAdForm.cryptocurrency === 'MON' 
                          ? 'bg-lime-400 text-black' 
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      MON
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (INR per {createAdForm.cryptocurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 90.50"
                    value={createAdForm.price}
                    onChange={(e) => setCreateAdForm({...createAdForm, price: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Amount ({createAdForm.cryptocurrency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10000"
                    value={createAdForm.totalAmount}
                    onChange={(e) => setCreateAdForm({...createAdForm, totalAmount: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-4 p-6 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateAd(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={handleCreateAd}
                  disabled={createAdLoading || !createAdForm.price || !createAdForm.totalAmount}
                  className="flex-1"
                >
                  {createAdLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Advertisement'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
