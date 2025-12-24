import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, category, budget, isRemote, location } = await req.json();

    if (!title || !category) {
      throw new Error('Title and category are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = description 
      ? `Améliore cette description de mission pour la rendre plus attractive et professionnelle. Garde le sens original mais rends-la plus claire et engageante.

Titre: ${title}
Catégorie: ${category}
Budget: ${budget}€
Lieu: ${isRemote ? 'Télétravail' : location || 'Non spécifié'}

Description actuelle:
${description}

Retourne UNIQUEMENT la description améliorée, sans préambule ni explication.`
      : `Crée une description de mission professionnelle et attractive basée sur ces informations:

Titre: ${title}
Catégorie: ${category}
Budget: ${budget}€
Lieu: ${isRemote ? 'Télétravail' : location || 'Non spécifié'}

Inclus:
- Une présentation claire du projet
- Les compétences recherchées
- Les livrables attendus
- Le contexte et les objectifs

Retourne UNIQUEMENT la description, sans préambule ni explication.`;

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
            content: 'Tu es un expert en rédaction de descriptions de projets freelance. Tu aides les clients à créer des descriptions claires, professionnelles et attractives pour leurs missions.'
          },
          {
            role: 'user',
            content: prompt
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
    const enhancedDescription = aiData.choices?.[0]?.message?.content;

    if (!enhancedDescription) {
      throw new Error('No response from AI');
    }

    return new Response(
      JSON.stringify({ enhancedDescription: enhancedDescription.trim() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ai-enhance-mission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});