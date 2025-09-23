// Utility functions for reading/writing orders.json
import { promises as fs } from 'fs';
import path from 'path';

const ORDERS_FILE = path.resolve(process.cwd(), 'orders.json');

export async function readOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export async function writeOrder(order: any) {
  const orders = await readOrders();
  orders.push(order);
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

export async function updateOrder(orderId: string, update: any) {
  const orders = await readOrders();
  const idx = orders.findIndex((o: any) => o.razorpayOrderId === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...update };
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return orders[idx];
  }
  return null;
}

export async function getOrderByOrderId(orderId: string) {
  const orders = await readOrders();
  return orders.find((o: any) => o.razorpayOrderId === orderId);
}
