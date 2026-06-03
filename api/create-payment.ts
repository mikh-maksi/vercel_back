import { VercelRequest, VercelResponse } from '@vercel/node';

import { buildWayForPayData } from '../lib/wayforpay';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://hellskitchenukraine.org',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Accept',
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { amount, currency = 'UAH' } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const data = buildWayForPayData({
      orderReference: `donate_${Date.now()}`,
      amount: Number(amount),
      currency,
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Payment init failed' });
  }
}
