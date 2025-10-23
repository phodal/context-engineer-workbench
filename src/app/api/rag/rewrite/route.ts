import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { NextRequest, NextResponse } from 'next/server';

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Use streaming to get the rewritten query
    const result = await streamText({
      model: deepseek('deepseek-chat'),
      messages: [
        {
          role: 'user',
          content: `You are an expert at query rewriting for information retrieval. 
                    
Your task is to rewrite the following user query to make it more suitable for keyword-based search (BM25).

Original query: "${query}"

Please provide:
1. A rewritten query optimized for keyword search
2. The rewriting technique used (e.g., HyDE, Query2Doc, Expansion, etc.)

Format your response as JSON:
{
  "rewritten": "your rewritten query here",
  "technique": "technique name",
  "explanation": "brief explanation of the rewriting"
}`,
        },
      ],
      temperature: 0.7,
    });

    // Get the full text response
    const fullText = await result.text;

    // Parse the JSON response
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse rewrite response');
    }

    const rewriteData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      original: query,
      rewritten: rewriteData.rewritten,
      technique: rewriteData.technique,
      explanation: rewriteData.explanation,
      timestamp: Date.now(),
      usage: result.usage,
    });
  } catch (error) {
    console.error('Query rewrite error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
