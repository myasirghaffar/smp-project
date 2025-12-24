import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const commonQuestions = [
    {
      q: "Comment créer un compte étudiant ?",
      a: "Pour créer un compte étudiant, cliquez sur 'Inscription' en haut à droite, sélectionnez 'Étudiant', puis remplissez vos informations. Vous pourrez ensuite compléter votre profil avec vos compétences et portfolio."
    },
    {
      q: "Comment poster une mission en tant que client ?",
      a: "Après avoir créé votre compte client, accédez à 'Mes Missions' depuis le menu et cliquez sur 'Créer une mission'. Décrivez votre besoin, définissez le budget et publiez. Les étudiants pourront ensuite postuler."
    },
    {
      q: "Comment fonctionne le paiement ?",
      a: "Les paiements sont sécurisés via Stripe. Les fonds sont placés en escrow (garantie) au début de la mission et libérés à l'étudiant une fois la mission complétée et validée par le client."
    },
    {
      q: "Quels sont les frais de la plateforme ?",
      a: "SkillMatch prélève une commission sur chaque mission complétée. Les tarifs exacts sont affichés lors de la création de mission et de la réservation d'un étudiant."
    },
    {
      q: "Comment contacter un étudiant ?",
      a: "Vous pouvez contacter un étudiant via la messagerie interne une fois qu'il a postulé à votre mission ou après l'avoir réservé directement depuis son profil."
    }
  ];

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error("Veuillez poser une question");
      return;
    }

    setLoading(true);
    setAnswer("");

    try {
      const { data, error } = await supabase.functions.invoke("faq-chat", {
        body: { question }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnswer(data.answer);
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Erreur lors de la génération de la réponse. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="FAQ - Questions fréquentes"
        description="Toutes les réponses à vos questions sur SkillMatch. Comment créer un compte, poster une mission, fixer ses tarifs, ou contacter un étudiant. Posez votre question à notre assistant IA."
        keywords="FAQ SkillMatch, questions fréquentes, aide étudiant, support client, comment utiliser SkillMatch"
        url="https://skillmatch.fr/faq"
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="mb-6"
          >
            ← Retour
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Questions Fréquentes
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trouvez rapidement des réponses ou posez votre question à notre assistant IA.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Posez votre question à l'IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Tapez votre question ici..."
                  onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
                  disabled={loading}
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={loading}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Demander"
                  )}
                </Button>
              </div>

              {answer && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {answer}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions fréquentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {commonQuestions.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Vous ne trouvez pas la réponse à votre question ?
            </p>
            <Button
              onClick={() => navigate("/contact")}
              variant="outline"
            >
              Contactez-nous
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  </>
);
};

export default FAQ;
