import type { BoltAction } from './types';
import { createScopedLogger } from '@/lib/utils/logger';

const ARTIFACT_TAG_OPEN = '<boltArtifact';
const ARTIFACT_TAG_CLOSE = '</boltArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<boltAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</boltAction>';
const BOLT_IMAGE_TASK_TAG_OPEN = '<boltImageTask>';
const BOLT_IMAGE_TASK_TAG_CLOSE = '</boltImageTask>';

const logger = createScopedLogger('StreamingMessageParser');

export interface BoltArtifactData {
  id: string;
  title: string;
}

export interface ArtifactCallbackData extends BoltArtifactData {
  messageId: string;
}

export interface ActionCallbackData {
  artifactId?: string;
  messageId: string;
  action: BoltAction;
}

export type ArtifactCallback = (data: ArtifactCallbackData) => void;
export type ActionCallback = (data: ActionCallbackData) => void;

export interface ImageGenerationRequest {
  localPath: string;
  description: string;
}

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionClose?: ActionCallback;
  onActionContentUpdate?: ActionCallback; // New callback for immediate triggering
  onText?: (text: string) => void;
  onImageGenerationRequest?: (requests: ImageGenerationRequest[]) => void;
}

interface ElementFactoryProps {
  messageId: string;
}

type ElementFactory = (props: ElementFactoryProps) => string;

export interface StreamingMessageParserOptions {
  callbacks?: ParserCallbacks;
  artifactElement?: ElementFactory;
}

interface MessageState {
  position: number;
  insideArtifact: boolean;
  insideAction: boolean;
  insideBoltImageTask: boolean;
  currentArtifact?: BoltArtifactData;
  currentAction: { content: string; type?: string; filePath?: string };
  tagBuffer: string;
  boltImageTaskBuffer: string;
  actionId: number;
  lastContentLength: number; // Track content length for immediate triggering
  contentUpdateThreshold: number; // Minimum content before triggering
}

export class StreamingMessageParser {
  private messages = new Map<string, MessageState>();
  private callbacks: ParserCallbacks;

  constructor(callbacks: ParserCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Check if the parser is currently inside an artifact for a given message
   */
  public isInsideArtifact(messageId: string): boolean {
    const state = this.messages.get(messageId);
    return state?.insideArtifact || false;
  }

  /**
   * Check if the parser is currently inside an action for a given message
   */
  public isInsideAction(messageId: string): boolean {
    const state = this.messages.get(messageId);
    return state?.insideAction || false;
  }

  /**
   * Check if the parser is currently inside any XML tag (artifact or action)
   */
  public isInsideXmlTag(messageId: string): boolean {
    return this.isInsideArtifact(messageId) || this.isInsideAction(messageId);
  }

  parse(messageId: string, chunk: string): void {
    logger.debug(`Parsing chunk for message ${messageId}: "${chunk.substring(0, 100)}..."`); 
    let state = this.messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideArtifact: false,
        insideAction: false,
        insideBoltImageTask: false,
        currentAction: { content: '' },
        tagBuffer: '',
        boltImageTaskBuffer: '',
        actionId: 0,
        lastContentLength: 0,
        contentUpdateThreshold: 50, // Trigger after 50 characters
      };
      this.messages.set(messageId, state);
    }
    this.processChunk(messageId, state, chunk);
  }

  private processChunk(messageId: string, state: MessageState, chunk: string) {
    let currentText = '';

    for (let i = 0; i < chunk.length; i++) {
      const char = chunk[i];

      if (state.insideBoltImageTask) {
        // If we are inside an image block, buffer EVERYTHING until the closing tag.
        state.boltImageTaskBuffer += char;
        // Check if the buffer now contains the closing tag.
        const bufferEnd = state.boltImageTaskBuffer.slice(-BOLT_IMAGE_TASK_TAG_CLOSE.length);
        if (bufferEnd === BOLT_IMAGE_TASK_TAG_CLOSE) {
          // If it does, process the closing tag and clear the buffer.
          this.processTag(messageId, state, BOLT_IMAGE_TASK_TAG_CLOSE);
        }
        continue; // Skip all other logic while in this mode.
      }

      // The original logic for finding '<', '>', and buffering tags.
      if (char === '<' && state.tagBuffer.length === 0) {
        if (currentText) {
          if (state.insideAction) {
            state.currentAction.content += currentText;
            this.checkForImmediateActionTrigger(messageId, state);
          } else {
            this.callbacks.onText?.(currentText);
          }
          currentText = '';
        }
        state.tagBuffer = '<';
      } else if (char === '>' && state.tagBuffer.length > 0) {
        state.tagBuffer += '>';
        this.processTag(messageId, state, state.tagBuffer);
        state.tagBuffer = '';
      } else if (state.tagBuffer.length > 0) {
        state.tagBuffer += char;
      } else {
        currentText += char;
      }
    }

    if (currentText) {
      if (state.insideAction) {
        state.currentAction.content += currentText;
        this.checkForImmediateActionTrigger(messageId, state);
      } else {
        this.callbacks.onText?.(currentText);
      }
    }
  }

  // Add this new method inside the StreamingMessageParser class
  private processTag(messageId: string, state: MessageState, tag: string) {
    if (tag === BOLT_IMAGE_TASK_TAG_OPEN) {
      console.log('🖼️ Entering image generation block.');
      state.insideBoltImageTask = true;
      state.boltImageTaskBuffer = ''; // Reset buffer
      return; // Don't process further
    }
    
    if (tag === BOLT_IMAGE_TASK_TAG_CLOSE && state.insideBoltImageTask) {
      console.log('🖼️ Closing image generation block. Parsing JSON...');
      
      // Remove the closing tag itself from the buffer before parsing
      const contentToParse = state.boltImageTaskBuffer.slice(0, -BOLT_IMAGE_TASK_TAG_CLOSE.length);
      
      try {
        // Clean markdown code fences before parsing JSON
        let cleanedContent = contentToParse.trim();
        
        // Remove markdown code block syntax
        // Remove opening code block (```json, ```)
        cleanedContent = cleanedContent.replace(/^```\w*\s*\n?/gm, '');
        
        // Remove closing code block
        cleanedContent = cleanedContent.replace(/\n?```\s*$/gm, '');
        
        // Remove any remaining backticks at start/end
        cleanedContent = cleanedContent.replace(/^`+|`+$/g, '');
        
        const jsonContent = JSON.parse(cleanedContent.trim());
        
        if (jsonContent.images && Array.isArray(jsonContent.images)) {
          const imageRequests: ImageGenerationRequest[] = jsonContent.images
            .filter((img: any) => img.local_path && img.description)
            .map((img: any) => ({
              localPath: img.local_path,
              description: img.description,
            }));
          
          if (imageRequests.length > 0) {
            console.log(`🖼️ Extracted image requests:`, imageRequests);
            this.callbacks.onImageGenerationRequest?.(imageRequests);
          }
        }
      } catch (error) {
        console.error('🖼️ Failed to parse boltImageTask JSON:', error);
        console.warn('🖼️ Buffer content:', contentToParse);
      }

      state.insideBoltImageTask = false;
      state.boltImageTaskBuffer = '';
      return;
    }
    
    // If we're inside an image block, don't process other tags.
    if (state.insideBoltImageTask) return;

    if (tag.startsWith(ARTIFACT_ACTION_TAG_OPEN)) {
      state.insideAction = true;
      const action = this.parseActionTag(tag, 0, tag.length - 1);
      state.currentAction = { ...action, content: '' }; // Set new action state
      this.callbacks.onActionOpen?.({ messageId, artifactId: state.currentArtifact?.id, action: state.currentAction as BoltAction });
    
    } else if (tag.startsWith(ARTIFACT_ACTION_TAG_CLOSE)) {
      if (state.insideAction) {
        let content = state.currentAction.content.trim();
        
        // Clean markdown code block syntax for both file and shell actions
        if (state.currentAction.type === 'shell') {
          content = this.cleanShellCommand(content);
        } else if (state.currentAction.type === 'file') {
          content = this.cleanFileContent(content);
        }
        
        this.callbacks.onActionClose?.({
          messageId,
          artifactId: state.currentArtifact?.id,
          action: {
            type: state.currentAction.type as 'file' | 'shell',
            filePath: state.currentAction.filePath,
            content: content,
          },
        });
        state.insideAction = false;
        state.currentAction = { content: '' }; // Reset state
      }
    } else if (tag.startsWith(ARTIFACT_TAG_OPEN)) {
      this.handleArtifactOpen(tag, state, messageId);
    } else if (tag.startsWith(ARTIFACT_TAG_CLOSE)) {
      this.handleArtifactClose(state, messageId);
    } else {
      // This wasn't a bolt tag, treat it as plain text.
      if (state.insideAction) {
        state.currentAction.content += tag;
      } else {
        this.callbacks.onText?.(tag);
      }
    }
  }

  reset() {
    this.messages.clear();
  }



  /**
   * Check if action content has reached threshold for immediate triggering
   */
  private checkForImmediateActionTrigger(messageId: string, state: MessageState) {
    if (!state.insideAction || !state.currentAction.type) {
      return;
    }

    const currentLength = state.currentAction.content.length;
    const lengthDiff = currentLength - state.lastContentLength;

    // Only trigger if we've accumulated enough new content
    if (lengthDiff >= state.contentUpdateThreshold) {
      state.lastContentLength = currentLength;
      
      // For file actions, trigger immediately when we have meaningful content
      if (state.currentAction.type === 'file' && state.currentAction.filePath && currentLength > 10) {
        // Clean file content before triggering update
        const cleanedContent = this.cleanFileContent(state.currentAction.content);
        
        this.callbacks.onActionContentUpdate?.({
          messageId,
          artifactId: state.currentArtifact?.id,
          action: {
            type: state.currentAction.type as 'file' | 'shell',
            filePath: state.currentAction.filePath,
            content: cleanedContent,
          },
        });
      }
      // For shell actions, trigger when we have a complete command line
      else if (state.currentAction.type === 'shell') {
        let content = state.currentAction.content.trim();
        const lines = content.split('\n');
        const lastLine = lines[lines.length - 1];
        
        // Trigger if we have a complete command (ends with newline or looks complete)
        if (content.includes('\n') || this.looksLikeCompleteCommand(lastLine)) {
          // Clean the shell command content before triggering
          content = this.cleanShellCommand(content);
          
          this.callbacks.onActionContentUpdate?.({
            messageId,
            artifactId: state.currentArtifact?.id,
            action: {
              type: state.currentAction.type as 'file' | 'shell',
              content: content,
            },
          });
        }
      }
    }
  }

  /**
   * Clean shell command content by removing markdown code block syntax
   */
  private cleanShellCommand(content: string): string {
    let cleaned = content.trim();
    
    // Remove markdown code block syntax
    // Remove opening code block (```bash, ```sh, ```shell, etc.)
    cleaned = cleaned.replace(/^```\w*\s*\n?/gm, '');
    
    // Remove closing code block
    cleaned = cleaned.replace(/\n?```\s*$/gm, '');
    
    // Remove any remaining backticks at start/end
    cleaned = cleaned.replace(/^`+|`+$/g, '');
    
    return cleaned.trim();
  }

  /**
   * Clean file content by removing markdown code block syntax
   */
  private cleanFileContent(content: string): string {
    let cleaned = content.trim();
    
    // Remove markdown code block syntax
    // Remove opening code block (```json, ```html, ```css, ```js, ```typescript, etc.)
    cleaned = cleaned.replace(/^```\w*\s*\n?/gm, '');
    
    // Remove closing code block
    cleaned = cleaned.replace(/\n?```\s*$/gm, '');
    
    // Remove any remaining backticks at start/end
    cleaned = cleaned.replace(/^`+|`+$/g, '');
    
    return cleaned.trim();
  }

  /**
   * Heuristic to determine if a shell command looks complete
   */
  private looksLikeCompleteCommand(command: string): boolean {
    const trimmed = command.trim();
    if (trimmed.length < 3) return false;
    
    // Common complete command patterns
    const completePatterns = [
      /^npm\s+(install|start|run|build|test)$/,
      /^yarn\s+(install|start|dev|build|test)$/,
      /^pnpm\s+(install|start|dev|build|test)$/,
      /^git\s+(add|commit|push|pull|clone).*$/,
      /^mkdir\s+.+$/,
      /^cd\s+.+$/,
      /^ls$/,
      /^pwd$/,
    ];
    
    return completePatterns.some(pattern => pattern.test(trimmed));
  }

  private handleArtifactOpen(tag: string, state: MessageState, messageId: string): void {
    const artifactTitle = this.extractAttribute(tag, 'title') || 'Untitled';
    const artifactId = this.extractAttribute(tag, 'id') || `artifact-${Date.now()}`;

    state.insideArtifact = true;
    const currentArtifact = {
      id: artifactId,
      title: artifactTitle,
    } satisfies BoltArtifactData;

    state.currentArtifact = currentArtifact;

    console.log('🎨 Opening artifact:', currentArtifact);
    this.callbacks.onArtifactOpen?.({
      messageId,
      id: currentArtifact.id,
      title: currentArtifact.title,
    });
   }

   private extractAttribute(tag: string, attributeName: string): string | undefined {
     const regex = new RegExp(`${attributeName}=["']([^"']*)["']`);
     const match = tag.match(regex);
     return match ? match[1] : undefined;
   }

   private parseActionTag(input: string, startIndex: number, endIndex: number): { type?: string; filePath?: string } {
      const tag = input.slice(startIndex, endIndex + 1);
      const type = this.extractAttribute(tag, 'type');
      const filePath = this.extractAttribute(tag, 'filePath');
      return { type, filePath };
    }

  private handleArtifactClose(state: MessageState, messageId: string): void {
    if (state.insideArtifact && state.currentArtifact) {
      console.log('🎨 Closing artifact:', state.currentArtifact.id);
      this.callbacks.onArtifactClose?.({
        messageId,
        id: state.currentArtifact.id,
        title: state.currentArtifact.title,
      });
      state.insideArtifact = false;
      state.currentArtifact = undefined;
    }
  }

  private extractAttribute(tag: string, attributeName: string): string | undefined {
    // Try double quotes first
    let match = tag.match(new RegExp(`${attributeName}="([^"]*)"`,'i'));
    if (match) {
      return match[1];
    }
    
    // Try single quotes
    match = tag.match(new RegExp(`${attributeName}='([^']*)'`,'i'));
    return match ? match[1] : undefined;
  }
}

/**
 * Creates an artifact element for the UI
 */
function createArtifactElement({ messageId }: ElementFactoryProps): string {
  const elementProps = [
    'class="__boltArtifact__"',
    `data-message-id="${messageId}"`
  ];

  return `<div ${elementProps.join(' ')}></div>`;
}