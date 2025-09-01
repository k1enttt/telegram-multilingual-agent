import { createOpenAI } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools/weather-tool';
import { languageTool } from '../tools/language/language-tool';

const vllmModel = (process.env.VLLM_MODEL || 'gpt-oss-20b').trim();
const vllmBaseURL = process.env.VLLM_BASE_URL?.trim();
const vllmApiKey = (process.env.VLLM_API_KEY || 'dummy').trim();

if (!vllmBaseURL) {
  // eslint-disable-next-line no-console
  console.warn('[weather-agent] VLLM_BASE_URL is not set. Set it in .env to your vLLM OpenAI-compatible endpoint, e.g. http://localhost:8000/v1');
}

// Create OpenAI-compatible client with custom baseURL (vLLM endpoint)
const openai = createOpenAI({
  apiKey: vllmApiKey,
  baseURL: vllmBaseURL,
});

// Chat model selection (vLLM must expose this model id). Adjust if server returns different name.
const model = openai.chat(vllmModel as any);

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.
      - If the user asks for activities, respond in the format they request.

      Use the weatherTool to fetch current weather data.
`,
  model,
  tools: { weatherTool, languageTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
