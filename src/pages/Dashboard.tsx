import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, Briefcase, Star, TrendingUp, User, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CreateMissionDialog from "@/components/CreateMissionDialog";
import { format } from "date-fns";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState({
    totalMissions: 0,
    activeMissions: 0,
    totalEarnings: 0,
    averageRating: 0,
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, userRole]);

  const loadStats = async () => {
    try {
      if (userRole === "student") {
        // Charger toutes les candidatures de l'étudiant
        const { data: appsData } = await supabase
          .from("applications")
          .select("*, missions(*)")
          .eq("student_id", user?.id)
          .order("created_at", { ascending: false });

        setApplications(appsData || []);

        const acceptedApps = appsData?.filter(app => app.status === "accepted") || [];
        const activeMissions =
          acceptedApps.filter(
            (app) =>
              app.missions?.status === "in_progress" ||
              app.missions?.status === "in_discussion"
          ) || [];

        const completedMissions =
          acceptedApps.filter((app) => app.missions?.status === "completed") || [];

        const totalEarnings = completedMissions.reduce(
          (sum, app) => sum + (app.missions?.budget || 0),
          0
        );

        const { data: profile } = await supabase
          .from("profiles")
          .select("average_rating")
          .eq("id", user?.id)
          .single();

        setStats({
          totalMissions: appsData?.length || 0,
          activeMissions: activeMissions.length,
          totalEarnings,
          averageRating: profile?.average_rating || 0,
        });
      } else if (userRole === "client") {
        // Charger toutes les missions du client
        const { data: missionsData } = await supabase
          .from("missions")
          .select("*")
          .eq("client_id", user?.id)
          .order("created_at", { ascending: false });

        // Charger les candidatures pour chaque mission
        const missionsWithApps = await Promise.all(
          (missionsData || []).map(async (mission) => {
            const { data: apps, count } = await supabase
              .from("applications")
              .select("*", { count: "exact" })
              .eq("mission_id", mission.id)
              .eq("status", "pending");

            return {
              ...mission,
              pendingApplicationsCount: count || 0
            };
          })
        );

        setMissions(missionsWithApps);

        const activeMissions =
          missionsData?.filter(
            (m) => m.status === "in_progress" || m.status === "in_discussion"
          ) || [];

        const totalSpent = missionsData?.reduce((sum, m) => sum + m.budget, 0) || 0;

        setStats({
          totalMissions: missionsData?.length || 0,
          activeMissions: activeMissions.length,
          totalEarnings: totalSpent,
          averageRating: 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2">
                Tableau de bord
              </h1>
              <p className="text-muted-foreground">
                Vue d'ensemble de votre activité
              </p>
            </div>
            <div className="flex gap-3">
              {userRole === "client" && <CreateMissionDialog />}
              <Button onClick={() => navigate("/profile")} className="bg-gradient-primary hover:opacity-90">
                <User className="h-5 w-5 mr-2" />
                Mon profil
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {userRole === "student" ? "Candidatures" : "Missions totales"}
                    </CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalMissions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Missions actives
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeMissions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {userRole === "student" ? "Gains totaux" : "Dépenses totales"}
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalEarnings.toFixed(2)} €
                    </div>
                  </CardContent>
                </Card>

                {userRole === "student" && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Note moyenne
                      </CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.averageRating > 0
                          ? stats.averageRating.toFixed(1)
                          : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Student Applications View */}
              {userRole === "student" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mes candidatures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applications.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          Vous n'avez pas encore postulé à des missions
                        </p>
                        <Button onClick={() => navigate("/missions")}>
                          Voir les missions disponibles
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.map((app) => (
                          <Card key={app.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-2">
                                    {app.missions?.title}
                                  </h3>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="secondary">
                                      {app.missions?.category}
                                    </Badge>
                                    <Badge 
                                      variant={
                                        app.status === "accepted" ? "default" :
                                        app.status === "rejected" ? "destructive" :
                                        "outline"
                                      }
                                    >
                                      {app.status === "pending" ? (
                                        <><Clock className="h-3 w-3 mr-1" /> En attente</>
                                      ) : app.status === "accepted" ? (
                                        <><CheckCircle className="h-3 w-3 mr-1" /> Acceptée</>
                                      ) : (
                                        <><XCircle className="h-3 w-3 mr-1" /> Refusée</>
                                      )}
                                    </Badge>
                                  </div>
                                  {app.cover_letter && (
                                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                      {app.cover_letter}
                                    </p>
                                  )}
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Budget: {app.missions?.budget} €
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {app.status === "pending" ? "Reçu" : "Postulé"} le {format(new Date(app.created_at), "dd/MM/yyyy")}
                                  </p>
                                   
                                  {/* Accept/Reject buttons for pending bookings */}
                                  {app.status === "pending" && app.missions?.status === "open" && (
                                    <div className="flex gap-2 mt-3">
                                      <Button 
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            const { error: appError } = await supabase
                                              .from("applications")
                                              .update({ status: "accepted" })
                                              .eq("id", app.id);
                                            
                                            if (appError) throw appError;
                                            
                                            const { error: missionError } = await supabase
                                              .from("missions")
                                              .update({ status: "in_discussion" })
                                              .eq("id", app.mission_id);
                                            
                                            if (missionError) throw missionError;
                                            
                                            const { error: convError } = await supabase
                                              .from("conversations")
                                              .insert({
                                                mission_id: app.mission_id,
                                                student_id: user?.id,
                                                client_id: app.missions?.client_id,
                                              });
                                            
                                            if (convError && !convError.message.includes("duplicate")) throw convError;
                                            
                                            toast.success("Réservation acceptée ! Le client peut maintenant payer.");
                                            loadStats();
                                          } catch (error) {
                                            console.error("Error accepting:", error);
                                            toast.error("Erreur lors de l'acceptation");
                                          }
                                        }}
                                        className="bg-gradient-primary"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Accepter
                                      </Button>
                                      <Button 
                                        size="sm"
                                        variant="destructive"
                                        onClick={async () => {
                                          try {
                                            const { error } = await supabase
                                              .from("applications")
                                              .update({ status: "rejected" })
                                              .eq("id", app.id);
                                            
                                            if (error) throw error;
                                            
                                            toast.success("Réservation refusée");
                                            loadStats();
                                          } catch (error) {
                                            console.error("Error rejecting:", error);
                                            toast.error("Erreur lors du refus");
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Refuser
                                      </Button>
                                    </div>
                                  )}

                                  {/* Delete button for rejected or completed applications */}
                                  {(app.status === "rejected" || app.missions?.status === "completed") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-3 text-destructive hover:text-destructive"
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from("applications")
                                            .delete()
                                            .eq("id", app.id);
                                          
                                          if (error) throw error;
                                          
                                          toast.success("Candidature supprimée");
                                          loadStats();
                                        } catch (error) {
                                          console.error("Error deleting:", error);
                                          toast.error("Erreur lors de la suppression");
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Supprimer
                                    </Button>
                                  )}
                                </div>
                                <Button 
                                  onClick={() => navigate(`/missions/${app.mission_id}`)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Voir la mission
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Client Missions View */}
              {userRole === "client" && (
                <>
                  {/* Missions en attente de paiement */}
                  {missions.filter(m => m.status === "in_discussion" && m.payment_status !== "paid").length > 0 && (
                    <Card className="border-2 border-primary mb-6">
                      <CardHeader className="bg-primary/5">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Action requise : Paiement en attente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground mb-4">
                          Un étudiant a accepté votre mission. Procédez au paiement pour démarrer le projet.
                        </p>
                        <div className="space-y-4">
                          {missions
                            .filter(m => m.status === "in_discussion" && m.payment_status !== "paid")
                            .map((mission) => (
                              <Card key={mission.id} className="bg-gradient-to-r from-primary/10 to-accent/10">
                                <CardContent className="pt-6">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-lg mb-2">
                                        {mission.title}
                                      </h3>
                                      <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge variant="secondary">{mission.category}</Badge>
                                        <Badge className="bg-gradient-primary">En discussion</Badge>
                                      </div>
                                      <p className="text-xl font-bold text-primary">
                                        {mission.budget} €
                                      </p>
                                    </div>
                                    <Button 
                                      onClick={() => navigate("/my-missions")}
                                      size="lg"
                                      className="bg-gradient-primary hover:opacity-90"
                                    >
                                      <DollarSign className="h-5 w-5 mr-2" />
                                      Payer maintenant
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Liste de toutes les missions */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Mes missions</CardTitle>
                        <Button 
                          onClick={() => navigate("/my-missions")}
                          variant="outline"
                          size="sm"
                        >
                          Voir tout
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {missions.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">
                            Vous n'avez pas encore créé de mission
                          </p>
                          <CreateMissionDialog />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {missions.slice(0, 5).map((mission) => (
                            <Card key={mission.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">
                                      {mission.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <Badge variant="secondary">{mission.category}</Badge>
                                      <Badge>{mission.status}</Badge>
                                      {mission.pendingApplicationsCount > 0 && (
                                        <Badge variant="default" className="bg-gradient-primary">
                                          {mission.pendingApplicationsCount} candidature{mission.pendingApplicationsCount > 1 ? 's' : ''} en attente
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Budget: {mission.budget} €
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Créée le {format(new Date(mission.created_at), "dd/MM/yyyy")}
                                    </p>
                                  </div>
                                  <Button 
                                    onClick={() => navigate(`/missions/${mission.id}`)}
                                    variant={mission.pendingApplicationsCount > 0 ? "default" : "outline"}
                                    size="sm"
                                  >
                                    {mission.pendingApplicationsCount > 0 ? "Voir les candidatures" : "Voir la mission"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
