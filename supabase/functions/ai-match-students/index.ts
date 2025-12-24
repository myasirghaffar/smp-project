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
    const { missionId } = await req.json();

    if (!missionId) {
      throw new Error('Mission ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch mission details
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .single();

    if (missionError) throw missionError;

    // Fetch all available students with their profiles
    const { data: students, error: studentsError } = await supabase
      .from('student_profiles')
      .select(`
        *,
        profiles!student_profiles_user_id_fkey (
          id,
          full_name,
          bio,
          location,
          average_rating
        )
      `)
      .eq('availability_status', 'available');

    if (studentsError) throw studentsError;

    // Prepare data for AI analysis
    const missionContext = `
Mission: ${mission.title}
Category: ${mission.category}
Description: ${mission.description}
Location: ${mission.is_remote ? 'Remote' : mission.location || 'Not specified'}
Budget: €${mission.budget}
    `.trim();

    const studentsContext = students?.map((student, index) => `
Student ${index + 1}:
- Name: ${student.profiles?.full_name || 'Anonymous'}
- Categories: ${student.categories?.join(', ') || 'None'}
- Skills: ${student.skills?.join(', ') || 'None'}
- Hourly Rate: €${student.hourly_rate || 'Not set'}
- Location: ${student.profiles?.location || 'Not specified'}
- Average Rating: ${student.profiles?.average_rating || 0}/5
- Bio: ${student.profiles?.bio || 'No bio'}
    `).join('\n---\n') || 'No available students';

    // Call Lovable AI
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
            content: `You are an expert at matching students with project missions based on their skills, experience, and availability. Analyze the mission requirements and student profiles to provide the top 5 best matches. For each match, provide:
1. Student index number
2. Match score (0-100)
3. Key reasons why they're a good fit
4. Potential concerns if any

Return your response as a JSON array with this structure:
[
  {
    "studentIndex": 0,
    "matchScore": 95,
    "reasons": ["Reason 1", "Reason 2", "Reason 3"],
    "concerns": ["Concern 1"] or []
  }
]

Only include students with a match score of 50 or higher. Order by match score descending.`
          },
          {
            role: 'user',
            content: `${missionContext}\n\nAvailable Students:\n${studentsContext}\n\nProvide your top matches as JSON.`
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

    // Parse AI response (extract JSON from markdown code blocks if needed)
    let matches;
    try {
      // Try to find JSON in the response
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      matches = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI recommendations');
    }

    // Enrich matches with full student data
    const enrichedMatches = matches.map((match: any) => {
      const student = students[match.studentIndex];
      return {
        ...match,
        student: {
          id: student.user_id,
          fullName: student.profiles?.full_name,
          bio: student.profiles?.bio,
          location: student.profiles?.location,
          averageRating: student.profiles?.average_rating,
          categories: student.categories,
          skills: student.skills,
          hourlyRate: student.hourly_rate,
          avatarUrl: null // Would need to join profiles.avatar_url
        }
      };
    });

    return new Response(
      JSON.stringify({ matches: enrichedMatches }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ai-match-students:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});