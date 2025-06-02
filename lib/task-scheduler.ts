// lib/task-scheduler.ts
// This file sets up scheduled tasks for the application

import { schedule } from 'node-schedule';
import { runEscalationProcess } from './lead-escalation';

let scheduledJobs: Record<string, any> = {};

/**
 * Initialize all scheduled tasks
 */
export function initializeScheduledTasks() {
  console.log('Initializing scheduled tasks...');
  
  // Stop any existing jobs
  stopAllScheduledTasks();
  
  // Schedule lead escalation process to run daily at 1:00 AM
  scheduledJobs['leadEscalation'] = schedule.scheduleJob('0 1 * * *', async () => {
    console.log('Running scheduled lead escalation process...');
    try {
      const result = await runEscalationProcess();
      console.log('Scheduled lead escalation completed:', result);
    } catch (error) {
      console.error('Error in scheduled lead escalation:', error);
    }
  });
  
  console.log('Scheduled tasks initialized');
}

/**
 * Stop all scheduled tasks
 */
export function stopAllScheduledTasks() {
  Object.keys(scheduledJobs).forEach(jobName => {
    if (scheduledJobs[jobName]) {
      scheduledJobs[jobName].cancel();
      console.log(`Stopped scheduled task: ${jobName}`);
    }
  });
  
  scheduledJobs = {};
}

/**
 * Run the lead escalation process immediately (for testing or manual triggers)
 */
export async function runLeadEscalationManually(): Promise<{
  processed: number;
  escalated: number;
  reminded: number;
  errors: number;
}> {
  console.log('Manually triggering lead escalation process...');
  try {
    const result = await runEscalationProcess();
    console.log('Manual lead escalation completed:', result);
    return result;
  } catch (error) {
    console.error('Error in manual lead escalation:', error);
    throw error;
  }
} 