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

// Better browser detection with fallbacks
const isBrowser = () => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.document !== 'undefined' && 
           typeof window.indexedDB !== 'undefined';
  } catch (e) {
    return false;
  }
};

// Add a schema correction function after the migrateLeadCommunications function

/**
 * Fix schema issues with lead_communications table
 */
async function fixLeadCommunicationsSchema() {
  try {
    // Check if the table exists
    if (!db.tables.some(table => table.name === 'lead_communications')) {
      console.log('lead_communications table does not exist, nothing to fix');
      return;
    }
    
    console.log('Checking lead_communications table schema...');
    
    // First, get all existing communications to backup
    const existingComms = await db.lead_communications.toArray();
    console.log(`Backing up ${existingComms.length} communications before schema fix`);
    
    // If we have a lot of records, process in batches
    const batchSize = 100;
    const commsCopy = [...existingComms];
    
    // Close the database
    await db.close();
    
    // Delete and recreate the database with correct schema
    // Note: This is a drastic approach but effective for fixing schema issues
    const dbName = 'SCFLeadManagement';
    
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = window.indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onerror = (event) => {
        console.error('Error deleting database:', event);
        reject(new Error('Failed to delete database for schema correction'));
      };
      
      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully for schema correction');
        resolve();
      };
    });
    
    // Reopen the database with the corrected schema
    await db.open();
    console.log('Database reopened with fresh schema');
    
    // Restore the communications data in batches
    if (commsCopy.length > 0) {
      console.log(`Restoring ${commsCopy.length} communications...`);
      
      for (let i = 0; i < commsCopy.length; i += batchSize) {
        const batch = commsCopy.slice(i, i + batchSize);
        await db.lead_communications.bulkAdd(batch);
        console.log(`Restored batch ${i/batchSize + 1} of ${Math.ceil(commsCopy.length/batchSize)}`);
      }
      
      console.log('Communications restored successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error fixing lead_communications schema:', error);
    return false;
  }
}

// Update the initializeDatabase function to remove AI initialization
export async function initializeDatabase() {
  // Check if we're in a browser environment with indexedDB support
  if (!isBrowser()) {
    console.log('Skipping database initialization on server side');
    return;
  }
  
  // Check if IndexedDB is available
  if (typeof window.indexedDB === 'undefined') {
    console.error('IndexedDB not supported in this browser');
    throw new Error('IndexedDB not supported in this browser');
  }
  
  // Check if IDB is blocked
  const dbOpenRequest = window.indexedDB.open('TestDB', 1);
  
  await new Promise<void>((resolve, reject) => {
    dbOpenRequest.onerror = (event) => {
      console.error('IndexedDB access is blocked or restricted:', event);
      reject(new Error('IndexedDB access is blocked or restricted. Please check your browser privacy settings.'));
    };
    
    dbOpenRequest.onsuccess = () => {
      // Close the test database
      dbOpenRequest.result.close();
      // Delete the test database
      window.indexedDB.deleteDatabase('TestDB');
      resolve();
    };
  });
  
  console.log('Initializing database schemas...');
  
  try {
    // Check the current database version
    const currentVersion = db.verno;
    console.log(`Current database version: ${currentVersion}`);
    
    // Open the database to ensure schema changes are applied
    await db.open();
    console.log(`Database opened. Current version: ${db.verno}`);
    
    // Fix lead_communications schema issues
    const schemaFixed = await fixLeadCommunicationsSchema();
    if (schemaFixed) {
      console.log('Lead communications schema fixed successfully');
    }
    
    // If we've upgraded to version 5 or higher, migrate the data
    if (db.verno >= 5) {
      console.log('Database schema is up to date (version 5 or higher)');
      
      // Migrate lead communications data if needed
      await migrateLeadCommunications();
    } else {
      console.warn(`Database schema is not at version 5 (current: ${db.verno}). Some features may not work correctly.`);
    }
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error; // Rethrow to allow the caller to handle it
  }
}

// Wrap database operations in error handlers
export function safeDbOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>(async (resolve) => {
    if (!isBrowser()) {
      resolve(fallback);
      return;
    }
    
    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      console.error('Database operation failed:', error);
      resolve(fallback);
    }
  });
}

// Export a function to be called on app startup
export default function setupDatabase() {
  // Safely initialize the database
  if (isBrowser()) {
    // Use setTimeout to defer initialization until after the component is mounted
    setTimeout(() => {
      initializeDatabase().catch(error => {
        console.error('Database initialization failed:', error);
      });
    }, 0);
  } else {
    console.log('Database setup skipped (server-side)');
  }
} 