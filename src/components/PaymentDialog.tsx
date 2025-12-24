import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Euro, AlertCircle, Shield, Lock, ExternalLink } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const paymentSchema = z.object({
  amount: z.number().min(0.5, 'Montant minimum: 0.50€').max(9999.99, 'Montant maximum: 9,999.99€'),
  missionId: z.string().uuid('ID de mission invalide'),
});

interface PaymentDialogProps {
  missionId: string;
  missionTitle: string;
  suggestedAmount?: number;
  children?: React.ReactNode;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  missionId,
  missionTitle,
  suggestedAmount = 0,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(suggestedAmount);
  const [errors, setErrors] = useState<string[]>([]);
  const { loading, createPaymentIntent } = usePayment();

  useEffect(() => {
    if (suggestedAmount > 0) {
      setAmount(suggestedAmount);
    }
  }, [suggestedAmount]);

  const validateAndSubmit = async () => {
    try {
      setErrors([]);

      // Validate inputs
      const validation = paymentSchema.safeParse({
        amount,
        missionId,
      });

      if (!validation.success) {
        const errorMessages = validation.error.errors.map((err) => err.message);
        setErrors(errorMessages);
        return;
      }

      // Convert to cents
      const amountInCents = Math.round(amount * 100);

      // Create payment intent via edge function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          missionId,
          amount: amountInCents,
          currency: 'eur',
          metadata: {
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;
      if (!data?.url) {
        console.error('No URL returned from payment intent:', data);
        throw new Error('Erreur lors de la création du paiement');
      }

      // Log the URL for debugging
      console.log('Payment URL received:', data.url);

      // Redirect to Stripe Checkout in same tab for better compatibility
      toast.success('Redirection vers le paiement sécurisé...');
      window.location.href = data.url;
      setOpen(false);
    } catch (error) {
      console.error('Payment creation error:', error);
      setErrors([error instanceof Error ? error.message : 'Une erreur est survenue']);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full">
            <Euro className="mr-2 h-4 w-4" />
            Procéder au paiement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Paiement sécurisé
          </DialogTitle>
          <DialogDescription>
            Paiement pour: <span className="font-semibold">{missionTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Security notice */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Vos fonds seront sécurisés jusqu'à la complétion de la mission. Le paiement utilise Stripe pour une sécurité maximale.
            </AlertDescription>
          </Alert>

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-display">
              Montant (€)
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0.5"
                max="9999.99"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setAmount(value);
                  }
                }}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum: 0.50€ • Maximum: 9,999.99€
            </p>
          </div>

          {/* Error messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Security features */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <h4 className="font-display text-sm font-semibold">Protection incluse</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary" />
                Fonds sécurisés en escrow
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-primary" />
                Paiement crypté via Stripe
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary" />
                Libération après validation de la mission
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Annuler
          </Button>
          <Button onClick={validateAndSubmit} disabled={loading || amount < 0.5} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Payer avec Stripe
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
