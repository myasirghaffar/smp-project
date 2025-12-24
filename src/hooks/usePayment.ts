import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);

  const initializeStripe = async () => {
    if (!stripe) {
      const stripeInstance = await stripePromise;
      setStripe(stripeInstance);
      return stripeInstance;
    }
    return stripe;
  };

  const createPaymentIntent = async (missionId: string, amount: number, currency = 'eur') => {
    setLoading(true);
    try {
      // Input validation
      if (!missionId || !missionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
        throw new Error('ID de mission invalide');
      }

      if (typeof amount !== 'number' || amount < 50 || amount > 999999) {
        throw new Error('Montant invalide (min: 0.50€, max: 9,999.99€)');
      }

      if (!['eur', 'usd', 'gbp'].includes(currency.toLowerCase())) {
        throw new Error('Devise non supportée');
      }

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          missionId,
          amount: Math.round(amount), // Ensure integer
          currency: currency.toLowerCase(),
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;
      if (!data?.clientSecret) throw new Error('Erreur lors de la création du paiement');

      setClientSecret(data.clientSecret);
      toast.success('Paiement initialisé avec succès');
      return data;
    } catch (error) {
      console.error('Payment intent creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du paiement');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (elements: StripeElements, returnUrl: string) => {
    setLoading(true);
    try {
      if (!stripe || !clientSecret) {
        throw new Error('Stripe non initialisé');
      }

      if (!returnUrl || !returnUrl.startsWith(window.location.origin)) {
        throw new Error('URL de retour invalide');
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        throw error;
      }

      toast.success('Paiement confirmé avec succès');
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la confirmation du paiement');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const releaseEscrow = async (paymentIntentId: string) => {
    setLoading(true);
    try {
      // Input validation
      if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
        throw new Error('ID de paiement invalide');
      }

      const { data, error } = await supabase.functions.invoke('release-escrow', {
        body: { paymentIntentId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Erreur lors de la libération des fonds');

      toast.success('Fonds libérés avec succès');
      return data;
    } catch (error) {
      console.error('Escrow release error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la libération des fonds');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    clientSecret,
    stripe,
    initializeStripe,
    createPaymentIntent,
    confirmPayment,
    releaseEscrow,
  };
};
