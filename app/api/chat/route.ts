import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { openrouter } from "@/lib/ai/provider";
import { getWeather } from "@/lib/ai/tools/get-weather";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    model,
    webSearch,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch: boolean;
  } = await req.json();

  const result = streamText({
    model: webSearch ? openrouter("perplexity/sonar") : openrouter(model),
    messages: await convertToModelMessages(messages),
    system:
      "You are a helpful assistant that can answer questions and help with tasks",
    tools:
      model === "google/gemini-2.5-flash-image" || webSearch
        ? undefined
        : {
            getWeather,
          },
    stopWhen: stepCountIs(5),
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
