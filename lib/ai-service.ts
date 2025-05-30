import OpenAI from 'openai';

// Define constants for hardcoded prompts and settings
const PROMPT_SUMMARY_TEMPLATE = "Please provide a concise 2-3 word summary of this RM reply: {reply_text}";
const PROMPT_NEXT_ACTION_TEMPLATE = "Based on this RM reply, determine if the dealer is interested in a follow-up or not. Reply with ONLY \"FollowUp\" if follow-up is needed, or \"Dealer Not Interested\" if the dealer is expressing disinterest or rejection: {reply_text}";
const DEFAULT_MODEL = "gpt-3.5-turbo";
const API_ENDPOINT = "https://api.openai.com/v1";

// Define the response type for AI analysis
export interface AIAnalysisResult {
  summary: string;
  nextActionPrediction: 'FollowUp' | 'Dealer Not Interested';
  tokensConsumed: number;
}

/**
 * Analyzes the RM reply text and returns a summary and next action prediction
 */
export async function getAiAnalysisForReply(replyText: string): Promise<AIAnalysisResult | null> {
  try {
    console.log(`[AI Service] Starting analysis for reply text (${replyText.length} chars)`);
    
    // Get API key from environment variable
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    console.log(`[AI Service] API key ${apiKey ? 'found' : 'not found'}`);
    
    if (!apiKey) {
      console.warn('[AI Service] OpenAI API key not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file.');
      
      // Return a mock result for demonstration purposes
      return {
        summary: "API key needed",
        nextActionPrediction: "FollowUp",
        tokensConsumed: 0
      };
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: API_ENDPOINT,
      dangerouslyAllowBrowser: true,
    });
    
    // Prepare prompts
    const summaryPrompt = PROMPT_SUMMARY_TEMPLATE.replace('{reply_text}', replyText);
    const nextActionPrompt = PROMPT_NEXT_ACTION_TEMPLATE.replace('{reply_text}', replyText);
    
    console.log(`[AI Service] Prepared summary prompt: ${summaryPrompt.substring(0, 50)}...`);
    console.log(`[AI Service] Prepared next action prompt: ${nextActionPrompt.substring(0, 50)}...`);
    
    // Get summary from OpenAI
    console.log(`[AI Service] Making API call for summary analysis...`);
    const summaryResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a concise summarization assistant that provides brief, accurate summaries in 2-3 words.' },
        { role: 'user', content: summaryPrompt }
      ],
      max_tokens: 20,
    });
    
    console.log(`[AI Service] Summary response received: ${JSON.stringify(summaryResponse.choices[0]?.message)}`);
    console.log(`[AI Service] Summary tokens used: ${summaryResponse.usage?.total_tokens || 0}`);
    
    // Get next action prediction from OpenAI
    console.log(`[AI Service] Making API call for next action prediction...`);
    const nextActionResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are an assistant that analyzes dealer responses. Respond with only "FollowUp" or "Dealer Not Interested".' },
        { role: 'user', content: nextActionPrompt }
      ],
      max_tokens: 20,
    });
    
    console.log(`[AI Service] Next action response received: ${JSON.stringify(nextActionResponse.choices[0]?.message)}`);
    console.log(`[AI Service] Next action tokens used: ${nextActionResponse.usage?.total_tokens || 0}`);
    
    // Extract responses
    const summary = summaryResponse.choices[0]?.message.content?.trim() || 'No summary available';
    const nextActionRaw = nextActionResponse.choices[0]?.message.content?.trim() || 'FollowUp';
    
    console.log(`[AI Service] Extracted summary: "${summary}"`);
    console.log(`[AI Service] Extracted next action raw: "${nextActionRaw}"`);
    
    // Normalize the next action prediction
    let nextActionPrediction: 'FollowUp' | 'Dealer Not Interested';
    if (nextActionRaw.includes('Not Interested') || nextActionRaw.toLowerCase().includes('not interested')) {
      nextActionPrediction = 'Dealer Not Interested';
    } else {
      nextActionPrediction = 'FollowUp';
    }
    
    console.log(`[AI Service] Normalized next action: "${nextActionPrediction}"`);
    
    // Calculate tokens consumed
    const totalTokens = 
      (summaryResponse.usage?.total_tokens || 0) + 
      (nextActionResponse.usage?.total_tokens || 0);
    
    console.log(`[AI Service] Total tokens consumed: ${totalTokens}`);
    
    return {
      summary,
      nextActionPrediction,
      tokensConsumed: totalTokens
    };
  } catch (error) {
    console.error('[AI Service] Error in AI analysis:', error);
    
    // Handle specific API errors
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
        console.error('[AI Service] Invalid OpenAI API key. Please check your NEXT_PUBLIC_OPENAI_API_KEY in .env.local');
        
        // Return a specific error result
        return {
          summary: "API key invalid",
          nextActionPrediction: "FollowUp",
          tokensConsumed: 0
        };
      }
    }
    
    return null;
  }
}

/**
 * Maps the AI next action prediction to a workflow stage
 */
export function mapAIDecisionToWorkflowStage(aiDecision: string): string {
  if (aiDecision === 'Dealer Not Interested') {
    return 'Dropped';
  } else {
    return 'RM_AwaitingReply';
  }
} 