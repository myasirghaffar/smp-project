import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star, Clock, MessageCircle, Calendar, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReviewSection from "@/components/ReviewSection";
import { motion } from "framer-motion";
import BookingDialog from "@/components/BookingDialog";

const PublicStudentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;

      const { data: studentData, error: studentError } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", id)
        .single();

      if (studentError) throw studentError;

      setProfile(profileData);
      setStudentProfile(studentData);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour envoyer un message");
      navigate("/auth");
      return;
    }
    navigate("/messages", { state: { recipientId: id } });
  };

  if (loading) {
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

  if (!profile || !studentProfile) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-12">
          <div className="container text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Profil non trouvé</h2>
            <Button onClick={() => navigate("/explorer")}>
              Retour à l'Explorer
            </Button>
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
        <div className="container max-w-6xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            ← Retour
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar - Profil principal */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Avatar className="h-32 w-32 mx-auto ring-4 ring-primary/10">
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                        {profile.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h1 className="text-2xl font-display font-bold">
                        {profile.full_name || "Utilisateur"}
                      </h1>
                      {studentProfile.categories && studentProfile.categories.length > 0 && (
                        <p className="text-muted-foreground">
                          {studentProfile.categories[0]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Star className="h-5 w-5 fill-secondary text-secondary" />
                      <span className="text-xl font-bold">
                        {profile.average_rating?.toFixed(1) || "0.0"}
                      </span>
                    </div>

                    <div className="space-y-3 text-left pt-4 border-t">
                      {profile.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {studentProfile.availability_status && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="capitalize">{studentProfile.availability_status}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                    </div>

                    {studentProfile.hourly_rate && (
                      <div className="pt-4 border-t">
                        <div className="text-3xl font-display font-bold text-primary">
                          {studentProfile.hourly_rate}€
                        </div>
                        <div className="text-sm text-muted-foreground">par heure</div>
                      </div>
                    )}

                    <div className="space-y-3 pt-4">
                      <Button 
                        onClick={handleSendMessage}
                        className="w-full bg-gradient-primary hover:opacity-90"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Envoyer un message
                      </Button>
                      <BookingDialog
                        studentId={id!}
                        studentName={profile.full_name || "cet étudiant"}
                        hourlyRate={studentProfile.hourly_rate}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contenu principal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* À propos */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">À propos</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.bio ? (
                    <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Ce profil n'a pas encore de présentation.</p>
                  )}
                </CardContent>
              </Card>

              {/* Compétences */}
              {studentProfile.skills && studentProfile.skills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Compétences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Catégories */}
              {studentProfile.categories && studentProfile.categories.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Domaines d'expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studentProfile.categories.map((category: string, index: number) => (
                        <Badge key={index} className="bg-gradient-primary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Portfolio */}
              {studentProfile.portfolio_images && studentProfile.portfolio_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {studentProfile.portfolio_images.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Avis */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Avis clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewSection
                    userId={id || ""}
                    averageRating={profile.average_rating || 0}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicStudentProfile;
