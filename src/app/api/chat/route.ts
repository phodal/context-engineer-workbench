import { streamText, convertToModelMessages } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';

export const maxDuration = 30;

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
});

export async function POST(req: Request) {
    try {
        const { messages, config } = await req.json();

        // Validate messages
        if (!messages || !Array.isArray(messages)) {
            throw new Error('Messages must be an array');
        }

        // Build system prompt based on config
        let systemPrompt = 'You are a helpful AI assistant.';

        if (config?.enableRAG) {
            systemPrompt += ' You have access to relevant documents and can provide information based on them.';
        }

        if (config?.enableMemory) {
            systemPrompt += ' You remember previous conversations and can reference them.';
        }

        if (config?.enableTools) {
            systemPrompt += ' You have access to various tools and can use them to help answer questions.';
        }

        // Convert UIMessages to ModelMessages
        const modelMessages = convertToModelMessages(messages);

        const result = streamText({
            model: deepseek(config?.model || 'deepseek-chat'),
            messages: modelMessages,
            temperature: config?.temperature || 0.7,
            system: systemPrompt,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process chat request' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
