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
    const { applicationId } = await req.json();

    if (!applicationId) {
      throw new Error('Application ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch application with student and mission details
    const { data: application } = await supabase
      .from('applications')
      .select('*, cover_letter, student_id, mission_id')
      .eq('id', applicationId)
      .single();

    if (!application) {
      throw new Error('Application not found');
    }

    const { data: mission } = await supabase
      .from('missions')
      .select('*')
      .eq('id', application.mission_id)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', application.student_id)
      .single();

    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', application.student_id)
      .single();

    const { data: pastApplications } = await supabase
      .from('applications')
      .select('status')
      .eq('student_id', application.student_id);

    const context = `
Mission:
- Titre: ${mission?.title}
- Catégorie: ${mission?.category}
- Description: ${mission?.description}
- Budget: ${mission?.budget}€
- Lieu: ${mission?.is_remote ? 'Télétravail' : mission?.location}

Candidat:
- Nom: ${profile?.full_name || 'Non renseigné'}
- Note: ${profile?.average_rating || 0}/5
- Bio: ${profile?.bio || 'Aucune'}
- Catégories: ${studentProfile?.categories?.join(', ') || 'Aucune'}
- Compétences: ${studentProfile?.skills?.join(', ') || 'Aucune'}
- Taux horaire: ${studentProfile?.hourly_rate || 0}€/h
- Statut: ${studentProfile?.availability_status}

Lettre de motivation:
${application?.cover_letter || 'Aucune lettre fournie'}

Historique:
- Candidatures passées: ${pastApplications?.length || 0}
- Acceptées: ${pastApplications?.filter(a => a.status === 'accepted').length || 0}
- Taux de succès: ${pastApplications?.length ? Math.round((pastApplications.filter(a => a.status === 'accepted').length / pastApplications.length) * 100) : 0}%
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
            content: `Tu es un expert en évaluation de candidatures freelance. Analyse la correspondance entre le candidat et la mission.

Fournis ta réponse au format JSON:
{
  "matchScore": 0-100,
  "strengths": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "concerns": ["Préoccupation 1", "Préoccupation 2"],
  "recommendation": "accept" | "consider" | "decline",
  "summary": "Résumé en 2-3 phrases",
  "detailedAnalysis": {
    "skillsMatch": 0-100,
    "experienceLevel": 0-100,
    "motivationQuality": 0-100,
    "budgetAlignment": 0-100,
    "availability": 0-100
  }
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

    let analysis;
    try {
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI analysis');
    }

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ai-score-application:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});