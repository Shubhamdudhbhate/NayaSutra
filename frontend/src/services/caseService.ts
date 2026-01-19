// src/services/caseService.ts
import { supabase } from '@/integrations/supabase/client';
import { CaseFile, CaseStatus } from '@/types/case';

/**
 * Creates a new case and stores it in Supabase
 * @param data Case data without auto-generated fields
 * @returns The created case with all required fields
 * @throws Error if case creation fails
 */
export const createCase = async (
  data: Omit<CaseFile, 'id' | 'createdAt' | 'updatedAt' | 'evidenceCount' | 'status'>
): Promise<CaseFile> => {
  try {
    // Validate required fields
    if (!data.caseNumber || !data.title || !data.courtName) {
      throw new Error('Missing required case fields');
    }

    const newCaseData = {
      case_number: data.caseNumber,
      unique_identifier: data.caseNumber,
      title: data.title,
      description: data.description || null,
      case_type: (data.caseType === 'civil' || data.caseType === 'criminal' ? data.caseType : 'civil') as 'civil' | 'criminal',
      status: 'pending' as const,
      party_a_name: data.partyA || '',
      party_b_name: data.partyB || '',
      court_name: data.courtName || null,
    };

    const { data: insertedCase, error } = await supabase
      .from('cases')
      .insert([newCaseData])
      .select()
      .single();

    if (error) {
      console.error('Error creating case in Supabase:', error);
      throw new Error(`Failed to create case: ${error.message}`);
    }

    // Map from database format to frontend format
    const result: CaseFile = {
      id: insertedCase.id,
      caseNumber: insertedCase.case_number,
      title: insertedCase.title,
      description: insertedCase.description || '',
      caseType: insertedCase.case_type,
      courtName: insertedCase.court_name || undefined,
      partyA: insertedCase.party_a_name,
      partyB: insertedCase.party_b_name,
      status: 'open' as CaseStatus,
      evidenceCount: 0,
      createdAt: insertedCase.created_at,
      updatedAt: insertedCase.updated_at,
    };

    return result;
  } catch (error) {
    console.error('Error creating case:', error);
    throw error;
  }
};

/**
 * Retrieves all cases from Supabase
 * @returns Array of cases
 */
export const getCases = async (): Promise<CaseFile[]> => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases from Supabase:', error);
      return [];
    }

    // Map from database format to frontend format
    return (data || []).map(c => ({
      id: c.id,
      caseNumber: c.case_number,
      title: c.title,
      description: c.description || '',
      caseType: c.case_type,
      courtName: c.court_name || undefined,
      partyA: c.party_a_name,
      partyB: c.party_b_name,
      status: 'open' as CaseStatus,
      evidenceCount: 0,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch (error) {
    console.error('Error retrieving cases:', error);
    return [];
  }
};

/**
 * Retrieves a single case by ID
 * @param id Case ID to retrieve
 * @returns The found case or undefined if not found
 */
export const getCaseById = async (id: string): Promise<CaseFile | undefined> => {
  if (!id) {
    throw new Error('Case ID is required');
  }
  
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error(`Error retrieving case ${id}:`, error);
      return undefined;
    }

    // Map from database format to frontend format
    return {
      id: data.id,
      caseNumber: data.case_number,
      title: data.title,
      description: data.description || '',
      caseType: data.case_type,
      courtName: data.court_name || undefined,
      partyA: data.party_a_name,
      partyB: data.party_b_name,
      status: 'open' as CaseStatus,
      evidenceCount: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error(`Error retrieving case ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing case
 * @param id Case ID to update
 * @param updates Partial case data to update
 * @returns The updated case
 */
export const updateCase = async (
  id: string,
  updates: Partial<Omit<CaseFile, 'id' | 'createdAt' | 'evidenceCount'>>
): Promise<CaseFile> => {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.caseNumber) updateData.case_number = updates.caseNumber;
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.caseType) updateData.case_type = updates.caseType;
    if (updates.courtName !== undefined) updateData.court_name = updates.courtName;
    if (updates.partyA) updateData.party_a_name = updates.partyA;
    if (updates.partyB) updateData.party_b_name = updates.partyB;

    const { data, error } = await supabase
      .from('cases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error(`Error updating case ${id}:`, error);
      throw new Error(`Failed to update case: ${error?.message}`);
    }

    // Map from database format to frontend format
    return {
      id: data.id,
      caseNumber: data.case_number,
      title: data.title,
      description: data.description || '',
      caseType: data.case_type,
      courtName: data.court_name || undefined,
      partyA: data.party_a_name,
      partyB: data.party_b_name,
      status: 'open' as CaseStatus,
      evidenceCount: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error(`Error updating case ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a case by ID
 * @param id Case ID to delete
 * @returns true if deletion was successful
 */
export const deleteCase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting case ${id}:`, error);
      throw new Error(`Failed to delete case: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error(`Error deleting case ${id}:`, error);
    throw error;
  }
};