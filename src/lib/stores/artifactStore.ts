import { atom, map } from 'nanostores';
import type { BoltArtifact, BoltAction } from '../runtime/types';

export interface ArtifactState {
  id: string;
  title: string;
  actions: BoltAction[];
  isVisible: boolean;
  isRunning: boolean;
  error?: string;
}

// Store for all artifacts
export const artifactsStore = map<Record<string, ArtifactState>>({});

// Currently selected artifact
export const selectedArtifactId = atom<string | null>(null);

// Artifact visibility
export const artifactPanelVisible = atom<boolean>(false);

/**
 * Add or update an artifact
 */
export function addArtifact(id: string, title: string) {
  const currentArtifacts = artifactsStore.get();
  
  artifactsStore.set({
    ...currentArtifacts,
    [id]: {
      id,
      title,
      actions: [],
      isVisible: true,
      isRunning: false,
    },
  });
  
  // Auto-select the new artifact
  selectedArtifactId.set(id);
  artifactPanelVisible.set(true);
}

/**
 * Add an action to an artifact
 */
export function addActionToArtifact(artifactId: string, action: BoltAction) {
  const currentArtifacts = artifactsStore.get();
  const artifact = currentArtifacts[artifactId];
  
  if (artifact) {
    artifactsStore.set({
      ...currentArtifacts,
      [artifactId]: {
        ...artifact,
        actions: [...artifact.actions, action],
        isRunning: true,
      },
    });
  }
}

/**
 * Update artifact running state
 */
export function setArtifactRunning(artifactId: string, isRunning: boolean) {
  const currentArtifacts = artifactsStore.get();
  const artifact = currentArtifacts[artifactId];
  
  if (artifact) {
    artifactsStore.set({
      ...currentArtifacts,
      [artifactId]: {
        ...artifact,
        isRunning,
      },
    });
  }
}

/**
 * Set artifact error
 */
export function setArtifactError(artifactId: string, error: string) {
  const currentArtifacts = artifactsStore.get();
  const artifact = currentArtifacts[artifactId];
  
  if (artifact) {
    artifactsStore.set({
      ...currentArtifacts,
      [artifactId]: {
        ...artifact,
        error,
        isRunning: false,
      },
    });
  }
}

/**
 * Remove an artifact
 */
export function removeArtifact(artifactId: string) {
  const currentArtifacts = artifactsStore.get();
  const { [artifactId]: removed, ...remaining } = currentArtifacts;
  
  artifactsStore.set(remaining);
  
  // If this was the selected artifact, clear selection
  if (selectedArtifactId.get() === artifactId) {
    selectedArtifactId.set(null);
  }
  
  // Hide panel if no artifacts remain
  if (Object.keys(remaining).length === 0) {
    artifactPanelVisible.set(false);
  }
}

/**
 * Select an artifact
 */
export function selectArtifact(artifactId: string | null) {
  selectedArtifactId.set(artifactId);
  if (artifactId) {
    artifactPanelVisible.set(true);
  }
}

/**
 * Toggle artifact panel visibility
 */
export function toggleArtifactPanel() {
  artifactPanelVisible.set(!artifactPanelVisible.get());
}

/**
 * Clear all artifacts
 */
export function clearArtifacts() {
  artifactsStore.set({});
  selectedArtifactId.set(null);
  artifactPanelVisible.set(false);
}