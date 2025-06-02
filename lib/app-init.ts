// lib/app-init.ts
// Initializes application services during startup

import { initializeDBIfEmpty } from './dbUtils';
import { initializeScheduledTasks } from './task-scheduler';

let initialized = false;

/**
 * Initialize all application services
 * Call this once at application startup
 */
export async function initializeApp() {
  if (initialized) {
    console.log('App already initialized, skipping');
    return;
  }
  
  console.log('Initializing application services...');
  
  try {
    // Initialize database if empty
    await initializeDBIfEmpty();
    console.log('Database initialization completed');
    
    // Initialize scheduled tasks
    if (typeof window === 'undefined') {
      // Only run on server-side
      initializeScheduledTasks();
      console.log('Scheduled tasks initialized');
    }
    
    initialized = true;
    console.log('Application initialization completed successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    throw error;
  }
}

/**
 * Cleanup application resources
 * Call this when shutting down the application
 */
export function cleanupApp() {
  if (!initialized) {
    return;
  }
  
  console.log('Cleaning up application resources...');
  
  // Clean up scheduled tasks
  if (typeof window === 'undefined') {
    const { stopAllScheduledTasks } = require('./task-scheduler');
    stopAllScheduledTasks();
    console.log('Stopped all scheduled tasks');
  }
  
  initialized = false;
  console.log('Application cleanup completed');
} 