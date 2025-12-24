import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiApplicationScorerProps {
  applicationId: string;
}

export const AiApplicationScorer = ({ applicationId }: AiApplicationScorerProps) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-score-application', {
        body: { applicationId }
      });

      if (error) throw error;

      if (data.analysis) {
        setAnalysis(data.analysis);
        toast.success("Analyse terminée !");
      }
    } catch (error: any) {
      console.error('Error analyzing application:', error);
      toast.error(error.message || "Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    if (recommendation === 'accept') {
      return <Badge className="bg-green-600"><ThumbsUp className="w-3 h-3 mr-1" /> Recommandé</Badge>;
    }
    if (recommendation === 'consider') {
      return <Badge className="bg-orange-600"><AlertTriangle className="w-3 h-3 mr-1" /> À considérer</Badge>;
    }
    return <Badge className="bg-red-600"><ThumbsDown className="w-3 h-3 mr-1" /> Non recommandé</Badge>;
  };

  if (!analysis) {
    return (
      <Button
        onClick={handleAnalyze}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyse IA...
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            Analyser avec l'IA
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className="mt-3 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Analyse IA
          </CardTitle>
          {getRecommendationBadge(analysis.recommendation)}
        </div>
        <CardDescription className="mt-2">{analysis.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score de correspondance</span>
            <span className="text-xl font-bold text-primary">{analysis.matchScore}/100</span>
          </div>
          <Progress value={analysis.matchScore} className="h-2" />
        </div>

        {/* Detailed Analysis */}
        {analysis.detailedAnalysis && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Analyse détaillée:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Compétences:</span>
                <span className="font-medium">{analysis.detailedAnalysis.skillsMatch}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expérience:</span>
                <span className="font-medium">{analysis.detailedAnalysis.experienceLevel}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Motivation:</span>
                <span className="font-medium">{analysis.detailedAnalysis.motivationQuality}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium">{analysis.detailedAnalysis.budgetAlignment}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths?.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-600">✓ Points forts:</p>
            <ul className="text-xs space-y-1 ml-4">
              {analysis.strengths.map((strength: string, i: number) => (
                <li key={i} className="list-disc">{strength}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {analysis.concerns?.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-orange-600">⚠ Points d'attention:</p>
            <ul className="text-xs space-y-1 ml-4">
              {analysis.concerns.map((concern: string, i: number) => (
                <li key={i} className="list-disc">{concern}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          variant="ghost"
          size="sm"
          className="w-full text-xs"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Réanalyser
        </Button>
      </CardContent>
    </Card>
  );
};