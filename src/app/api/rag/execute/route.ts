import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { NextRequest, NextResponse } from 'next/server';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
});

interface SearchResultItem {
    metadata?: { title?: string };
    content: string;
    score?: number;
}

export async function POST(request: NextRequest) {
    try {
        const { query, searchResults } = await request.json() as { query: string; searchResults: SearchResultItem[] };

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // Format search results for context
        const context = searchResults
            ?.map((result: SearchResultItem, idx: number) =>
                `[${idx + 1}] ${result.metadata?.title || 'Document'} (Score: ${(result.score ? (result.score * 100).toFixed(1) : '0')}%)\n${result.content}`
            )
            .join('\n\n') || 'No search results available';

        // Use streaming to generate the answer
        const result = await streamText({
            model: deepseek('deepseek-chat'),
            messages: [
                {
                    role: 'user',
                    content: `Based on the following search results, please answer the user's query comprehensively.

User Query: "${query}"

Search Results:
${context}

Please provide a detailed answer that:
1. Directly addresses the user's query
2. Cites the relevant search results
3. Explains the key concepts
4. Is clear and well-structured`,
                },
            ],
            temperature: 0.7,
        });

        // Get the full text response
        const fullText = await result.text;

        return NextResponse.json({
            success: true,
            query,
            result: fullText,
            usage: result.usage,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('RAG execution error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

