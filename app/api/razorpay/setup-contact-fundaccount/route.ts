import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), 'contacts-fundaccounts.json');

async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { contacts: [], fundAccounts: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function createRazorpayContact({ name, email, contact }: { name: string, email?: string, contact: string }) {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay credentials not set');
  const res = await fetch('https://api.razorpay.com/v1/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64'),
    },
    body: JSON.stringify({
      name,
      email,
      contact,
      type: 'customer',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || 'Failed to create contact');
  return data;
}

async function createRazorpayFundAccount({ contact_id, bank_account_number, ifsc, account_holder_name }: { contact_id: string, bank_account_number: string, ifsc: string, account_holder_name: string }) {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('Razorpay credentials not set');
  const res = await fetch('https://api.razorpay.com/v1/fund_accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64'),
    },
    body: JSON.stringify({
      contact_id,
      account_type: 'bank_account',
      bank_account: {
        name: account_holder_name,
        ifsc,
        account_number: bank_account_number,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.description || 'Failed to create fund account');
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, contact, bank_account_number, ifsc, account_holder_name } = await request.json();
    if (!name || !contact || !bank_account_number || !ifsc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create contact in Razorpay
    const contactObj = await createRazorpayContact({ name, email, contact });

    // 2. Create fund account in Razorpay
    const fundAccountObj = await createRazorpayFundAccount({
      contact_id: contactObj.id,
      bank_account_number,
      ifsc,
      account_holder_name: account_holder_name || name,
    });

    // 3. Store locally for reference
    const data = await readData();
    data.contacts.push(contactObj);
    data.fundAccounts.push(fundAccountObj);
    await writeData(data);

    return NextResponse.json({
      message: 'Contact and fund account created',
      contact: contactObj,
      fundAccount: fundAccountObj,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create contact/fund account' }, { status: 500 });
  }
}
