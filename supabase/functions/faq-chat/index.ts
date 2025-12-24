import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question) {
      throw new Error("Question is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un assistant virtuel pour SkillMatch Students, une plateforme qui met en relation des étudiants en formation professionnelle avec des clients recherchant des services. 

Contexte de la plateforme:
- Les étudiants peuvent créer des profils présentant leurs compétences (IT, design graphique, photographie, marketing, construction, coiffure, comptabilité, etc.)
- Les clients peuvent poster des missions ou réserver directement des étudiants
- La plateforme gère les paiements sécurisés via Stripe avec un système d'escrow
- La messagerie interne permet la communication entre clients et étudiants
- L'IA aide au matching étudiant-mission et à l'amélioration des profils

Réponds de manière claire, concise et professionnelle aux questions des utilisateurs sur:
- Comment créer un compte (étudiant ou client)
- Comment poster une mission
- Comment postuler à une mission
- Le système de paiement et sécurité
- Les fonctionnalités IA de la plateforme
- Les tarifs et frais
- Le support et contact

Si tu ne connais pas la réponse exacte, propose des suggestions utiles ou recommande de contacter le support.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporairement indisponible." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erreur lors de la génération de la réponse");
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("FAQ chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
