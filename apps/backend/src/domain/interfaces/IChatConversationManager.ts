import type { Result } from '../../shared/types/index.js';
import type {
  Conversation,
  ConversationSummary,
  GenerateResponseInput,
  GenerateResponseOutput,
} from '../../shared/types/chat.js';

/**
 * Interface for managing chat conversations with LLM
 * Handles conversation generation and summary creation
 */
export interface IChatConversationManager {
  /**
   * Generate a conversational response based on history and user message
   * @param input Conversation context and user message
   * @returns AI response with optional inline coaching
   */
  generateResponse(input: GenerateResponseInput): Promise<Result<GenerateResponseOutput>>;

  /**
   * Generate a comprehensive summary of the conversation
   * @param conversation The full conversation to summarize
   * @returns Detailed summary with scores and insights
   */
  generateSummary(conversation: Conversation): Promise<Result<ConversationSummary>>;

  /**
   * Check if the conversation manager is ready
   */
  isReady(): Promise<boolean>;
}
