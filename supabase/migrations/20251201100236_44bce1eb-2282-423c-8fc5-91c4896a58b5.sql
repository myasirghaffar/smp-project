-- Enable realtime for missions table
ALTER TABLE public.missions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- Enable realtime for applications table
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;