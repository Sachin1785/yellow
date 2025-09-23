"use client";
import { useState } from "react";

export default function PaymentPage() {
	const [email, setEmail] = useState("");
	const [number, setNumber] = useState("");
	const [amount, setAmount] = useState(500);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");
		try {
			// 1. Create order
			const res = await fetch("/api/razorpay/order", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ amount, email, number }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Order creation failed");

			// 2. Load Razorpay script
			await loadRazorpay();

			// 3. Open Razorpay modal
			const options = {
				key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
				amount: amount,
				currency: "INR",
				name: "CryptoBazaar",
				description: "Test Payment",
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
							email,
							number,
							amount,
						}),
					});
					const verifyData = await verifyRes.json();
					setMessage(verifyData.message || (verifyData.isOk ? "Payment Success" : "Payment Failed"));
				},
				prefill: {
					email,
					contact: number,
				},
				theme: { color: "#3399cc" },
			};
			// @ts-ignore
			const rzp = new window.Razorpay(options);
			rzp.open();
		} catch (err: any) {
			setMessage(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
			<h2 className="text-2xl font-bold mb-4">Pay with Razorpay</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block mb-1">Email</label>
					<input
						type="email"
						className="w-full border px-3 py-2 rounded"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
				</div>
				<div>
					<label className="block mb-1">Number</label>
					<input
						type="tel"
						className="w-full border px-3 py-2 rounded"
						value={number}
						onChange={e => setNumber(e.target.value)}
						required
					/>
				</div>
				<div>
					<label className="block mb-1">Amount (paise, min 500)</label>
					<input
						type="number"
						className="w-full border px-3 py-2 rounded"
						value={amount}
						min={500}
						onChange={e => setAmount(Number(e.target.value))}
						required
					/>
				</div>
				<button
					type="submit"
					className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
					disabled={loading}
				>
					{loading ? "Processing..." : "Pay Now"}
				</button>
			</form>
			{message && <div className="mt-4 text-center font-semibold">{message}</div>}
		</div>
	);
}
