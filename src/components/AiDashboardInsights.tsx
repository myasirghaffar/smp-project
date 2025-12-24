import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle, Info, Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const AiDashboardInsights = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    if (user && userRole) {
      loadInsights();
    }
  }, [user, userRole]);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-dashboard-insights', {
        body: { userId: user?.id, userRole }
      });

      if (error) throw error;

      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    if (type === 'success') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (type === 'warning') return <AlertCircle className="w-4 h-4 text-orange-600" />;
    if (type === 'tip') return <Lightbulb className="w-4 h-4 text-blue-600" />;
    return <Info className="w-4 h-4 text-gray-600" />;
  };

  const getInsightColor = (type: string) => {
    if (type === 'success') return 'border-green-200 bg-green-50';
    if (type === 'warning') return 'border-orange-200 bg-orange-50';
    if (type === 'tip') return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Insights IA
          </CardTitle>
          <CardDescription>Recommandations personnalisées pour toi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Insights */}
          {insights.insights?.map((insight: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}>
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                  {insight.action && (
                    <p className="text-xs font-medium mt-2 text-primary">→ {insight.action}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Trending Categories */}
          {insights.trendingCategories?.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">Catégories tendance:</p>
              <div className="flex flex-wrap gap-2">
                {insights.trendingCategories.map((cat: string, i: number) => (
                  <Badge key={i} variant="secondary">{cat}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {insights.nextSteps?.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">Prochaines actions:</p>
              <ul className="space-y-1">
                {insights.nextSteps.map((step: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5">▸</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};