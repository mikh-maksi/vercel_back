import type { VercelRequest, VercelResponse } from '@vercel/node';
import Busboy from 'busboy';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const params: Record<string, string> = {};

  if (req.method === 'POST') {
    await new Promise((resolve) => {
      const busboy = Busboy({ headers: req.headers });
      busboy.on('field', (name, val) => {
        params[name] = val;
      });
      busboy.on('finish', resolve);
      req.pipe(busboy);
    });
  } else {
    Object.assign(params, req.query);
  }

  const { transactionStatus, orderReference, amount, currency, reasonCode } =
    params;
  const query = new URLSearchParams();

  if (transactionStatus === 'Approved') {
    query.append('status', 'success');
  } else {
    query.append('status', 'error');
    query.append('reason', String(reasonCode || 'declined'));
  }

  if (orderReference) query.append('order', orderReference);
  if (amount) query.append('amount', amount);
  if (currency) query.append('currency', currency);

  const redirectUrl = `/success?${query.toString()}`;
  console.log(`🚀 [Redirect] User sent to: ${redirectUrl}`);

  return res.redirect(303, redirectUrl);
}
