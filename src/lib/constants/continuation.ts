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
export const CONTINUE_PROMPT = `Your previous response was truncated due to a token limit. Your task is to continue generating the response by following these critical rules: 
 
 1.  **Check for Incomplete Tags:** If the truncation occurred *inside* a \`<boltArtifact>\` or \`<boltAction>\` block, you **MUST** discard the partial block and restart the **most recent, outermost incomplete tag** from its beginning. 
     * *Example:* If you were inside a \`<boltAction>\` that was itself inside a \`<boltArtifact>\`, you must restart the entire \`<boltArtifact>\` block. 
 
 2.  **Continue if No Incomplete Tags:** If the previous response ended cleanly (not inside a tag), continue generating from the exact point of interruption. 
 
 3.  **Strict Formatting Rules:** 
     * **DO NOT** repeat any content that was successfully and completely sent before the point of interruption. 
     * **DO NOT** add any conversational text, apologies, or explanations (e.g., "Okay, restarting the artifact..."). 
    .`;

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
export const MAX_VALIDATION_ITERATIONS = 3;

/**
 * Validation prompt to send when checking code quality and completeness
 */
export const VALIDATION_PROMPT = `Review the entire conversation between human and AI, AI is responding to human request ensure that the code and mdofications given by AI satisfy the human code requests for generation and changes. Check for:
- Code completeness and correctness
- User requirement satisfaction
- Potential errors or improvements
- Missing functionality or edge cases

If the code is satisfactory and meets all requirements, respond with <validation_complete>.
If improvements are needed, provide specific fixes and emit complete files with modifications.`;

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