import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MissionCard from "@/components/MissionCard";
import CreateMissionDialog from "@/components/CreateMissionDialog";
import { toast } from "sonner";

const CATEGORIES = [
  "Tous",
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

const Missions = () => {
  const { userRole, user } = useAuth();
  const [missions, setMissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();

    const channel = supabase
      .channel("missions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "missions",
        },
        () => {
          loadMissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMissions = async () => {
    try {
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error("Error loading missions:", error);
      toast.error("Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  };

  const filteredMissions = missions.filter((mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tous" || mission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <SEO
        title="Missions - Trouvez des opportunités professionnelles"
        description="Parcourez des missions adaptées à vos compétences. Développement web, design, photographie, marketing et plus. Postulez et commencez à gagner de l'expérience."
        keywords="missions étudiants, jobs étudiants, petits boulots, freelance étudiant, opportunités professionnelles"
        url="https://skillmatch.fr/missions"
      />
      
      <div className="min-h-screen">
        <Header />

      <main className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2">
                Missions disponibles
              </h1>
              <p className="text-muted-foreground">
                Trouvez votre prochaine opportunité
              </p>
            </div>
            {user && userRole === "client" && <CreateMissionDialog />}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher une mission..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Missions Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredMissions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucune mission trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMissions.map((mission, index) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  delay={index * 0.1}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  </>
);
};

export default Missions;
