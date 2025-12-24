import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userRole } = await req.json();

    if (!userId || !userRole) {
      throw new Error('User ID and role are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let context = '';

    if (userRole === 'student') {
      const { data: applications } = await supabase
        .from('applications')
        .select('*, missions(*)')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      context = `
Type: Étudiant

Profil:
- Catégories: ${studentProfile?.categories?.join(', ') || 'Aucune'}
- Compétences: ${studentProfile?.skills?.join(', ') || 'Aucune'}
- Taux horaire: ${studentProfile?.hourly_rate || 'Non défini'}€/h

Candidatures récentes: ${applications?.length || 0}
- En attente: ${applications?.filter(a => a.status === 'pending').length || 0}
- Acceptées: ${applications?.filter(a => a.status === 'accepted').length || 0}
- Refusées: ${applications?.filter(a => a.status === 'rejected').length || 0}

Catégories des missions postulées: ${[...new Set(applications?.map(a => a.missions?.category))].join(', ')}
      `.trim();
    } else {
      const { data: missions } = await supabase
        .from('missions')
        .select('*, applications(*)')
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      context = `
Type: Client

Missions créées: ${missions?.length || 0}
- Ouvertes: ${missions?.filter(m => m.status === 'open').length || 0}
- En cours: ${missions?.filter(m => m.status === 'in_progress').length || 0}
- Terminées: ${missions?.filter(m => m.status === 'completed').length || 0}

Budget total des missions: ${missions?.reduce((sum, m) => sum + (m.budget || 0), 0) || 0}€
Candidatures reçues: ${missions?.reduce((sum, m) => sum + (m.applications?.length || 0), 0) || 0}

Catégories populaires: ${[...new Set(missions?.map(m => m.category))].join(', ')}
      `.trim();
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant intelligent pour la plateforme SkillMatch Students. Fournis des insights personnalisés et actionnables.

Fournis ta réponse au format JSON:
{
  "insights": [
    {
      "type": "success" | "warning" | "info" | "tip",
      "title": "Titre court",
      "message": "Message détaillé",
      "action": "Action suggérée (optionnel)"
    }
  ],
  "recommendations": [
    "Recommandation 1",
    "Recommandation 2",
    "Recommandation 3"
  ],
  "trendingCategories": ["Catégorie 1", "Catégorie 2"],
  "nextSteps": ["Prochaine action 1", "Prochaine action 2"]
}`
          },
          {
            role: 'user',
            content: context
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from AI');
    }

    let insights;
    try {
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      insights = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI insights');
    }

    return new Response(
      JSON.stringify({ insights }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ai-dashboard-insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});