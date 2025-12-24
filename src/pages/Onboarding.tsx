import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowRight } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import PortfolioUpload from "@/components/PortfolioUpload";

const Onboarding = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Profile fields
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Student-specific fields
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  const role = searchParams.get("role") || userRole;

  // Memoize the portfolio change handler to prevent re-renders during upload
  const handlePortfolioChange = useCallback((images: string[]) => {
    setPortfolioImages(images);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const toggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter(c => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const availableCategories = [
    "Développement",
    "Design & Graphisme",
    "Photo & Vidéo",
    "Marketing",
    "Bâtiment & Travaux",
    "Coiffure & Beauté"
  ];

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bio,
          phone,
          location,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // If student, update student profile
      if (role === "student") {
        const { error: studentError } = await supabase
          .from("student_profiles")
          .update({
            skills,
            hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
            categories,
            portfolio_images: portfolioImages,
          })
          .eq("user_id", user.id);

        if (studentError) throw studentError;
      }

      toast.success("Profil configuré avec succès !");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la configuration du profil");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {role === "student" ? "Créez votre profil étudiant" : "Créez votre profil client"}
            </CardTitle>
            <CardDescription>
              {role === "student" 
                ? "Complétez votre profil pour que les clients puissent vous trouver"
                : "Complétez votre profil pour commencer à poster des missions"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  onUploadComplete={setAvatarUrl}
                />

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder={role === "student" 
                      ? "Présentez-vous et décrivez vos compétences..."
                      : "Parlez-nous de votre entreprise ou de vos besoins..."
                    }
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Paris, France"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {role === "student" && (
                  <Button
                    onClick={() => setStep(2)}
                    className="w-full"
                  >
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {role === "client" && (
                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Terminer
                  </Button>
                )}
              </motion.div>
            )}

            {step === 2 && role === "student" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Compétences</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ajouter une compétence"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill}>
                      Ajouter
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {skills.map((skill) => (
                        <div
                          key={skill}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="hover:text-primary/80"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Tarif horaire (€)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="25"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Catégories</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ajouter une catégorie personnalisée..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (skillInput.trim() && !categories.includes(skillInput.trim())) {
                            setCategories([...categories, skillInput.trim()]);
                            setSkillInput("");
                          }
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (skillInput.trim() && !categories.includes(skillInput.trim())) {
                          setCategories([...categories, skillInput.trim()]);
                          setSkillInput("");
                        }
                      }}
                    >
                      Ajouter
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableCategories.map((category) => (
                      <Button
                        key={category}
                        type="button"
                        variant={categories.includes(category) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  {categories.filter(c => !availableCategories.includes(c)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categories.filter(c => !availableCategories.includes(c)).map((cat) => (
                        <div
                          key={cat}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {cat}
                          <button
                            onClick={() => setCategories(categories.filter((c) => c !== cat))}
                            className="hover:text-primary/80"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <PortfolioUpload
                  key={`portfolio-${portfolioImages.length}`}
                  currentImages={portfolioImages}
                  onImagesChange={handlePortfolioChange}
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Terminer
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
