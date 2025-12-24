import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CreateMissionDialog from "@/components/CreateMissionDialog";
import { PaymentDialog } from "@/components/PaymentDialog";
import {
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  UserCheck,
  UserX,
  Star,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MissionWithApplications {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  payment_status: string | null;
  category: string;
  deadline: string | null;
  location: string | null;
  is_remote: boolean;
  created_at: string;
  applications: Array<{
    id: string;
    status: string;
    cover_letter: string | null;
    created_at: string;
    student_id: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
      average_rating: number;
    };
    student_profiles: {
      skills: string[];
      hourly_rate: number | null;
    };
  }>;
}

const ClientMissions = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [missions, setMissions] = useState<MissionWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (userRole !== "client") {
      navigate("/dashboard");
      return;
    }
    loadMissions();

    // Set up realtime subscription for mission changes
    const channel = supabase
      .channel('client-missions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions',
          filter: `client_id=eq.${user.id}`
        },
        () => {
          console.log('Mission changed, reloading...');
          loadMissions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        () => {
          console.log('Application changed, reloading...');
          loadMissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const loadMissions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Charger toutes les missions du client
      const { data: missionsData, error: missionsError } = await supabase
        .from("missions")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (missionsError) throw missionsError;

      // Pour chaque mission, charger les candidatures avec les profils étudiants
      const missionsWithApps = await Promise.all(
        (missionsData || []).map(async (mission) => {
          const { data: apps, error: appsError } = await supabase
            .from("applications")
            .select("*")
            .eq("mission_id", mission.id);

          if (appsError) {
            console.error("Error loading applications:", appsError);
            return { ...mission, applications: [] };
          }

          // Charger les profils des étudiants
          const studentIds = apps.map((app) => app.student_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, average_rating")
            .in("id", studentIds);

          const { data: studentProfiles } = await supabase
            .from("student_profiles")
            .select("user_id, skills, hourly_rate")
            .in("user_id", studentIds);

          const profilesMap = new Map(profiles?.map((p) => [p.id, p]));
          const studentProfilesMap = new Map(
            studentProfiles?.map((sp) => [sp.user_id, sp])
          );

          const appsWithProfiles = apps.map((app) => ({
            ...app,
            profiles: profilesMap.get(app.student_id),
            student_profiles: studentProfilesMap.get(app.student_id),
          }));

          return {
            ...mission,
            applications: appsWithProfiles,
          };
        })
      );

      setMissions(missionsWithApps);
    } catch (error) {
      console.error("Error loading missions:", error);
      toast.error("Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (
    applicationId: string,
    missionId: string,
    studentId: string
  ) => {
    try {
      // Update application status
      const { error: appError } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", applicationId);

      if (appError) throw appError;

      // Update mission status to in_discussion
      const { error: missionError } = await supabase
        .from("missions")
        .update({ status: "in_discussion" })
        .eq("id", missionId);

      if (missionError) throw missionError;

      // Create conversation
      const { error: convError } = await supabase.from("conversations").insert({
        mission_id: missionId,
        student_id: studentId,
        client_id: user?.id,
      });

      if (convError && !convError.message.includes("duplicate")) throw convError;

      toast.success("Candidature acceptée ! Procédez au paiement pour lancer la mission.");
      loadMissions();
    } catch (error) {
      console.error("Error accepting application:", error);
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", applicationId);

      if (error) throw error;

      toast.success("Candidature refusée");
      loadMissions();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast.error("Erreur lors du refus");
    }
  };

  const handleStartMission = async (missionId: string) => {
    try {
      const { error } = await supabase
        .from("missions")
        .update({ status: "in_progress" })
        .eq("id", missionId);

      if (error) throw error;

      toast.success("Mission démarrée !");
      loadMissions();
    } catch (error) {
      console.error("Error starting mission:", error);
      toast.error("Erreur lors du démarrage");
    }
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      const { error } = await supabase
        .from("missions")
        .update({ status: "completed" })
        .eq("id", missionId);

      if (error) throw error;

      // Get payment intent ID and release escrow
      const { data: paymentData } = await supabase
        .from("payments")
        .select("stripe_payment_intent_id")
        .eq("mission_id", missionId)
        .eq("status", "succeeded")
        .single();

      if (paymentData?.stripe_payment_intent_id) {
        const { error: escrowError } = await supabase.functions.invoke("release-escrow", {
          body: { paymentIntentId: paymentData.stripe_payment_intent_id },
        });

        if (escrowError) {
          toast.warning("Mission terminée, mais libération des fonds échouée");
        } else {
          toast.success("Mission terminée et fonds libérés !");
        }
      } else {
        toast.success("Mission marquée comme terminée !");
      }

      loadMissions();
    } catch (error) {
      console.error("Error completing mission:", error);
      toast.error("Erreur lors de la complétion");
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    try {
      const { error } = await supabase
        .from("missions")
        .delete()
        .eq("id", missionId);

      if (error) throw error;

      toast.success("Mission supprimée");
      loadMissions();
    } catch (error) {
      console.error("Error deleting mission:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="h-4 w-4" />;
      case "in_discussion":
        return <AlertCircle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4 animate-pulse" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "canceled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "Ouverte",
      in_discussion: "En discussion",
      in_progress: "En cours",
      completed: "Terminée",
      canceled: "Annulée",
    };
    return labels[status] || status;
  };

  const filterMissions = (status: string) => {
    if (status === "all") return missions;
    if (status === "pending") {
      return missions.filter(
        (m) =>
          m.status === "open" &&
          m.applications.some((app) => app.status === "pending")
      );
    }
    return missions.filter((m) => m.status === status);
  };

  const getTabCount = (status: string) => {
    return filterMissions(status).length;
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

  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-12">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2">
                Mes missions
              </h1>
              <p className="text-muted-foreground">
                Gérez vos missions et candidatures
              </p>
            </div>
            <CreateMissionDialog />
          </div>

          {/* Actions Urgentes */}
          {missions.filter(m => m.status === "in_discussion" && m.payment_status !== "paid").length > 0 && (
            <Card className="mb-8 border-2 border-primary shadow-lg">
              <CardHeader className="bg-gradient-primary text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg animate-pulse">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  Action urgente : Paiement requis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-lg mb-6">
                  {missions.filter(m => m.status === "in_discussion" && m.payment_status !== "paid").length > 1 
                    ? `${missions.filter(m => m.status === "in_discussion" && m.payment_status !== "paid").length} étudiants ont accepté vos missions. Procédez au paiement pour démarrer les projets.`
                    : "Un étudiant a accepté votre mission. Procédez au paiement pour démarrer le projet."}
                </p>
                <div className="space-y-4">
                  {missions
                    .filter(m => m.status === "in_discussion" && m.payment_status !== "paid")
                    .map((mission) => {
                      const acceptedApp = mission.applications.find(app => app.status === "accepted");
                      return (
                        <Card key={mission.id} className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-6">
                              {/* Student Info */}
                              {acceptedApp && (
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-16 w-16 border-2 border-primary">
                                    <AvatarImage src={acceptedApp.profiles?.avatar_url || ""} />
                                    <AvatarFallback>
                                      {acceptedApp.profiles?.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-lg">{acceptedApp.profiles?.full_name}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      <span>{acceptedApp.profiles?.average_rating || 0}/5</span>
                                      {acceptedApp.student_profiles?.hourly_rate && (
                                        <>
                                          <span>•</span>
                                          <span>{acceptedApp.student_profiles.hourly_rate}€/h</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Mission Info */}
                              <div className="flex-1">
                                <h3 className="font-bold text-xl mb-2">{mission.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge variant="secondary">{mission.category}</Badge>
                                  <Badge className="bg-gradient-primary">En discussion</Badge>
                                </div>
                                <p className="text-2xl font-bold text-primary mb-2">
                                  {mission.budget} €
                                </p>
                                {mission.deadline && (
                                  <p className="text-sm text-muted-foreground">
                                    Deadline : {format(new Date(mission.deadline), "dd MMMM yyyy", { locale: fr })}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2">
                                <PaymentDialog
                                  missionId={mission.id}
                                  missionTitle={mission.title}
                                  suggestedAmount={mission.budget}
                                >
                                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8">
                                    <DollarSign className="mr-2 h-5 w-5" />
                                    Payer {mission.budget}€
                                  </Button>
                                </PaymentDialog>
                                <Button
                                  variant="outline"
                                  onClick={() => navigate(`/messages`)}
                                  size="sm"
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Contacter
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
              <TabsTrigger value="all">
                Toutes ({getTabCount("all")})
              </TabsTrigger>
              <TabsTrigger value="pending">
                En attente ({getTabCount("pending")})
              </TabsTrigger>
              <TabsTrigger value="in_discussion">
                Discussion ({getTabCount("in_discussion")})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                En cours ({getTabCount("in_progress")})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Terminées ({getTabCount("completed")})
              </TabsTrigger>
              <TabsTrigger value="canceled">
                Annulées ({getTabCount("canceled")})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {filterMissions(activeTab).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                      Aucune mission dans cette catégorie
                    </p>
                    <CreateMissionDialog />
                  </CardContent>
                </Card>
              ) : (
                filterMissions(activeTab).map((mission) => (
                  <Card key={mission.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(mission.status)}
                            <Badge variant="secondary">
                              {getStatusLabel(mission.status)}
                            </Badge>
                            <Badge variant="outline">{mission.category}</Badge>
                            {mission.applications.filter((a) => a.status === "pending")
                              .length > 0 && (
                              <Badge className="bg-gradient-primary">
                                {
                                  mission.applications.filter(
                                    (a) => a.status === "pending"
                                  ).length
                                }{" "}
                                nouvelle{mission.applications.filter((a) => a.status === "pending").length > 1 ? "s" : ""} candidature
                                {mission.applications.filter((a) => a.status === "pending").length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-2xl mb-2">
                            {mission.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {mission.description}
                          </p>
                        </div>
                        <Button
                          onClick={() => navigate(`/missions/${mission.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-4">
                      {/* Mission Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Budget</p>
                            <p className="font-semibold">{mission.budget} €</p>
                          </div>
                        </div>
                        {mission.deadline && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Deadline
                              </p>
                              <p className="font-semibold text-sm">
                                {format(new Date(mission.deadline), "dd MMM yyyy", {
                                  locale: fr,
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Lieu</p>
                            <p className="font-semibold text-sm">
                              {mission.is_remote
                                ? "Télétravail"
                                : mission.location || "Non spécifié"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Créée le</p>
                            <p className="font-semibold text-sm">
                              {format(new Date(mission.created_at), "dd MMM yyyy", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mission Actions */}
                      {mission.status === "in_discussion" && (
                        <div className="flex gap-2 pt-2">
                          {mission.payment_status !== "paid" ? (
                            <PaymentDialog
                              missionId={mission.id}
                              missionTitle={mission.title}
                              suggestedAmount={mission.budget}
                            >
                              <Button className="bg-gradient-primary">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Payer {mission.budget}€
                              </Button>
                            </PaymentDialog>
                          ) : (
                            <Button
                              onClick={() => handleStartMission(mission.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Démarrer la mission
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/messages`)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Messages
                          </Button>
                        </div>
                      )}

                      {mission.status === "in_progress" && (
                        <div className="flex gap-2 pt-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marquer comme terminée
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirmer la fin de la mission
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cela va libérer les fonds en escrow vers l'étudiant.
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCompleteMission(mission.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Confirmer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/messages`)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Messages
                          </Button>
                        </div>
                      )}

                      {/* Applications List */}
                      {mission.applications.length > 0 && (
                        <div className="border-t pt-4 space-y-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Candidatures ({mission.applications.length})
                          </h3>
                          {mission.applications.map((app) => (
                            <Card key={app.id} className="bg-muted/30">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-4">
                                  <Avatar
                                    className="h-12 w-12 cursor-pointer"
                                    onClick={() =>
                                      navigate(`/students/${app.student_id}`)
                                    }
                                  >
                                    <AvatarImage
                                      src={app.profiles?.avatar_url || ""}
                                    />
                                    <AvatarFallback>
                                      {app.profiles?.full_name?.[0] || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <h4
                                          className="font-semibold cursor-pointer hover:text-primary"
                                          onClick={() =>
                                            navigate(`/students/${app.student_id}`)
                                          }
                                        >
                                          {app.profiles?.full_name}
                                        </h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          {app.student_profiles?.hourly_rate && (
                                            <span>
                                              {app.student_profiles.hourly_rate}€/h
                                            </span>
                                          )}
                                          {app.profiles?.average_rating > 0 && (
                                            <span className="flex items-center gap-1">
                                              ⭐ {app.profiles.average_rating.toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                        {app.cover_letter && (
                                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                            {app.cover_letter}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Candidaté le{" "}
                                          {format(
                                            new Date(app.created_at),
                                            "dd MMM yyyy à HH:mm",
                                            { locale: fr }
                                          )}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant={
                                            app.status === "accepted"
                                              ? "default"
                                              : app.status === "rejected"
                                              ? "destructive"
                                              : "outline"
                                          }
                                        >
                                          {app.status === "pending" && "En attente"}
                                          {app.status === "accepted" && "Acceptée"}
                                          {app.status === "rejected" && "Refusée"}
                                        </Badge>
                                      </div>
                                    </div>
                                    {app.status === "pending" &&
                                      mission.status === "open" && (
                                        <div className="flex gap-2 mt-3">
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleAcceptApplication(
                                                app.id,
                                                mission.id,
                                                app.student_id
                                              )
                                            }
                                            className="bg-gradient-primary"
                                          >
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Accepter
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                              >
                                                <UserX className="mr-2 h-4 w-4" />
                                                Refuser
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  Refuser cette candidature ?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  L'étudiant sera notifié du refus.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Annuler
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleRejectApplication(app.id)
                                                  }
                                                  className="bg-destructive hover:bg-destructive/90"
                                                >
                                                  Confirmer le refus
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              navigate(`/students/${app.student_id}`)
                                            }
                                          >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Voir profil
                                          </Button>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Delete Mission Button */}
                      {(mission.status === "open" || mission.status === "canceled" || mission.status === "completed") && (
                        <div className={mission.applications.length > 0 ? "border-t pt-4 mt-4" : "pt-2"}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer la mission
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Supprimer cette mission ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Toutes les candidatures associées seront également supprimées.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMission(mission.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ClientMissions;
