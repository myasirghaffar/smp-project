import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface BookingDialogProps {
  studentId: string;
  studentName: string;
  hourlyRate?: number;
}

const BookingDialog = ({ studentId, studentName, hourlyRate }: BookingDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [hours, setHours] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const totalAmount = (hourlyRate || 0) * hours;

  const handleBooking = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour réserver");
      return;
    }

    if (!date) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    if (!description.trim()) {
      toast.error("Veuillez décrire votre projet");
      return;
    }

    setLoading(true);

    try {
      // Create a mission for this booking with status "open" - student must accept first
      const { data: mission, error: missionError } = await supabase
        .from("missions")
        .insert({
          client_id: user.id,
          title: `Réservation avec ${studentName}`,
          description: description,
          category: "Autre",
          budget: totalAmount,
          deadline: date.toISOString(),
          status: "open",
        })
        .select()
        .single();

      if (missionError) throw missionError;

      // Create a pending application - student must accept the booking
      const { error: applicationError } = await supabase
        .from("applications")
        .insert({
          mission_id: mission.id,
          student_id: studentId,
          status: "pending",
          cover_letter: `Demande de réservation directe du client pour ${hours}h le ${format(date, "dd/MM/yyyy", { locale: fr })}`,
        });

      if (applicationError) throw applicationError;

      toast.success("Demande de réservation envoyée ! L'étudiant doit d'abord l'accepter.");
      setOpen(false);
      
      // Navigate to dashboard to see pending booking
      window.location.href = `/dashboard`;
      
      // Reset form
      setDate(undefined);
      setHours(1);
      setDescription("");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Erreur lors de la création de la réservation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
          <CreditCard className="mr-2 h-4 w-4" />
          Réserver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Réserver {studentName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date souhaitée</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Nombre d'heures estimées</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              value={hours}
              onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description du projet</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre projet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {hourlyRate && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Tarif horaire</span>
                <span className="font-medium">{hourlyRate}€/h</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Nombre d'heures</span>
                <span className="font-medium">{hours}h</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total estimé</span>
                  <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {totalAmount}€
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleBooking}
            disabled={loading || !date || !description.trim()}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {loading ? "Création en cours..." : "Confirmer la réservation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
