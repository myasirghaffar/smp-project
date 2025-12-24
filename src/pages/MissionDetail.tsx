import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, DollarSign, Building, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import ReviewDialog from "@/components/ReviewDialog";
import { PaymentDialog } from "@/components/PaymentDialog";
import { AiStudentMatcher } from "@/components/AiStudentMatcher";
import { AiApplicationScorer } from "@/components/AiApplicationScorer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const MissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, userRole } = useAuth();
  const [mission, setMission] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for payment success/cancel status
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Paiement confirmé ! Votre mission a été payée avec succès. Les fonds sont sécurisés en escrow.', {
        duration: 6000,
      });
      // Clear the payment param from URL
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
      
      // Reload mission to get updated payment status
      if (id) {
        loadMission();
      }
    } else if (paymentStatus === 'canceled') {
      toast.error('Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.');
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, id]);

  useEffect(() => {
    if (id) {
      loadMission();
      if (userRole === "client") {
        loadApplications();
      } else if (userRole === "student") {
        checkApplication();
      }
    }
  }, [id, userRole]);

  const loadMission = async () => {
    try {
      const { data: missionData, error } = await supabase
        .from("missions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch client profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", missionData.client_id)
        .single();

      setMission({
        ...missionData,
        profiles: profileData
      });
    } catch (error) {
      console.error("Error loading mission:", error);
      toast.error("Erreur lors du chargement de la mission");
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data: appsData, error } = await supabase
        .from("applications")
        .select("*")
        .eq("mission_id", id);

      if (error) throw error;

      // Fetch profiles and student profiles
      const studentIds = appsData?.map(a => a.student_id) || [];
      
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", studentIds);

      const { data: studentProfilesData } = await supabase
        .from("student_profiles")
        .select("user_id, skills, hourly_rate")
        .in("user_id", studentIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const studentProfilesMap = new Map(studentProfilesData?.map(sp => [sp.user_id, sp]) || []);

      const transformedApps = (appsData || []).map(app => ({
        ...app,
        profiles: profilesMap.get(app.student_id),
        student_profiles: studentProfilesMap.get(app.student_id)
      }));

      setApplications(transformedApps);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  };

  const checkApplication = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("mission_id", id)
        .eq("student_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setHasApplied(!!data);
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  const handleApply = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("applications").insert({
        mission_id: id,
        student_id: user.id,
        cover_letter: coverLetter.trim() || null,
      });

      if (error) throw error;

      toast.success("Candidature envoyée avec succès !");
      setHasApplied(true);
      setCoverLetter("");
    } catch (error) {
      console.error("Error applying:", error);
      toast.error("Erreur lors de l'envoi de la candidature");
    }
  };

  const handleAcceptApplication = async (applicationId: string, studentId: string) => {
    if (!mission) return;

    try {
      // Update application status
      const { error: appError } = await supabase
        .from("applications")
        .update({ status: "accepted" })
        .eq("id", applicationId);

      if (appError) throw appError;

      // Update mission status to in_discussion (waiting for payment)
      const { error: missionError } = await supabase
        .from("missions")
        .update({ status: "in_discussion" })
        .eq("id", id);

      if (missionError) throw missionError;

      // Create conversation
      const { error: convError } = await supabase.from("conversations").insert({
        mission_id: id,
        student_id: studentId,
        client_id: user?.id,
      });

      if (convError && !convError.message.includes("duplicate")) throw convError;

      toast.success("Candidature acceptée ! Procédez au paiement pour lancer la mission.");
      loadApplications();
      loadMission();
    } catch (error) {
      console.error("Error accepting application:", error);
      toast.error("Erreur lors de l'acceptation de la candidature");
    }
  };

  const handleStartMission = async () => {
    if (!mission) return;

    try {
      const { error } = await supabase
        .from("missions")
        .update({ status: "in_progress" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Mission démarrée !");
      loadMission();
    } catch (error) {
      console.error("Error starting mission:", error);
      toast.error("Erreur lors du démarrage de la mission");
    }
  };

  const handleCompleteMission = async () => {
    if (!mission) return;

    try {
      // Update mission status to completed
      const { error } = await supabase
        .from("missions")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      // Get payment intent ID for this mission
      const { data: paymentData } = await supabase
        .from("payments")
        .select("stripe_payment_intent_id")
        .eq("mission_id", id)
        .eq("status", "succeeded")
        .single();

      if (paymentData?.stripe_payment_intent_id) {
        // Release escrow funds
        const { error: escrowError } = await supabase.functions.invoke("release-escrow", {
          body: { paymentIntentId: paymentData.stripe_payment_intent_id },
        });

        if (escrowError) {
          console.error("Error releasing escrow:", escrowError);
          toast.warning("Mission terminée, mais la libération des fonds a échoué");
        } else {
          toast.success("Mission terminée et fonds libérés à l'étudiant !");
        }
      } else {
        toast.success("Mission marquée comme terminée !");
      }

      loadMission();
    } catch (error) {
      console.error("Error completing mission:", error);
      toast.error("Erreur lors de la complétion de la mission");
    }
  };

  const handleCancelMission = async () => {
    if (!mission) return;

    try {
      const { error } = await supabase
        .from("missions")
        .update({ status: "canceled" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Mission annulée");
      loadMission();
    } catch (error) {
      console.error("Error canceling mission:", error);
      toast.error("Erreur lors de l'annulation de la mission");
    }
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

  if (!mission) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-12">
          <div className="container text-center">
            <p className="text-muted-foreground">Mission non trouvée</p>
            <Button onClick={() => navigate("/missions")} className="mt-4">
              Retour aux missions
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
        <div className="container max-w-4xl">
          <Button variant="ghost" onClick={() => navigate("/missions")} className="mb-6">
            ← Retour aux missions
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar>
                      <AvatarImage src={mission.profiles?.avatar_url} />
                      <AvatarFallback>
                        {mission.profiles?.full_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Posté par</p>
                      <p className="font-medium">{mission.profiles?.full_name}</p>
                    </div>
                  </div>
                  <h1 className="text-3xl font-display font-bold mb-2">
                    {mission.title}
                  </h1>
                  <Badge variant="secondary">{mission.category}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {mission.description}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-semibold">{mission.budget} €</p>
                  </div>
                </div>

                {mission.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-semibold">
                        {format(new Date(mission.deadline), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {mission.is_remote ? (
                    <Building className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Lieu</p>
                    <p className="font-semibold">
                      {mission.is_remote ? "Télétravail" : mission.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge>{mission.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Student Application Form */}
              {userRole === "student" && mission.status === "open" && !hasApplied && (
                <Card className="mt-6">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Postuler à cette mission</h2>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="coverLetter">
                        Lettre de motivation (optionnel)
                      </Label>
                      <Textarea
                        id="coverLetter"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={5}
                        placeholder="Expliquez pourquoi vous êtes le candidat idéal..."
                      />
                    </div>
                    <Button
                      onClick={handleApply}
                      className="w-full bg-gradient-primary hover:opacity-90"
                    >
                      Envoyer ma candidature
                    </Button>
                  </CardContent>
                </Card>
              )}

              {hasApplied && (
                <Card className="bg-primary/10 border-primary">
                  <CardContent className="py-4">
                    <p className="text-center font-medium">
                      Vous avez déjà postulé à cette mission
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Client Applications View */}
              {userRole === "client" && mission.client_id === user?.id && (
                <>
                  {/* Mission Status Management */}
                  {mission.status !== "open" && (
                    <Card className="mt-6 border-primary/50 bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            {mission.status === "in_discussion" && (
                              <Clock className="h-5 w-5 text-yellow-500" />
                            )}
                            {mission.status === "in_progress" && (
                              <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                            )}
                            {mission.status === "completed" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {mission.status === "canceled" && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-semibold text-lg">
                                {mission.status === "in_discussion" && "En discussion"}
                                {mission.status === "in_progress" && "Mission en cours"}
                                {mission.status === "completed" && "Mission terminée"}
                                {mission.status === "canceled" && "Mission annulée"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {mission.status === "in_discussion" && "Payez pour démarrer la mission"}
                                {mission.status === "in_progress" && "La mission est en cours de réalisation"}
                                {mission.status === "completed" && "Vous pouvez maintenant laisser un avis"}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {/* Payment button - only if in_discussion and not paid */}
                            {mission.status === "in_discussion" && mission.payment_status !== "paid" && (
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
                            )}

                            {/* Start mission button - only if paid and in_discussion */}
                            {mission.status === "in_discussion" && mission.payment_status === "paid" && (
                              <Button onClick={handleStartMission} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Démarrer la mission
                              </Button>
                            )}

                            {/* Complete mission button - only if in_progress */}
                            {mission.status === "in_progress" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marquer comme terminée
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmer la complétion</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr que la mission est terminée ? Cette action libérera les fonds de l'escrow vers l'étudiant.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCompleteMission}>
                                      Confirmer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {/* Cancel button - only if not completed or canceled */}
                            {!["completed", "canceled"].includes(mission.status) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Annuler la mission
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Annuler la mission</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir annuler cette mission ? Si un paiement a été effectué, il sera remboursé.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Retour</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCancelMission} className="bg-red-600 hover:bg-red-700">
                                      Confirmer l'annulation
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Student Matcher - only for open missions */}
                  {mission.status === 'open' && (
                    <div className="mt-6">
                      <AiStudentMatcher missionId={mission.id} />
                    </div>
                  )}

                  {/* Applications list */}
                  <Card className="mt-6">
                    <CardHeader>
                      <h2 className="text-xl font-semibold">
                        Candidatures ({applications.length})
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {applications.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          Aucune candidature pour le moment
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {applications.map((app) => (
                            <Card key={app.id}>
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-3 flex-1">
                                    <Avatar>
                                      <AvatarImage src={app.profiles?.avatar_url} />
                                      <AvatarFallback>
                                        {app.profiles?.full_name?.[0] || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {app.profiles?.full_name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {app.student_profiles?.hourly_rate} €/h
                                      </p>
                                      {app.cover_letter && (
                                        <p className="text-sm mt-2 text-muted-foreground">
                                          {app.cover_letter}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 items-start">
                                    <Badge>{app.status}</Badge>
                                    {app.status === "pending" && mission.status === "open" && (
                                      <Button
                                        onClick={() =>
                                          handleAcceptApplication(app.id, app.student_id)
                                        }
                                        size="sm"
                                      >
                                        Accepter
                                      </Button>
                                    )}
                                    {app.status === "accepted" &&
                                      mission.status === "completed" && (
                                        <ReviewDialog
                                          missionId={mission.id}
                                          revieweeId={app.student_id}
                                          revieweeName={app.profiles?.full_name || ""}
                                          trigger={
                                            <Button size="sm" variant="outline">
                                              Laisser un avis
                                            </Button>
                                          }
                                        />
                                       )}
                                   </div>
                                 </div>
                                 
                                 {/* AI Application Scorer */}
                                 {app.status === "pending" && mission.status === "open" && (
                                   <AiApplicationScorer applicationId={app.id} />
                                 )}
                               </CardContent>
                             </Card>
                           ))}
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 </>
               )}
             </CardContent>
           </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MissionDetail;