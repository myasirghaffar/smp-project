import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AvatarUpload from "@/components/AvatarUpload";
import PortfolioUpload from "@/components/PortfolioUpload";
import ReviewSection from "@/components/ReviewSection";
import { AiProfileCoach } from "@/components/AiProfileCoach";
import { z } from "zod";

const profileSchema = z.object({
  bio: z.string().max(1000, "La bio ne peut pas dépasser 1000 caractères").optional(),
  phone: z.string().max(20, "Le téléphone ne peut pas dépasser 20 caractères").optional(),
  location: z.string().max(200, "La localisation ne peut pas dépasser 200 caractères").optional(),
  hourlyRate: z.string().refine((val) => !val || !isNaN(parseFloat(val)), "Le tarif doit être un nombre valide").optional(),
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

const StudentProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      loadProfile();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;

      const { data: studentData, error: studentError } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (studentError) throw studentError;

      setProfile(profileData);
      setBio(profileData.bio || "");
      setPhone(profileData.phone || "");
      setLocation(profileData.location || "");
      setAvatarUrl(profileData.avatar_url || "");
      
      setSkills(studentData.skills || []);
      setHourlyRate(studentData.hourly_rate?.toString() || "");
      setCategories(studentData.categories || []);
      setPortfolioImages(studentData.portfolio_images || []);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const toggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour enregistrer");
      return;
    }

    // Validation des données
    const validation = profileSchema.safeParse({
      bio,
      phone,
      location,
      hourlyRate,
    });

    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(", ");
      toast.error(errors);
      return;
    }

    setSaving(true);
    try {
      console.log("Sauvegarde du profil...", { bio, phone, location, skills, categories, hourlyRate });

      // Mise à jour du profil principal
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          location: location.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Erreur profiles:", profileError);
        throw new Error(`Erreur profil: ${profileError.message}`);
      }

      // Mise à jour du profil étudiant
      const { error: studentError } = await supabase
        .from("student_profiles")
        .update({
          skills,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          categories,
          portfolio_images: portfolioImages,
        })
        .eq("user_id", user.id);

      if (studentError) {
        console.error("Erreur student_profiles:", studentError);
        throw new Error(`Erreur profil étudiant: ${studentError.message}`);
      }

      console.log("Profil sauvegardé avec succès!");
      toast.success("✅ Profil mis à jour avec succès !");
      
      // Recharger le profil pour afficher les changements
      await loadProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde du profil");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-12">
          <div className="container flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="py-12">
        <div className="container max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            ← Retour
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-display">Mon profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                onUploadComplete={setAvatarUrl}
              />

              <div className="space-y-2">
                <Label htmlFor="bio">Présentez-vous & Expérience</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  placeholder="Exemple: Je suis étudiant en comptabilité avec 2 ans d'expérience en stage. J'ai travaillé sur des déclarations fiscales et la gestion de la comptabilité générale..."
                />
                <p className="text-sm text-muted-foreground">
                  Décrivez votre parcours, vos expériences et vos compétences principales
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Paris, France"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Tarif horaire (€)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="25"
                />
              </div>

              <div className="space-y-4">
                <Label>Compétences</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Ex: React, Design UI..."
                  />
                  <Button type="button" onClick={addSkill} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Catégories</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (currentSkill.trim() && !categories.includes(currentSkill.trim())) {
                          setCategories([...categories, currentSkill.trim()]);
                          setCurrentSkill("");
                        }
                      }
                    }}
                    placeholder="Ajouter une catégorie personnalisée..."
                  />
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (currentSkill.trim() && !categories.includes(currentSkill.trim())) {
                        setCategories([...categories, currentSkill.trim()]);
                        setCurrentSkill("");
                      }
                    }}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={categories.includes(cat) ? "default" : "outline"}
                      onClick={() => toggleCategory(cat)}
                      className="justify-start"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {categories.filter(c => !CATEGORIES.includes(c)).map((cat, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {cat}
                      <button
                        type="button"
                        onClick={() => setCategories(categories.filter((c) => c !== cat))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <PortfolioUpload
                currentImages={portfolioImages}
                onImagesChange={setPortfolioImages}
              />

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </CardContent>
          </Card>

          {/* AI Profile Coach Section */}
          <div className="mt-6">
            <AiProfileCoach />
          </div>

          {profile && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-2xl font-display">Mes avis</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewSection
                  userId={user?.id || ""}
                  averageRating={profile.average_rating || 0}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentProfile;
