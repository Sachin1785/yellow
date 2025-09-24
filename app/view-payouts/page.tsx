"use client";
import { useState } from "react";

export default function ContactPayoutsPage() {
  const [contactId, setContactId] = useState("");
  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPayouts([]);
    try {
      if (!contactId) {
        setError("Contact ID is required");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      params.set("contact_id", contactId);
      const res = await fetch(`/api/razorpay/view-payouts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch payouts");
      setPayouts(data.payouts);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">View Payouts by Customer ID</h2>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          className="flex-1 border px-3 py-2 rounded"
          placeholder="Enter Customer ID (contact_id)"
          value={contactId}
          onChange={e => setContactId(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch"}
        </button>
      </form>
      {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
      {payouts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">Payout ID</th>
                <th className="px-2 py-1 border">Amount</th>
                <th className="px-2 py-1 border">Status</th>
                <th className="px-2 py-1 border">Mode</th>
                <th className="px-2 py-1 border">Created At</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="border px-2 py-1 font-mono">{p.id}</td>
                  <td className="border px-2 py-1">₹{(p.amount / 100).toFixed(2)}</td>
                  <td className="border px-2 py-1">{p.status}</td>
                  <td className="border px-2 py-1">{p.mode}</td>
                  <td className="border px-2 py-1">{new Date(p.created_at * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {payouts.length === 0 && !loading && !error && (
        <div className="text-gray-500 text-center">No payouts found for this customer.</div>
      )}
    </div>
  );
}
