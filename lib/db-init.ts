import Dexie from 'dexie';
import db from './db';

// Helper function to migrate old lead communications to new format
async function migrateLeadCommunications() {
  try {
    // First check if we have any records in the lead_communications table
    const recordCount = await db.table('lead_communications').count();
    
    if (recordCount === 0) {
      console.log('No lead communications to migrate');
      return;
    }
    
    console.log(`Found ${recordCount} lead communications, checking for migration needs...`);
    
    // Get all records that need migration (ones with old fields)
    const recordsToMigrate = await db.table('lead_communications')
      .filter(comm => !!comm.leadId || !!comm.messageType || !!comm.sender || !!comm.recipient || !!comm.content || !!comm.rmEmail)
      .toArray();
    
    if (recordsToMigrate.length === 0) {
      console.log('No lead communications need migration');
      return;
    }
    
    console.log(`Migrating ${recordsToMigrate.length} lead communications...`);
    
    // Process each record
    for (const comm of recordsToMigrate) {
      const updates: any = {};
      
      // Map old field names to new field names
      if (comm.leadId) {
        updates.processedLeadId = comm.leadId;
        updates.leadId = null; // Mark for deletion
      }
      
      if (comm.messageType) {
        updates.communicationType = comm.messageType === 'assignment' ? 'LeadAssignmentEmail' : 'RMReply';
        updates.messageType = null; // Mark for deletion
      }
      
      if (comm.content) {
        updates.description = comm.content;
        updates.content = null; // Mark for deletion
      }
      
      if (comm.sender) {
        updates.senderType = comm.sender === 'system' ? 'System' : 'RM';
        updates.sender = null; // Mark for deletion
      }
      
      if (comm.recipient) {
        // Will be handled with rmEmail
        updates.recipient = null; // Mark for deletion
      }
      
      if (comm.rmEmail) {
        // If it's a system sender, the recipient is the RM
        if (updates.senderType === 'System' || comm.sender === 'system') {
          updates.recipientAdidOrEmail = comm.rmEmail;
          updates.senderAdidOrEmail = 'system@scfleadmgmt.com';
        } 
        // If it's an RM sender, the sender is the RM and recipient is the system
        else {
          updates.senderAdidOrEmail = comm.rmEmail;
          updates.recipientAdidOrEmail = 'system@scfleadmgmt.com';
        }
        
        updates.rmEmail = null; // Mark for deletion
      }
      
      // Set title if not present
      if (!comm.title) {
        updates.title = updates.communicationType === 'LeadAssignmentEmail' || comm.messageType === 'assignment' ? 
          'Lead Assignment Email Sent' : 'RM Reply Received';
      }
      
      // Initialize new fields with defaults if they don't exist
      if (!comm.attachments) updates.attachments = [];
      if (!comm.ccEmails) updates.ccEmails = [];
      
      // Update the record
      await db.table('lead_communications').update(comm.id, updates);
      console.log(`Migrated communication ${comm.id}`);
    }
    
    console.log('Lead communications migration complete');
  } catch (error) {
    console.error('Error migrating lead communications:', error);
  }
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Initialize all database schemas
export async function initializeDatabase() {
  // Skip initialization on server side
  if (!isBrowser) {
    console.log('Skipping database initialization on server side');
    return;
  }
  
  console.log('Initializing database schemas...');
  
  try {
    // Check the current database version
    const currentVersion = db.verno;
    console.log(`Current database version: ${currentVersion}`);
    
    // Open the database to ensure schema changes are applied
    await db.open();
    console.log(`Database opened. Current version: ${db.verno}`);
    
    // If we've upgraded to version 5, migrate the data
    if (db.verno >= 5) {
      console.log('Database schema is up to date (version 5 or higher)');
      
      // Migrate lead communications data if needed
      await migrateLeadCommunications();
      
      // Fix the schema error by ensuring the table uses correct indexes
      try {
        // Close and reopen the database with correct schema
        await db.close();
        await db.open();
        console.log('Database reopened with corrected schema');
      } catch (schemaError) {
        console.error('Schema error during reopen:', schemaError);
      }
    } else {
      console.warn(`Database schema is not at version 5 (current: ${db.verno}). Some features may not work correctly.`);
    }
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Export a function to be called on app startup
export default function setupDatabase() {
  // Only run in browser
  if (isBrowser) {
    initializeDatabase().catch(console.error);
  } else {
    console.log('Database setup skipped (server-side)');
  }
} 