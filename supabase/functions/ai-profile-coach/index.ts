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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile and student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: applications } = await supabase
      .from('applications')
      .select('status')
      .eq('student_id', userId);

    const profileContext = `
Profil actuel:
- Nom: ${profile?.full_name || 'Non renseigné'}
- Bio: ${profile?.bio || 'Vide'}
- Localisation: ${profile?.location || 'Non renseignée'}
- Note moyenne: ${profile?.average_rating || 0}/5

Profil étudiant:
- Catégories: ${studentProfile?.categories?.join(', ') || 'Aucune'}
- Compétences: ${studentProfile?.skills?.join(', ') || 'Aucune'}
- Taux horaire: ${studentProfile?.hourly_rate ? studentProfile.hourly_rate + '€/h' : 'Non défini'}
- Statut: ${studentProfile?.availability_status || 'Non défini'}
- Images portfolio: ${studentProfile?.portfolio_images?.length || 0}

Statistiques:
- Candidatures totales: ${applications?.length || 0}
- Candidatures acceptées: ${applications?.filter(a => a.status === 'accepted').length || 0}
- Taux de succès: ${applications?.length ? Math.round((applications.filter(a => a.status === 'accepted').length / applications.length) * 100) : 0}%
    `.trim();

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
            content: `Tu es un coach expert pour étudiants freelance. Analyse leur profil et fournis des recommandations concrètes et personnalisées pour améliorer leur visibilité et leurs chances d'être sélectionnés.

Fournis ta réponse au format JSON avec cette structure:
{
  "overallScore": 0-100,
  "strengths": ["point fort 1", "point fort 2"],
  "weaknesses": ["point faible 1", "point faible 2"],
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "category": "Catégorie",
      "title": "Titre court",
      "description": "Explication détaillée",
      "actionSteps": ["Étape 1", "Étape 2"]
    }
  ],
  "quickWins": ["Action rapide 1", "Action rapide 2"]
}`
          },
          {
            role: 'user',
            content: profileContext
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

    let coaching;
    try {
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      coaching = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI coaching');
    }

    return new Response(
      JSON.stringify({ coaching }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ai-profile-coach:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});