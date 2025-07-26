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
  artifactId: string;
  messageId: string;
  actionId: string;
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
  actionId: number;
}

export class StreamingMessageParser {
  private messages = new Map<string, MessageState>();
  private callbacks: ParserCallbacks;

  constructor(callbacks: ParserCallbacks) {
    this.callbacks = callbacks;
  }

  parse(messageId: string, input: string): string {
    let state = this.messages.get(messageId);

    if (!state) {
      state = {
        position: 0,
        insideAction: false,
        insideArtifact: false,
        currentAction: { content: '' },
        actionId: 0,
      };

      this.messages.set(messageId, state);
    }

    let output = '';
    let i = state.position;
    let textBuffer = '';

    const flushTextBuffer = () => {
      if (textBuffer.trim()) {
        this.callbacks.onText?.(textBuffer.trim());
        textBuffer = '';
      }
    };

    while (i < input.length) {
      if (state.insideArtifact) {
        const currentArtifact = state.currentArtifact;

        if (currentArtifact === undefined) {
          logger.error('Artifact not initialized');
          break;
        }

        if (state.insideAction) {
          const closeIndex = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, i);
          const currentAction = state.currentAction;

          if (closeIndex !== -1) {
            currentAction.content += input.slice(i, closeIndex);

            this.callbacks.onActionClose?.({
              messageId,
              type: currentAction.type!,
              filePath: currentAction.filePath,
              content: currentAction.content.trim(),
            });

            state.insideAction = false;
            state.currentAction = { content: '' };

            i = closeIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
          } else {
            currentAction.content += input.slice(i);
            break;
          }
        } else {
          const actionOpenIndex = input.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);
          const artifactCloseIndex = input.indexOf(ARTIFACT_TAG_CLOSE, i);

          if (actionOpenIndex !== -1 && (artifactCloseIndex === -1 || actionOpenIndex < artifactCloseIndex)) {
            // Process text before action
            const textBeforeAction = input.slice(i, actionOpenIndex);
            if (textBeforeAction.trim()) {
              this.callbacks.onText?.(textBeforeAction.trim());
            }

            const actionEndIndex = input.indexOf('>', actionOpenIndex);

            if (actionEndIndex !== -1) {
              state.insideAction = true;
              state.currentAction = this.parseActionTag(input, actionOpenIndex, actionEndIndex);

              this.callbacks.onActionOpen?.({
                messageId,
                type: state.currentAction.type!,
                filePath: state.currentAction.filePath,
              });

              i = actionEndIndex + 1;
            } else {
              break;
            }
          } else if (artifactCloseIndex !== -1) {
            this.callbacks.onArtifactClose?.({
              messageId,
              id: currentArtifact.id,
            });

            state.insideArtifact = false;
            state.currentArtifact = undefined;

            i = artifactCloseIndex + ARTIFACT_TAG_CLOSE.length;
          } else {
            break;
          }
        }
      } else {
        // Check for artifact start
        const artifactOpenIndex = input.indexOf(ARTIFACT_TAG_OPEN, i);
        // Check for standalone action
        const actionOpenIndex = input.indexOf(ARTIFACT_ACTION_TAG_OPEN, i);

        let nextTagIndex = -1;
        let isArtifact = false;

        if (artifactOpenIndex !== -1 && (actionOpenIndex === -1 || artifactOpenIndex < actionOpenIndex)) {
          nextTagIndex = artifactOpenIndex;
          isArtifact = true;
        } else if (actionOpenIndex !== -1) {
          nextTagIndex = actionOpenIndex;
          isArtifact = false;
        }

        if (nextTagIndex !== -1) {
          // Process text before tag
          const textBeforeTag = input.slice(i, nextTagIndex);
          if (textBeforeTag.trim()) {
            this.callbacks.onText?.(textBeforeTag.trim());
          }

          if (isArtifact) {
            const openTagEnd = input.indexOf('>', nextTagIndex);

            if (openTagEnd !== -1) {
              const artifactTag = input.slice(nextTagIndex, openTagEnd + 1);
              const artifactTitle = this.extractAttribute(artifactTag, 'title') || 'Untitled';
              const artifactId = this.extractAttribute(artifactTag, 'id') || `artifact-${Date.now()}`;

              state.insideArtifact = true;
              const currentArtifact = {
                id: artifactId,
                title: artifactTitle,
              } satisfies BoltArtifactData;

              state.currentArtifact = currentArtifact;

              this.callbacks.onArtifactOpen?.({
                messageId,
                id: currentArtifact.id,
                title: currentArtifact.title,
              });

              i = openTagEnd + 1;
            } else {
              break;
            }
          } else {
            // Handle standalone action
            const actionEndIndex = input.indexOf('>', nextTagIndex);
            const actionCloseIndex = input.indexOf(ARTIFACT_ACTION_TAG_CLOSE, nextTagIndex);

            if (actionEndIndex !== -1 && actionCloseIndex !== -1) {
              const action = this.parseActionTag(input, nextTagIndex, actionEndIndex);
              const actionContent = input.slice(actionEndIndex + 1, actionCloseIndex);

              this.callbacks.onActionOpen?.({
                messageId,
                type: action.type!,
                filePath: action.filePath,
              });

              this.callbacks.onActionClose?.({
                messageId,
                type: action.type!,
                filePath: action.filePath,
                content: actionContent.trim(),
              });

              i = actionCloseIndex + ARTIFACT_ACTION_TAG_CLOSE.length;
            } else {
              break;
            }
          }
        } else {
          // No more tags, process remaining text
          const remainingText = input.slice(i);
          if (remainingText.trim()) {
            this.callbacks.onText?.(remainingText.trim());
          }
          i = input.length;
        }
      }
    }

    state.position = i;
    return output;
  }
  reset() {
    this.messages.clear();
  }

  private parseActionTag(input: string, actionOpenIndex: number, actionEndIndex: number) {
    const actionTag = input.slice(actionOpenIndex, actionEndIndex + 1);
    const actionType = this.extractAttribute(actionTag, 'type');
    
    const actionAttributes = {
      type: actionType,
      content: '',
    } as any;

    if (actionType === 'file') {
      const filePath = this.extractAttribute(actionTag, 'filePath');
      if (filePath) {
        actionAttributes.filePath = filePath;
      }
    } else if (actionType !== 'shell') {
      logger.warn(`Unknown action type '${actionType}'`);
    }

    return actionAttributes;
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