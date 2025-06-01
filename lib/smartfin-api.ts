/**
 * Smartfin API Integration - Simulation Functions
 * 
 * This file contains functions that simulate the Smartfin API integration.
 * In a real implementation, these would make actual API calls to the Smartfin service.
 */

import { ProcessedLead } from './db';

/**
 * Simulates uploading a lead to Smartfin
 * @param lead The lead to upload
 * @returns Result of the Smartfin upload operation
 */
export async function uploadLeadToSmartfin(lead: ProcessedLead): Promise<{
  success: boolean;
  smartfinDealerId?: string;
  errorCode?: string;
  errorDescription?: string;
}> {
  // Simulate API call with 80% success rate
  const isSuccess = Math.random() < 0.8;
  
  if (isSuccess) {
    // Generate a Smartfin Dealer ID
    const smartfinDealerId = `SMARTFIN_DEALER_${lead.uploadBatchId}_${lead.originalRowNumber}`;
    
    // Simulate a delay for the API call (100-500ms)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    return {
      success: true,
      smartfinDealerId
    };
  } else {
    // Simulate various error scenarios
    const errorCodes = ["SF001", "SF002", "SF003", "SF004"];
    const errorDescriptions = [
      "Dealer already exists in Smartfin",
      "Invalid dealer data format",
      "Smartfin API connection error",
      "Dealer verification failed"
    ];
    
    const randomIndex = Math.floor(Math.random() * errorCodes.length);
    
    // Simulate a delay for the API call (100-500ms)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    return {
      success: false,
      errorCode: errorCodes[randomIndex],
      errorDescription: errorDescriptions[randomIndex]
    };
  }
}

/**
 * Get Smartfin dealer details - simulated
 * @param dealerId The Smartfin dealer ID
 * @returns Simulated dealer details or error
 */
export async function getSmartfinDealerDetails(dealerId: string): Promise<{
  success: boolean;
  data?: {
    dealerId: string;
    name: string;
    status: string;
    createdAt: string;
  };
  errorCode?: string;
  errorDescription?: string;
}> {
  // Simulate API call with 90% success rate
  const isSuccess = Math.random() < 0.9;
  
  if (isSuccess) {
    // Simulate a delay for the API call (100-300ms)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      success: true,
      data: {
        dealerId,
        name: `Dealer ${dealerId.slice(-5)}`,
        status: "Active",
        createdAt: new Date().toISOString()
      }
    };
  } else {
    // Simulate error scenario
    return {
      success: false,
      errorCode: "SF101",
      errorDescription: "Dealer not found in Smartfin"
    };
  }
} 