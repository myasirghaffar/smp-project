import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, User, MapPin, Star, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StudentMatch {
  studentIndex: number;
  matchScore: number;
  reasons: string[];
  concerns: string[];
  student: {
    id: string;
    fullName: string;
    bio: string;
    location: string;
    averageRating: number;
    categories: string[];
    skills: string[];
    hourlyRate: number;
  };
}

interface AiStudentMatcherProps {
  missionId: string;
}

export const AiStudentMatcher = ({ missionId }: AiStudentMatcherProps) => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<StudentMatch[]>([]);
  const navigate = useNavigate();

  const handleGetMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-match-students', {
        body: { missionId }
      });

      if (error) throw error;

      if (data.matches && data.matches.length > 0) {
        setMatches(data.matches);
        toast.success(`Trouvé ${data.matches.length} étudiant(s) correspondant(s)`);
      } else {
        toast.info("Aucun étudiant correspondant trouvé pour cette mission");
      }
    } catch (error: any) {
      console.error('Error getting AI matches:', error);
      toast.error(error.message || "Erreur lors de la recherche de correspondances");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-yellow-600";
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGetMatches}
        disabled={loading}
        className="w-full sm:w-auto gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Trouver les meilleurs étudiants (IA)
          </>
        )}
      </Button>

      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Étudiants recommandés par l'IA
          </h3>

          {matches.map((match, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {match.student.fullName || 'Étudiant'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {match.student.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {match.student.location}
                          </span>
                        )}
                        {match.student.averageRating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {match.student.averageRating.toFixed(1)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`gap-1 ${getScoreColor(match.matchScore)}`}>
                    <TrendingUp className="w-3 h-3" />
                    {match.matchScore}% match
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {match.student.bio && (
                  <p className="text-sm text-muted-foreground">{match.student.bio}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {match.student.categories?.map((cat, i) => (
                    <Badge key={i} variant="secondary">{cat}</Badge>
                  ))}
                  {match.student.skills?.map((skill, i) => (
                    <Badge key={i} variant="outline">{skill}</Badge>
                  ))}
                </div>

                {match.student.hourlyRate && (
                  <p className="text-sm font-medium">
                    Taux horaire: <span className="text-primary">{match.student.hourlyRate}€/h</span>
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-600">✓ Points forts:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    {match.reasons.map((reason, i) => (
                      <li key={i} className="list-disc">{reason}</li>
                    ))}
                  </ul>
                </div>

                {match.concerns.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-orange-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Points d'attention:
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      {match.concerns.map((concern, i) => (
                        <li key={i} className="list-disc">{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => navigate(`/student/${match.student.id}`)}
                  className="w-full"
                  variant="outline"
                >
                  Voir le profil complet
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};