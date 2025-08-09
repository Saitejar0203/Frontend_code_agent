// Constants for LLM response continuation logic

/**
 * Maximum number of continuation segments allowed for a single response
 * This prevents infinite loops in case of persistent truncation
 */
export const MAX_RESPONSE_SEGMENTS = 5;

/**
 * Continue prompt to append when requesting continuation from the LLM
 * This instructs the model to continue from where it left off
 */
export const CONTINUE_PROMPT = `Your previous response was truncated due to a token limit. Your task is to continue generating the response by following these critical rules, in order of precedence: 
 
 1.  **If Inside an Action Tag:** If the truncation occurred *inside* a \`<boltAction>...\</boltAction>\` block, you **MUST** discard the partial action and restart by re-emitting the **entire, most recent \`<boltAction>\` tag** from its beginning. Do not re-emit the parent \`<boltArtifact>\` or any actions that were already completed. 
 
 2.  **If Generating Plain Text:** If the truncation occurred while generating plain text (text for the chat UI, *outside* of any action tags), you **MUST** continue generating from the exact point of interruption. 
 
 **CRITICAL FORMATTING RULES:** - **DO NOT** repeat any content that was successfully and completely sent before the point of interruption. 
 - **DO NOT** add any conversational text, apologies, or explanations (e.g., "Okay, restarting the action..."). Your response must be a direct and seamless continuation. 
 - **You MUST NOT create or modify a \`plan.md\` file. Simply continue the previous, unfinished response.** 
 `;

/**
 * Finish reasons that indicate the response was truncated and should be continued
 */
export const TRUNCATION_FINISH_REASONS = [
  'MAX_TOKENS',
  'LENGTH',
  'max_tokens',
  'length'
] as const;

/**
 * Type for finish reasons that indicate truncation
 */
export type TruncationFinishReason = typeof TRUNCATION_FINISH_REASONS[number];

/**
 * Check if a finish reason indicates the response was truncated
 */
export function isTruncationFinishReason(finishReason: string | null | undefined): finishReason is TruncationFinishReason {
  if (!finishReason) return false;
  return TRUNCATION_FINISH_REASONS.includes(finishReason as TruncationFinishReason);
}

/**
 * Check if a response appears to be null or empty (another trigger for continuation)
 */
export function isNullResponse(content: string | null | undefined): boolean {
  if (!content) return true;
  const trimmed = content.trim();
  return trimmed === '' || trimmed === 'null' || trimmed === 'undefined';
}

/**
 * Maximum number of validation iterations allowed
 * This prevents infinite validation loops
 */
export const MAX_VALIDATION_ITERATIONS = 1;

/**
 * Validation prompt to send when checking code quality and completeness
 */
export const VALIDATION_PROMPT = `Review the entire conversation between human and AI, ensuring that the code and modifications given by AI satisfy the human code requests for generation and changes. Check for: 
- Code completeness and correctness 
- User requirement satisfaction 
- Potential errors or runtime issues
- Missing required functionality 
- Dependencies and build issues

IMPORTANT: If terminal output is provided below, analyze it for any errors, warnings, or issues. Note that some commands from the conversation history might still be processing or pending execution.

If the code is satisfactory and meets all requirements, respond with <validation_complete>. 
If code corrections are needed, provide ONLY the necessary <boltAction> tags with complete file modifications followed by terminal commands that should be executed AFTER all pending commands complete. Do NOT include explanatory text. **You MUST NOT create a \`plan.md\` file during this validation step.**`;

/**
 * Tags that indicate validation is complete and approved
 */
export const VALIDATION_COMPLETE_TAGS = [
  '<validation_complete>',
  '<code_approved>',
  '<validation_approved>'
] as const;

/**
 * Check if a validation response indicates the code is approved
 */
export function isValidationApproved(response: string | null | undefined): boolean {
  if (!response) return false;
  const content = response.toLowerCase();
  return VALIDATION_COMPLETE_TAGS.some(tag => content.includes(tag.toLowerCase()));
}