import type { BoltAction } from './types';
import { createScopedLogger } from '@/lib/utils/logger';

const ARTIFACT_TAG_OPEN = '<boltArtifact';
const ARTIFACT_TAG_CLOSE = '</boltArtifact>';
const ARTIFACT_ACTION_TAG_OPEN = '<boltAction';
const ARTIFACT_ACTION_TAG_CLOSE = '</boltAction>';

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

export interface ParserCallbacks {
  onArtifactOpen?: ArtifactCallback;
  onArtifactClose?: ArtifactCallback;
  onActionOpen?: ActionCallback;
  onActionClose?: ActionCallback;
  onText?: (text: string) => void;
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
  currentArtifact?: BoltArtifactData;
  currentAction: { content: string; type?: string; filePath?: string };
  tagBuffer: string;
  actionId: number;
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
        currentAction: { content: '' },
        tagBuffer: '',
        actionId: 0,
      };
      this.messages.set(messageId, state);
    }
    this.processChunk(messageId, state, chunk);
  }

  private processChunk(messageId: string, state: MessageState, chunk: string) {
    let currentContent = state.tagBuffer + chunk;
    state.tagBuffer = '';

    while (currentContent.length > 0) {
      if (state.insideAction) {
        const endActionIndex = currentContent.indexOf(ARTIFACT_ACTION_TAG_CLOSE);
        if (endActionIndex !== -1) {
          const content = currentContent.substring(0, endActionIndex);
          state.currentAction.content += content;
          
          this.callbacks.onActionClose?.({
            messageId,
            artifactId: state.currentArtifact?.id,
            action: {
              type: state.currentAction.type as 'file' | 'shell',
              filePath: state.currentAction.filePath,
              content: state.currentAction.content,
            },
          });

          state.insideAction = false;
          state.currentAction = { content: '' };
          currentContent = currentContent.substring(endActionIndex + ARTIFACT_ACTION_TAG_CLOSE.length);
        } else {
          state.currentAction.content += currentContent;
          currentContent = ''; // All of chunk is action content
        }
      } else { // Not inside an action's content
        const tagStartIndex = currentContent.indexOf('<');

        if (tagStartIndex === -1) { // No tags in the rest of the content
          if (currentContent) this.callbacks.onText?.(currentContent);
          break;
        }

        // Text before the tag
        const text = currentContent.substring(0, tagStartIndex);
        if (text) {
          this.callbacks.onText?.(text);
        }

        const tagEndIndex = currentContent.indexOf('>', tagStartIndex);

        if (tagEndIndex === -1) { // Incomplete tag at the end
          state.tagBuffer = currentContent.substring(tagStartIndex);
          break;
        }

        // We have a complete tag
        const tag = currentContent.substring(tagStartIndex, tagEndIndex + 1);
        
        if (tag.startsWith(ARTIFACT_ACTION_TAG_OPEN)) {
          state.insideAction = true;
          const action = this.parseActionTag(tag, 0, tag.length - 1);
          state.currentAction = { ...action, content: '' };
          this.callbacks.onActionOpen?.({ messageId, artifactId: state.currentArtifact?.id, action: state.currentAction as BoltAction });
        } else if (tag.startsWith(ARTIFACT_TAG_OPEN)) {
          this.handleArtifactOpen(tag, state, messageId);
        } else if (tag.startsWith(ARTIFACT_TAG_CLOSE)) {
          this.handleArtifactClose(state, messageId);
        }
        currentContent = currentContent.substring(tagEndIndex + 1);
      }
    }
  }
  reset() {
    this.messages.clear();
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