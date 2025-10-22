import { streamText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { NextRequest, NextResponse } from 'next/server';

const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
});

/**
 * Calculate BM25 score
 * BM25 formula: IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
 */
function calculateBM25Score(query: string, document: string, avgDocLength: number = 100): number {
    const k1 = 1.5; // term frequency saturation parameter
    const b = 0.75; // length normalization parameter
    
    const queryTerms = query.toLowerCase().split(/\s+/);
    const docTerms = document.toLowerCase().split(/\s+/);
    const docLength = docTerms.length;
    
    let score = 0;
    
    for (const term of queryTerms) {
        // Count term frequency in document
        const termFreq = docTerms.filter(t => t.includes(term)).length;
        
        if (termFreq === 0) continue;
        
        // Calculate IDF (Inverse Document Frequency)
        // Simplified: log(1 + termFreq)
        const idf = Math.log(1 + termFreq);
        
        // Calculate BM25 component
        const numerator = termFreq * (k1 + 1);
        const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
        
        score += idf * (numerator / denominator);
    }
    
    return Math.min(1, score / 10); // Normalize to 0-1
}

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        // Use AI to generate mock documents
        const result = await streamText({
            model: deepseek('deepseek-chat'),
            messages: [
                {
                    role: 'user',
                    content: `Generate 5 realistic mock documents related to the query: "${query}"
                    
Each document should be a short paragraph (2-3 sentences) that could be relevant to the query.
Format your response as a JSON array with this structure:
[
  {
    "title": "Document Title",
    "content": "Document content here..."
  },
  ...
]

Only return the JSON array, no other text.`,
                },
            ],
            temperature: 0.7,
        });

        const fullText = await result.text;
        
        // Parse the JSON response
        const jsonMatch = fullText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Failed to parse documents response');
        }

        interface Document {
            title: string;
            content: string;
        }

        const documents = JSON.parse(jsonMatch[0]) as Document[];

        // Calculate BM25 scores for each document
        const avgDocLength = documents.reduce((sum: number, doc: Document) =>
            sum + doc.content.split(/\s+/).length, 0) / documents.length;

        const scoredDocuments = documents.map((doc: Document, idx: number) => ({
            id: `doc-${idx}`,
            title: doc.title,
            content: doc.content,
            score: calculateBM25Score(query, doc.content, avgDocLength),
            metadata: {
                source: `generated-${idx}`,
                title: doc.title,
            },
        }));

        // Sort by score descending
        interface ScoredDocument extends Document {
            id: string;
            score: number;
        }

        scoredDocuments.sort((a: ScoredDocument, b: ScoredDocument) => b.score - a.score);

        return NextResponse.json({
            success: true,
            query,
            documents: scoredDocuments,
            bm25Info: {
                formula: 'IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))',
                k1: 1.5,
                b: 0.75,
                avgDocLength: Math.round(avgDocLength),
            },
            usage: result.usage,
        });
    } catch (error) {
        console.error('Generate documents error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

