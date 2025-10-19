import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET as string);
const URL = process.env.URL as string;

export const Checkout = async (priceId: string, qty: number): Promise<string> => {
  const session = await stripe.checkout.sessions.create({
    success_url: URL,
    cancel_url: URL,
    line_items: [
      {
        price: priceId,
        quantity: qty,
      },
    ],
    mode: 'payment',
  });

  return session.url as string;
};
