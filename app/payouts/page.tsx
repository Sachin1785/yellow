
"use client";
import { useState } from "react";


export default function PayoutsPage() {
	const [account_number, setAccountNumber] = useState("");
	const [fund_account_id, setFundAccountId] = useState("");
	const [amount, setAmount] = useState(1000);
	const [reference_id, setReferenceId] = useState("");
	const [narration, setNarration] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");
		try {
			const res = await fetch("/api/razorpay/payouts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					account_number,
					fund_account_id,
					amount,
					reference_id: reference_id || undefined,
					narration: narration || undefined,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Payout failed");
			setMessage(data.message || "Payout initiated");
		} catch (err: any) {
			setMessage(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
			<h2 className="text-2xl font-bold mb-4">Test Razorpay Payout</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block mb-1">Source Account Number</label>
					<input
						type="text"
						className="w-full border px-3 py-2 rounded"
						value={account_number}
						onChange={e => setAccountNumber(e.target.value)}
						required
					/>
				</div>
				<div>
					<label className="block mb-1">Fund Account ID</label>
					<input
						type="text"
						className="w-full border px-3 py-2 rounded"
						value={fund_account_id}
						onChange={e => setFundAccountId(e.target.value)}
						required
					/>
				</div>
				<div>
					<label className="block mb-1">Amount (in paise)</label>
					<input
						type="number"
						className="w-full border px-3 py-2 rounded"
						value={amount}
						min={1000}
						onChange={e => setAmount(Number(e.target.value))}
						required
					/>
				</div>
				<div>
					<label className="block mb-1">Reference ID (optional)</label>
					<input
						type="text"
						className="w-full border px-3 py-2 rounded"
						value={reference_id}
						onChange={e => setReferenceId(e.target.value)}
					/>
				</div>
				<div>
					<label className="block mb-1">Narration (optional)</label>
					<input
						type="text"
						className="w-full border px-3 py-2 rounded"
						value={narration}
						onChange={e => setNarration(e.target.value)}
					/>
				</div>
				<button
					type="submit"
					className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
					disabled={loading}
				>
					{loading ? "Processing..." : "Send Payout"}
				</button>
			</form>
			{message && <div className="mt-4 text-center font-semibold">{message}</div>}
		</div>
	);
}
