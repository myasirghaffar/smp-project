import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, TrendingUp, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const AiProfileCoach = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coaching, setCoaching] = useState<any>(null);

  const handleGetCoaching = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-profile-coach', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data.coaching) {
        setCoaching(data.coaching);
        toast.success("Analyse complète reçue !");
      }
    } catch (error: any) {
      console.error('Error getting coaching:', error);
      toast.error(error.message || "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertCircle className="w-4 h-4" />;
    if (priority === 'medium') return <TrendingUp className="w-4 h-4" />;
    return <Lightbulb className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Coach IA - Améliore ton profil
        </CardTitle>
        <CardDescription>
          Obtiens des recommandations personnalisées pour booster ta visibilité
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!coaching ? (
          <Button
            onClick={handleGetCoaching}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyser mon profil
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score global</span>
                <span className="text-2xl font-bold text-primary">{coaching.overallScore}/100</span>
              </div>
              <Progress value={coaching.overallScore} className="h-2" />
            </div>

            {/* Strengths */}
            {coaching.strengths?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Points forts
                </h4>
                <div className="space-y-1">
                  {coaching.strengths.map((strength: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">• {strength}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {coaching.weaknesses?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Points à améliorer
                </h4>
                <div className="space-y-1">
                  {coaching.weaknesses.map((weakness: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">• {weakness}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {coaching.quickWins?.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Actions rapides (5 min)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {coaching.quickWins.map((win: string, i: number) => (
                      <li key={i} className="text-sm">✓ {win}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {coaching.recommendations?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Recommandations détaillées</h4>
                {coaching.recommendations.map((rec: any, i: number) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getPriorityColor(rec.priority)} text-white gap-1`}>
                            {getPriorityIcon(rec.priority)}
                            {rec.priority === 'high' ? 'Urgent' : rec.priority === 'medium' ? 'Important' : 'Optionnel'}
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-base">{rec.title}</CardTitle>
                      <CardDescription>{rec.description}</CardDescription>
                    </CardHeader>
                    {rec.actionSteps?.length > 0 && (
                      <CardContent className="pt-0">
                        <p className="text-sm font-medium mb-2">Plan d'action:</p>
                        <ol className="space-y-1 ml-4">
                          {rec.actionSteps.map((step: string, j: number) => (
                            <li key={j} className="text-sm list-decimal">{step}</li>
                          ))}
                        </ol>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}

            <Button
              onClick={handleGetCoaching}
              variant="outline"
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Réanalyser
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};