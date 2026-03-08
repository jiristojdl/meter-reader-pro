import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { imageBase64, columns, mode } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const columnNames = (columns as { id: string; name: string }[])
      .map((c) => c.name)
      .join(", ");

    let systemPrompt: string;

    if (mode === "calibrate") {
      // Calibration mode: discover all values and suggest column names
      systemPrompt = `You are an OCR and data extraction assistant for reading instrument displays and meters.
You receive a photo of a display/meter and must extract ALL numeric readings visible.

Your task:
1. Read ALL visible numbers, text and labels from the image
2. Identify units (V, A, °C, kg, mA, kV, mV, W, kW, Ω, Hz, %, bar, Pa, psi, rpm, etc.)
3. For EACH distinct value you find, create a descriptive column name based on the label visible on the display, the unit, or context (e.g. "Napětí [V]", "Proud [A]", "Teplota [°C]", "Tlak [bar]")
4. If there is a label/text near the value on the display, use that as the column name
5. If no label is visible, use the unit to create a name (e.g. value in V → "Napětí [V]")

IMPORTANT: Respond ONLY with valid JSON, no markdown, no explanation. Use this exact format:
{
  "columns": [
    { "name": "<descriptive_name>", "value": "<number>", "unit": "<unit>" }
  ],
  "raw_text": "<everything you can read from the image>"
}

If you cannot read anything, respond with:
{ "columns": [], "raw_text": "" }`;
    } else {
      // Measurement mode: match values to existing columns
      systemPrompt = `You are an OCR and data extraction assistant for reading instrument displays and meters.
You receive a photo of a display/meter and must extract numeric readings.

The user has these FIXED columns: ${columnNames}

Your task:
1. Read ALL visible numbers and text from the image
2. Identify units (V, A, °C, kg, mA, kV, mV, W, kW, Ω, Hz, %, bar, Pa, psi, rpm, etc.)
3. Match each reading to the MOST APPROPRIATE existing column by comparing:
   - The unit in the column name vs the unit of the reading
   - The label/context of the reading vs the column name
   - The magnitude/range similarity to previous readings for that column
4. Do NOT create new columns. Only fill the existing ones.
5. If a column has no matching reading, use null

IMPORTANT: Respond ONLY with valid JSON, no markdown, no explanation. Use this exact format:
{
  "readings": {
    "<column_name>": { "value": "<number>", "unit": "<unit>" },
    ...
  },
  "raw_text": "<everything you can read from the image>"
}

If you cannot read anything, respond with:
{ "readings": {}, "raw_text": "" }`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: mode === "calibrate"
                    ? "Analyze this display image. Find ALL values and suggest column names for each."
                    : `Read the display values from this image and match them to these columns: ${columnNames}`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Příliš mnoho požadavků, zkuste to později." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Nedostatek kreditů pro AI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI chyba: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      const jsonStr = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = mode === "calibrate"
        ? { columns: [], raw_text: content }
        : { readings: {}, raw_text: content };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-ocr error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
