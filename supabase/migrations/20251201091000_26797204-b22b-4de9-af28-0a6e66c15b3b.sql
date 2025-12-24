-- Add payments table for transaction tracking
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  escrow_status TEXT DEFAULT 'held',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
  CONSTRAINT valid_escrow_status CHECK (escrow_status IN ('held', 'released', 'refunded'))
);

-- Add payment tracking to missions
ALTER TABLE public.missions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded'));

-- RLS policies for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = student_id);

CREATE POLICY "Only system can create payments"
ON public.payments FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only system can update payments"
ON public.payments FOR UPDATE
USING (false);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add student verification table for KYC
CREATE TABLE IF NOT EXISTS public.student_verification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id),
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  document_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'))
);

ALTER TABLE public.student_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own verification"
ON public.student_verification FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can update own verification"
ON public.student_verification FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Students can create own verification"
ON public.student_verification FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_mission_id ON public.payments(mission_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_missions_payment_status ON public.missions(payment_status);
CREATE INDEX IF NOT EXISTS idx_missions_client_id ON public.missions(client_id);