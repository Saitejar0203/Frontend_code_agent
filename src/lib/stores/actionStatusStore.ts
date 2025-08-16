import { map } from 'nanostores';
import type { ActionState } from '@/lib/runtime/ActionRunner';

// This store will hold the real-time status of all actions.
// The key is the actionId, and the value is its state.
export const actionStatusStore = map<Record<string, ActionState>>({});

// Helper function to update the status of a single action
export function updateActionStatus(actionId: string, newStatus: Partial<ActionState>) {
  const existingStatus = actionStatusStore.get()[actionId];
  if (existingStatus) {
    actionStatusStore.setKey(actionId, { ...existingStatus, ...newStatus });
  }
}

// Helper function to add a new action to the store
export function addActionStatus(actionId: string, actionState: ActionState) {
  actionStatusStore.setKey(actionId, actionState);
}

// Helper function to remove an action from the store
export function removeActionStatus(actionId: string) {
  const currentStore = actionStatusStore.get();
  const { [actionId]: removed, ...rest } = currentStore;
  actionStatusStore.set(rest);
}

// Helper function to clear all action statuses
export function clearAllActionStatuses() {
  actionStatusStore.set({});
}

// Helper function to get a specific action status
export function getActionStatus(actionId: string): ActionState | undefined {
  return actionStatusStore.get()[actionId];
}

// Helper function to get all action statuses as an array
export function getAllActionStatuses(): ActionState[] {
  return Object.values(actionStatusStore.get());
}