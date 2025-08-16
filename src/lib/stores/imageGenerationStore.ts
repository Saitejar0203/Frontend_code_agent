import { atom } from 'nanostores';

export type ImageGenerationStatus = 'idle' | 'generating' | 'completed';

export interface ImageGenerationState {
  status: ImageGenerationStatus;
  totalImages: number;
}

// Create the store with initial state
export const imageGenerationStore = atom<ImageGenerationState>({
  status: 'idle',
  totalImages: 0,
});

// Action functions to update the store
export function startImageGeneration(totalImages: number) {
  imageGenerationStore.set({
    status: 'generating',
    totalImages,
  });
}

export function completeImageGeneration() {
  const currentState = imageGenerationStore.get();
  imageGenerationStore.set({
    ...currentState,
    status: 'completed',
  });
}

export function resetImageGenerationStatus() {
  imageGenerationStore.set({
    status: 'idle',
    totalImages: 0,
  });
}

// Convenience getter functions
export function getImageGenerationStatus(): ImageGenerationStatus {
  return imageGenerationStore.get().status;
}

export function getTotalImages(): number {
  return imageGenerationStore.get().totalImages;
}