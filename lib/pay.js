import { api } from './api';
import { loadScript } from './img';
// Razorpay live checkout, ya dev mein mock payment
export async function payFlow(p) {
  if (p.mock) { await api('/payments/mock-pay', { method: 'POST', body: { paymentId: p.paymentId } }); return; }
  await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  await new Promise((res, rej) => {
    const z = new window.Razorpay({
      key: p.keyId, order_id: p.providerOrderId, amount: p.amount, currency: 'INR', name: 'Footwear SOS',
      handler: async (x) => { try { await api('/payments/verify', { method: 'POST', body: { paymentId: p.paymentId, ...x } }); res(); } catch (e) { rej(e); } },
      modal: { ondismiss: () => rej(new Error('Payment cancel ho gaya')) },
    });
    z.open();
  });
}
