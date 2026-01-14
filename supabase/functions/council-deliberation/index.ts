import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_COUNCIL_MODELS = [
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "anthropic/claude-haiku-4.5",
  "x-ai/grok-4.1-fast",
];

const DEFAULT_CHAIRMAN_MODEL = "google/gemini-2.5-pro";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface Message {
  role: string;
  content: string;
}

interface ModelResponse {
  content?: string;
  reasoning_details?: any;
}

interface Stage1Result {
  model: string;
  response: string;
}

interface Stage2Result {
  model: string;
  ranking: string;
  parsed_ranking: string[];
}

interface Stage3Result {
  model: string;
  response: string;
}

async function queryModel(
  apiKey: string,
  model: string,
  messages: Message[],
  timeout = 120000
): Promise<ModelResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://llm-council.app",
        "X-Title": "LLM Council",
      },
      body: JSON.stringify({
        model,
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error querying model ${model}: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    return {
      content: message?.content,
      reasoning_details: message?.reasoning_details,
    };
  } catch (error) {
    console.error(`Error querying model ${model}:`, error);
    return null;
  }
}

async function queryModelsParallel(
  apiKey: string,
  models: string[],
  messages: Message[]
): Promise<Record<string, ModelResponse | null>> {
  const tasks = models.map((model) => queryModel(apiKey, model, messages));
  const responses = await Promise.all(tasks);
  
  const result: Record<string, ModelResponse | null> = {};
  models.forEach((model, index) => {
    result[model] = responses[index];
  });
  
  return result;
}

function parseRankingFromText(rankingText: string): string[] {
  if (rankingText.includes("FINAL RANKING:")) {
    const parts = rankingText.split("FINAL RANKING:");
    if (parts.length >= 2) {
      const rankingSection = parts[1];
      
      const numberedMatches = rankingSection.match(/\d+\.\s*Response [A-Z]/g);
      if (numberedMatches) {
        return numberedMatches.map((m) => {
          const match = m.match(/Response [A-Z]/);
          return match ? match[0] : "";
        }).filter(Boolean);
      }
      
      const matches = rankingSection.match(/Response [A-Z]/g);
      if (matches) return matches;
    }
  }
  
  const matches = rankingText.match(/Response [A-Z]/g);
  return matches || [];
}

function calculateAggregateRankings(
  stage2Results: Stage2Result[],
  labelToModel: Record<string, string>
): Array<{ model: string; average_rank: number; rankings_count: number }> {
  const modelPositions: Record<string, number[]> = {};

  for (const ranking of stage2Results) {
    const parsedRanking = ranking.parsed_ranking;
    
    parsedRanking.forEach((label, index) => {
      if (labelToModel[label]) {
        const modelName = labelToModel[label];
        if (!modelPositions[modelName]) {
          modelPositions[modelName] = [];
        }
        modelPositions[modelName].push(index + 1);
      }
    });
  }

  const aggregate = Object.entries(modelPositions).map(([model, positions]) => {
    const avgRank = positions.reduce((a, b) => a + b, 0) / positions.length;
    return {
      model,
      average_rank: Math.round(avgRank * 100) / 100,
      rankings_count: positions.length,
    };
  });

  aggregate.sort((a, b) => a.average_rank - b.average_rank);
  return aggregate;
}

async function stage1CollectResponses(
  apiKey: string,
  userQuery: string,
  councilModels: string[]
): Promise<Stage1Result[]> {
  console.log("Stage 1: Querying models:", councilModels);
  const messages = [{ role: "user", content: userQuery }];
  const responses = await queryModelsParallel(apiKey, councilModels, messages);
  
  const results: Stage1Result[] = [];
  for (const [model, response] of Object.entries(responses)) {
    if (response?.content) {
      console.log(`Stage 1: ${model} responded with ${response.content.length} chars`);
      results.push({
        model,
        response: response.content,
      });
    } else {
      console.error(`Stage 1: ${model} failed to respond`);
    }
  }
  
  console.log(`Stage 1: ${results.length}/${councilModels.length} models responded`);
  return results;
}

async function stage2CollectRankings(
  apiKey: string,
  userQuery: string,
  stage1Results: Stage1Result[],
  councilModels: string[]
): Promise<{ rankings: Stage2Result[]; labelToModel: Record<string, string> }> {
  const labels = stage1Results.map((_, i) => String.fromCharCode(65 + i));
  
  const labelToModel: Record<string, string> = {};
  labels.forEach((label, i) => {
    labelToModel[`Response ${label}`] = stage1Results[i].model;
  });
  
  console.log("Stage 2: Label to model mapping:", labelToModel);
  
  const responsesText = stage1Results
    .map((result, i) => `Response ${labels[i]}:\n${result.response}`)
    .join("\n\n");
  
  const rankingPrompt = `You are evaluating different responses to the following question:

Question: ${userQuery}

Here are the responses from different models (anonymized):

${responsesText}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

Now provide your evaluation and ranking:`;

  const messages = [{ role: "user", content: rankingPrompt }];
  const responses = await queryModelsParallel(apiKey, councilModels, messages);
  
  const rankings: Stage2Result[] = [];
  for (const [model, response] of Object.entries(responses)) {
    if (response?.content) {
      const fullText = response.content;
      const parsed = parseRankingFromText(fullText);
      console.log(`Stage 2: ${model} ranking parsed: ${parsed.join(", ")}`);
      rankings.push({
        model,
        ranking: fullText,
        parsed_ranking: parsed,
      });
    } else {
      console.error(`Stage 2: ${model} failed to respond`);
    }
  }
  
  return { rankings, labelToModel };
}

async function stage3SynthesizeFinal(
  apiKey: string,
  userQuery: string,
  stage1Results: Stage1Result[],
  stage2Results: Stage2Result[],
  chairmanModel: string
): Promise<Stage3Result> {
  console.log("Stage 3: Chairman model:", chairmanModel);
  
  const stage1Text = stage1Results
    .map((r) => `Model: ${r.model}\nResponse: ${r.response}`)
    .join("\n\n");
  
  const stage2Text = stage2Results
    .map((r) => `Model: ${r.model}\nRanking: ${r.ranking}`)
    .join("\n\n");
  
  const chairmanPrompt = `You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: ${userQuery}

STAGE 1 - Individual Responses:
${stage1Text}

STAGE 2 - Peer Rankings:
${stage2Text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:`;

  const messages = [{ role: "user", content: chairmanPrompt }];
  const response = await queryModel(apiKey, chairmanModel, messages);

  if (!response?.content) {
    console.error("Stage 3: Chairman failed to respond");
    return {
      model: chairmanModel,
      response: "Error: Unable to generate final synthesis.",
    };
  }

  console.log(`Stage 3: Chairman responded with ${response.content.length} chars`);
  return {
    model: chairmanModel,
    response: response.content,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userQuery, apiKey, councilModels, chairmanModel } = await req.json();

    if (!userQuery || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing userQuery or apiKey" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const models = councilModels && councilModels.length > 0 ? councilModels : DEFAULT_COUNCIL_MODELS;
    const chairman = chairmanModel || DEFAULT_CHAIRMAN_MODEL;

    console.log("=== NEW REQUEST ===");
    console.log("User query:", userQuery.substring(0, 100));
    console.log("Council models:", models);
    console.log("Chairman model:", chairman);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`event: stage1_start\ndata: {}\n\n`));

          const stage1Results = await stage1CollectResponses(apiKey, userQuery, models);
          
          if (stage1Results.length === 0) {
            console.error("All models failed in Stage 1");
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ message: "All models failed to respond" })}\n\n`
              )
            );
            controller.close();
            return;
          }

          controller.enqueue(
            encoder.encode(
              `event: stage1_complete\ndata: ${JSON.stringify(stage1Results)}\n\n`
            )
          );

          controller.enqueue(encoder.encode(`event: stage2_start\ndata: {}\n\n`));

          const { rankings, labelToModel } = await stage2CollectRankings(
            apiKey,
            userQuery,
            stage1Results,
            models
          );

          console.log('Stage 2 rankings count:', rankings.length);
          console.log('Stage 2 labelToModel:', labelToModel);

          const aggregateRankings = calculateAggregateRankings(rankings, labelToModel);
          console.log('Stage 2 aggregate rankings count:', aggregateRankings.length);

          const stage2CompleteData = {
            rankings,
            metadata: { label_to_model: labelToModel, aggregate_rankings: aggregateRankings },
          };
          console.log('Sending stage2_complete event with data keys:', Object.keys(stage2CompleteData));

          controller.enqueue(
            encoder.encode(
              `event: stage2_complete\ndata: ${JSON.stringify(stage2CompleteData)}\n\n`
            )
          );

          controller.enqueue(encoder.encode(`event: stage3_start\ndata: {}\n\n`));

          const stage3Result = await stage3SynthesizeFinal(
            apiKey,
            userQuery,
            stage1Results,
            rankings,
            chairman
          );

          controller.enqueue(
            encoder.encode(
              `event: stage3_complete\ndata: ${JSON.stringify(stage3Result)}\n\n`
            )
          );

          controller.enqueue(encoder.encode(`event: complete\ndata: {}\n\n`));
          console.log("=== REQUEST COMPLETE ===");
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
