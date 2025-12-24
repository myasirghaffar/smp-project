import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiMissionEnhancerProps {
  title: string;
  description: string;
  category: string;
  budget: number;
  isRemote: boolean;
  location?: string;
  onEnhanced: (enhancedDescription: string) => void;
}

export const AiMissionEnhancer = ({
  title,
  description,
  category,
  budget,
  isRemote,
  location,
  onEnhanced
}: AiMissionEnhancerProps) => {
  const [loading, setLoading] = useState(false);

  const handleEnhance = async () => {
    if (!title || !category) {
      toast.error("Veuillez remplir au moins le titre et la catégorie");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-enhance-mission', {
        body: { title, description, category, budget, isRemote, location }
      });

      if (error) throw error;

      if (data.enhancedDescription) {
        onEnhanced(data.enhancedDescription);
        toast.success(description ? "Description améliorée !" : "Description générée !");
      }
    } catch (error: any) {
      console.error('Error enhancing mission:', error);
      toast.error(error.message || "Erreur lors de l'amélioration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleEnhance}
      disabled={loading}
      className="w-full gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {description ? "Amélioration..." : "Génération..."}
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {description ? "Améliorer avec l'IA" : "Générer avec l'IA"}
        </>
      )}
    </Button>
  );
};