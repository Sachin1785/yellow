"use client";
import { useState } from "react";

export default function SetupContactFundAccountPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [bank_account_number, setBankAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [account_holder_name, setAccountHolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const res = await fetch("/api/razorpay/setup-contact-fundaccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          contact,
          bank_account_number,
          ifsc,
          account_holder_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create contact/fund account");
      setMessage(data.message || "Contact and fund account created");
      setResult(data);
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Create Contact & Fund Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input type="email" className="w-full border px-3 py-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">Phone</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={contact} onChange={e => setContact(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Bank Account Number</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={bank_account_number} onChange={e => setBankAccountNumber(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">IFSC Code</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={ifsc} onChange={e => setIfsc(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Account Holder Name (optional)</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={account_holder_name} onChange={e => setAccountHolderName(e.target.value)} />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50" disabled={loading}>
          {loading ? "Processing..." : "Create Contact & Fund Account"}
        </button>
      </form>
      {message && <div className="mt-4 text-center font-semibold">{message}</div>}
      {result && (
        <div className="mt-4 text-xs bg-gray-100 p-2 rounded break-all">
          <div><b>Contact ID:</b> {result.contact?.id}</div>
          <div><b>Fund Account ID:</b> {result.fundAccount?.id}</div>
        </div>
      )}
    </div>
  );
}
