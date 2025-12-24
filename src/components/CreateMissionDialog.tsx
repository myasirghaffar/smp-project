import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { AiMissionEnhancer } from "@/components/AiMissionEnhancer";

const missionSchema = z.object({
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  description: z.string().trim().min(10, "La description doit contenir au moins 10 caractères").max(5000, "La description ne peut pas dépasser 5000 caractères"),
  category: z.string().trim().min(2, "La catégorie doit contenir au moins 2 caractères").max(100, "La catégorie ne peut pas dépasser 100 caractères"),
  budget: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Le budget doit être un nombre supérieur à 0").refine((val) => parseFloat(val) <= 1000000, "Le budget ne peut pas dépasser 1,000,000€"),
  location: z.string().max(200, "La localisation ne peut pas dépasser 200 caractères").optional(),
});

const CATEGORIES = [
  "Développement Web",
  "Design Graphique",
  "Marketing Digital",
  "Photographie",
  "Construction",
  "Coiffure & Esthétique",
  "Comptabilité",
  "Rédaction",
  "Autre"
];

const CreateMissionDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    category: "",
    location: "",
    is_remote: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté pour créer une mission");
      return;
    }

    // Validation des données
    const validation = missionSchema.safeParse({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      budget: formData.budget,
      location: formData.location,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(", ");
      toast.error(errors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("missions").insert({
        client_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: parseFloat(formData.budget),
        deadline: formData.deadline || null,
        category: formData.category.trim(),
        location: formData.is_remote ? null : (formData.location?.trim() || null),
        is_remote: formData.is_remote
      });

      if (error) throw error;

      toast.success("✅ Mission créée avec succès !");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        budget: "",
        deadline: "",
        category: "",
        location: "",
        is_remote: false
      });
    } catch (error: any) {
      console.error("Error creating mission:", error);
      toast.error(error.message || "Erreur lors de la création de la mission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="h-5 w-5 mr-2" />
          Poster une mission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Nouvelle Mission</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la mission *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Développer un site web e-commerce"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              placeholder="Ex: Développement Web, Plomberie, Électricité..."
              list="categories-list"
            />
            <datalist id="categories-list">
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <p className="text-sm text-muted-foreground">
              Choisissez une catégorie suggérée ou entrez la vôtre
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              placeholder="Décrivez en détail votre projet..."
            />
            <AiMissionEnhancer
              title={formData.title}
              description={formData.description}
              category={formData.category}
              budget={parseFloat(formData.budget) || 0}
              isRemote={formData.is_remote}
              location={formData.location}
              onEnhanced={(enhanced) => setFormData({ ...formData, description: enhanced })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (€) *</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                required
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Date limite (optionnel)</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="remote">Mission en télétravail</Label>
              <p className="text-sm text-muted-foreground">
                Peut être réalisée à distance
              </p>
            </div>
            <Switch
              id="remote"
              checked={formData.is_remote}
              onCheckedChange={(checked) => setFormData({ ...formData, is_remote: checked })}
            />
          </div>

          {!formData.is_remote && (
            <div className="space-y-2">
              <Label htmlFor="location">Lieu *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required={!formData.is_remote}
                placeholder="Paris, France"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {loading ? "Création..." : "Créer la mission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMissionDialog;