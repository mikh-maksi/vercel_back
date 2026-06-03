import { VercelRequest, VercelResponse } from '@vercel/node';
import Busboy from 'busboy';

import { createSignature } from '../lib/crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: Record<string, any> = {};

  try {
    await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });

      busboy.on('field', (name, val) => {
        if (name.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(name);
            data = { ...data, ...parsed };
          } catch (e) {
            data[name] = val;
          }
        } else {
          data[name] = val;
        }
      });

      busboy.on('finish', resolve);
      busboy.on('error', reject);
      req.pipe(busboy);
      setTimeout(resolve, 2000);
    });

    if (!data.orderReference) {
      console.warn('⚠️ Callback: No orderReference found');
      return res.status(200).json({ status: 'error', message: 'no_data' });
    }

    const responseTime = Math.floor(Date.now() / 1000);
    const responseSignature = createSignature(process.env.WAYFORPAY_SECRET!, [
      String(data.orderReference),
      'accept',
      String(responseTime),
    ]);

    if (data.transactionStatus === 'Approved') {
      console.log(
        `✅ [Payment Success]: ${data.orderReference} - ${data.amount} ${data.currency}`,
      );
    } else {
      console.log(
        `❌ [Payment ${data.transactionStatus}]: ${data.orderReference} (Reason: ${data.reason})`,
      );
    }

    return res.status(200).json({
      orderReference: data.orderReference,
      status: 'accept',
      time: responseTime,
      signature: responseSignature,
    });
  } catch (error) {
    console.error('❌ Critical Error in Callback:', error);
    return res.status(200).send('OK');
  }
}
