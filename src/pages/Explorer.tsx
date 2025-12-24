import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import StudentCard from "@/components/StudentCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Explorer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("student_profiles")
        .select(`
          *,
          profiles(id, full_name, avatar_url, location, average_rating)
        `)
        .eq("availability_status", "available");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Erreur lors du chargement des étudiants");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const profile = student.profiles;
    const matchesSearch =
      profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.skills?.some((skill: string) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesSkills =
      selectedSkills.length === 0 ||
      selectedSkills.some((skill) => student.skills?.includes(skill));
    
    const matchesRate =
      (!minRate || student.hourly_rate >= parseFloat(minRate)) &&
      (!maxRate || student.hourly_rate <= parseFloat(maxRate));
    
    const matchesLocation =
      !location ||
      profile?.location?.toLowerCase().includes(location.toLowerCase());

    return matchesSearch && matchesSkills && matchesRate && matchesLocation;
  });

  return (
    <>
      <SEO
        title="Explorer - Trouvez le talent étudiant qu'il vous faut"
        description="Découvrez des étudiants talentueux en développement web, design graphique, photographie, marketing digital, construction et plus. Filtrez par compétences, tarifs et localisation."
        keywords="trouver étudiant freelance, talents étudiants, développeur étudiant, designer étudiant, photographe étudiant, freelance pas cher"
        url="https://skillmatch.fr/explorer"
      />
      
      <div className="min-h-screen">
        <Header />
      
      <main className="py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Explorez les{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                talents étudiants
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Découvrez des milliers d'étudiants qualifiés prêts à transformer vos idées en réalité
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par compétence, nom ou catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Prix min (€/h)"
                type="number"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value)}
              />
              <Input
                placeholder="Prix max (€/h)"
                type="number"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
              />
              <Input
                placeholder="Localisation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun étudiant trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student, index) => (
                <StudentCard
                  key={student.id}
                  id={student.profiles?.id}
                  name={student.profiles?.full_name || "Utilisateur"}
                  avatar={student.profiles?.avatar_url || ""}
                  title={student.categories?.[0] || "Étudiant"}
                  skills={student.skills || []}
                  rating={student.profiles?.average_rating || 0}
                  hourlyRate={student.hourly_rate || 0}
                  location={student.profiles?.location || "Non spécifié"}
                  availability={student.availability_status}
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

export default Explorer;
