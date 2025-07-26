import { map } from 'nanostores';

export interface WorkbenchState {
  terminalOutput: string;
  previewUrl: string | null;
  isTerminalVisible: boolean;
  activeTab: 'files' | 'preview' | 'terminal';
  isWebContainerReady: boolean;
  runningCommands: string[];
}

export const workbenchStore = map<WorkbenchState>({
  terminalOutput: '',
  previewUrl: null,
  isTerminalVisible: false,
  activeTab: 'files',
  isWebContainerReady: false,
  runningCommands: [],
});

// Actions
export function appendTerminalOutput(data: string) {
  const currentOutput = workbenchStore.get().terminalOutput;
  workbenchStore.setKey('terminalOutput', currentOutput + data);
}

export function clearTerminalOutput() {
  workbenchStore.setKey('terminalOutput', '');
}

export function setPreviewUrl(url: string | null) {
  workbenchStore.setKey('previewUrl', url);
}

export function toggleTerminal() {
  const isVisible = workbenchStore.get().isTerminalVisible;
  workbenchStore.setKey('isTerminalVisible', !isVisible);
}

export function setActiveTab(tab: 'files' | 'preview' | 'terminal') {
  workbenchStore.setKey('activeTab', tab);
}

export function setWebContainerReady(ready: boolean) {
  workbenchStore.setKey('isWebContainerReady', ready);
}

export function addRunningCommand(command: string) {
  const currentCommands = workbenchStore.get().runningCommands;
  workbenchStore.setKey('runningCommands', [...currentCommands, command]);
}

export function removeRunningCommand(command: string) {
  const currentCommands = workbenchStore.get().runningCommands;
  workbenchStore.setKey('runningCommands', currentCommands.filter(cmd => cmd !== command));
}

export function clearRunningCommands() {
  workbenchStore.setKey('runningCommands', []);
}