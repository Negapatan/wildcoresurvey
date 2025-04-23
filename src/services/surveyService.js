import { collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { addDoc } from 'firebase/firestore';

export const submitStudentSurvey = async (surveyData, customDocumentId = null) => {
  try {
    const { 
      workAttitudeRatings, 
      workPerformanceRatings, 
      studentName,
      studentId,
      companyName,
      program,
      schoolYear,
      semester,
      section,
      college,
      evaluationMode,
      accessKey // Access key used for this submission
    } = surveyData;
    
    // Ensure section has a value even if it's not provided
    const sectionValue = section || 'OJT';
    const departmentValue = college || 'CICS';
    // Default evaluation mode to FINAL if not provided
    const evalMode = evaluationMode || 'FINAL';
    
    // Calculate total scores
    const workAttitudeScore = Object.values(workAttitudeRatings).reduce((sum, rating) => sum + rating, 0);
    const workPerformanceScore = Object.values(workPerformanceRatings).reduce((sum, rating) => sum + (rating * 2), 0);

    const docData = {
      // Survey Information
      surveyType: 'student',
      studentName,
      studentId,
      companyName,
      program,
      schoolYear,
      semester,
      section: sectionValue, // Use the ensured section value
      college: departmentValue, // Make college optional, default to 'CICS'
      evaluationMode: evalMode, // Include evaluation mode in the document
      accessKey: accessKey || '', // Include access key if available
      accessKeyUsed: !!accessKey, // Flag to indicate an access key was used
      
      // Ratings Details
      workAttitude: {
        ratings: workAttitudeRatings,
        totalScore: workAttitudeScore,
        maxPossibleScore: Object.keys(workAttitudeRatings).length * 5
      },
      workPerformance: {
        ratings: workPerformanceRatings,
        totalScore: workPerformanceScore,
        maxPossibleScore: Object.keys(workPerformanceRatings).length * 10
      },

      // Metadata
      totalScore: workAttitudeScore + workPerformanceScore,
      maxPossibleScore: (Object.keys(workAttitudeRatings).length * 5) + 
                       (Object.keys(workPerformanceRatings).length * 10),
      submittedAt: serverTimestamp(),
      submittedBy: 'anonymous',
      status: 'submitted'
    };

    // Validate required fields before submission
    const requiredFields = ['studentName', 'companyName', 'program', 'schoolYear', 'semester', 'section'];
    const missingFields = requiredFields.filter(field => !docData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('Submitting survey with data:', docData);

    // Generate a unique document ID for this specific submission or use the custom one provided
    let documentId = customDocumentId;
    if (!documentId) {
      if (studentName && companyName) {
        // Normalize the student name and company name for consistent IDs
        const normalizedName = studentName.trim().toLowerCase().replace(/\s+/g, '_');
        const normalizedCompany = companyName.trim().toLowerCase().replace(/\s+/g, '_');
        documentId = `${normalizedName}_${normalizedCompany}_${Date.now()}`; // Adding timestamp to ensure uniqueness
      } else {
        documentId = `survey_${Date.now()}`;
      }
    }

    // Track successful operations
    const successfulOperations = [];
    
    try {
      // PRIMARY STRUCTURE: studentSurveys_[period] collection
      // Use a separate collection for each period
      const studentSurveysCollectionName = `studentSurveys_${evalMode.toLowerCase()}`;
      const studentSurveysRef = collection(db, studentSurveysCollectionName);
      
      // Add document directly to the period-specific collection
      await setDoc(doc(studentSurveysRef, documentId), docData);
      
      successfulOperations.push('primary_structure');
      console.log(`Successfully saved to ${studentSurveysCollectionName}/${documentId}`);
    } catch (error) {
      console.warn(`Error saving to primary structure ${evalMode} collection:`, error.message);
    }
    
    // Also try saving to a combined collection with evaluation mode as a field
    try {
      // Save to a combined collection with evaluationMode as a field
      const combinedCollectionRef = collection(db, 'studentSurveys');
      await setDoc(doc(combinedCollectionRef, documentId), docData);
      
      successfulOperations.push('combined_collection');
      console.log(`Successfully saved to studentSurveys/${documentId} with evaluationMode field`);
    } catch (error) {
      console.warn('Error saving to combined collection:', error.message);
    }
    
    // Try to save to hierarchical structure as well
    try {
      // HIERARCHICAL STRUCTURE - try this as secondary storage
      // 1. Get or create department document
      const departmentRef = doc(db, 'departments', departmentValue);
      
      // 2. Create reference to the sections subcollection within the department
      const sectionsRef = collection(departmentRef, 'sections');
      
      // 3. Get or create the specific section document within the department
      const sectionDocRef = doc(sectionsRef, sectionValue);
      
      // 4. Create reference to the students subcollection within the section
      const studentsRef = collection(sectionDocRef, 'students');
      
      // 5. Use the studentId as the document ID (or create a normalized student name if ID not available)
      const normalizedStudentId = studentId 
        ? studentId.replace(/[^a-zA-Z0-9]/g, '_')
        : studentName.trim().toLowerCase().replace(/\s+/g, '_');
      
      // 6. Create reference to the specific student document
      const studentDocRef = doc(studentsRef, normalizedStudentId);
      
      // 7. Create reference to the evaluations subcollection (with period in the name)
      const evaluationsRef = collection(studentDocRef, `evaluations_${evalMode.toLowerCase()}`);
      
      // 8. Add the document with evaluation mode as a field
      const surveyDocRef = doc(evaluationsRef, documentId);
      await setDoc(surveyDocRef, docData);
      
      successfulOperations.push('hierarchical');
      console.log('Successfully saved to hierarchical structure');
    } catch (error) {
      console.warn('Error saving to hierarchical structure:', error.message);
    }

    // If we saved to at least one location, consider it a success
    if (successfulOperations.length > 0) {
      console.log('Survey submitted successfully with ID:', documentId);
      return documentId;
    } else {
      // If no save operations succeeded, try one more fallback approach
      try {
        // Fallback to original flat structure
        const legacyRef = collection(db, 'studentSurveys_legacy');
        const legacyDocRef = doc(legacyRef, documentId);
        await setDoc(legacyDocRef, docData);
        
        console.log('Survey submitted successfully with fallback method. ID:', documentId);
        return documentId;
      } catch (finalError) {
        console.error('All save attempts failed. Final error:', finalError);
        throw new Error('Unable to save survey to any location. Please check network connection and try again.');
      }
    }
  } catch (error) {
    console.error('Error submitting student survey:', error);
    throw error;
  }
};

// Function to submit company survey (Interview and Assessment)
export const submitCompanySurvey = async (surveyData) => {
  try {
    // Log input data without sensitive info
    console.log('submitCompanySurvey called with evaluationPeriod:', surveyData.evaluationPeriod);
    
    // Add a timestamp and evaluation information
    const dataWithTimestamp = {
      ...surveyData,
      submittedAt: serverTimestamp(),
      type: 'assessment',
      evaluationPeriod: surveyData.evaluationPeriod || 'MIDTERMS'
    };

    // Save to Firestore - use different collection based on evaluation period
    const evaluationPeriod = dataWithTimestamp.evaluationPeriod.toLowerCase();
    console.log('Normalized evaluation period:', evaluationPeriod);
    
    const collectionName = `OJTadvisers_${evaluationPeriod}`;
    
    console.log(`Attempting to write to collection: ${collectionName}`);
    
    // Try multiple approaches to write the data
    try {
      // First attempt to write to period-specific collection
      const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
    console.log(`Document written with ID: ${docRef.id} to ${collectionName}`);
    
    // Also save to the main collection for backwards compatibility
      try {
        await addDoc(collection(db, 'OJTadvisers'), dataWithTimestamp);
        console.log(`Successfully saved to main OJTadvisers collection as well`);
      } catch (mainCollectionError) {
        console.warn('Failed to save to main collection, but period-specific save succeeded:', mainCollectionError);
      }
    
    return { success: true, docId: docRef.id };
    } catch (primaryError) {
      console.error(`Failed to write to ${collectionName}:`, primaryError);
      
      // Try with alternate spelling (with/without 's')
      const altCollectionName = evaluationPeriod.endsWith('s') 
        ? `OJTadvisers_${evaluationPeriod.slice(0, -1)}` // Remove 's'
        : `OJTadvisers_${evaluationPeriod}s`;            // Add 's'
      
      console.log(`Attempting with alternate collection name: ${altCollectionName}`);
      
      try {
        const altDocRef = await addDoc(collection(db, altCollectionName), dataWithTimestamp);
        console.log(`Success with alternate collection! Document written with ID: ${altDocRef.id} to ${altCollectionName}`);
        return { success: true, docId: altDocRef.id };
      } catch (altError) {
        console.error(`Failed with alternate collection ${altCollectionName}:`, altError);
        
        // Final fallback to the main collection
        const mainDocRef = await addDoc(collection(db, 'OJTadvisers'), dataWithTimestamp);
        console.log(`Fallback: Document written with ID: ${mainDocRef.id} to OJTadvisers`);
        
        return { success: true, docId: mainDocRef.id };
      }
    }
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

// Function to submit concerns and solutions survey
export const submitConcernsSurvey = async (surveyData) => {
  try {
    // Add a timestamp for metadata
    const timestamp = serverTimestamp();
    const submittedBy = surveyData.submittedBy || 'adviser';
    
    // Track what operations succeeded
    const results = {
      studentDataUpdated: false,
      concernsSaved: false,
      docId: null
    };

    // STEP 1: First priority - Update the student record directly
    if (surveyData.studentDocId) {
      try {
        console.log(`Attempting to update student record directly with ID: ${surveyData.studentDocId}`);
        
        // Create a reference to the student document
        const studentDocRef = doc(db, 'studentData', surveyData.studentDocId);
        
        // Prepare data to update
        const updateData = {
          concerns: surveyData.concerns || '',
          solutions: surveyData.solutions || '',
          recommendations: surveyData.recommendations || '',
          evaluation: surveyData.evaluation || '',
          updatedAt: timestamp,
          updatedBy: submittedBy
        };
        
        // First attempt - use serverTimestamp
        try {
          await setDoc(studentDocRef, updateData, { merge: true });
        console.log(`Successfully updated student record with ID: ${surveyData.studentDocId}`);
        results.studentDataUpdated = true;
        } catch (primaryUpdateError) {
          console.warn('First update attempt failed, trying with string timestamp:', primaryUpdateError.message);
          
          // Second attempt - use string timestamp if server timestamp fails
          try {
            // Convert to a string timestamp as an alternative
            updateData.updatedAt = new Date().toISOString();
            await setDoc(studentDocRef, updateData, { merge: true });
            console.log(`Successfully updated student record with string timestamp: ${surveyData.studentDocId}`);
            results.studentDataUpdated = true;
          } catch (fallbackError) {
            // Both attempts failed
            console.error('All update attempts failed:', fallbackError);
            throw fallbackError;
          }
        }
      } catch (studentUpdateError) {
        console.error('Error updating student record:', studentUpdateError);
        // Log more details about the error
        console.error('Error details:', studentUpdateError.code, studentUpdateError.message);
        // Continue to try other options even if this one fails
      }
    } else {
      console.warn('No student document ID provided, skipping direct student data update');
    }
    
    // STEP 2: Try multiple collections to save the full record
    // Prepare the complete data with timestamp
    const dataWithTimestamp = {
      ...surveyData,
      submittedAt: timestamp,
      type: 'concerns'
    };
    
    // Try these collections in order of preference
    const collectionsToTry = [
      'concerns_solutions',
      'ojtAdvisers',
      'student_feedback',
      'feedback'
    ];
    
    let savedToCollection = false;
    
    for (const collectionName of collectionsToTry) {
      if (savedToCollection) break; // Stop if we've already saved successfully
      
      try {
        console.log(`Attempting to save concerns to ${collectionName} collection`);
        const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
        console.log(`Successfully saved to ${collectionName} with ID: ${docRef.id}`);
        
        // Mark as successful and store the document ID
        savedToCollection = true;
        results.concernsSaved = true;
        results.docId = docRef.id;
      } catch (collectionError) {
        console.warn(`Failed to save to ${collectionName}:`, collectionError);
        // Continue to the next collection
      }
    }
    
    // STEP 3: Determine overall success and return appropriate result
    if (results.studentDataUpdated) {
      // If we at least updated the student data directly, consider it a success
      return { 
        success: true, 
        studentDataUpdated: true,
        concernsSaved: results.concernsSaved,
        docId: results.docId,
        message: results.concernsSaved 
          ? 'Successfully updated student data and saved to database' 
          : 'Successfully updated student data but could not save to concerns collection'
      };
    } else if (results.concernsSaved) {
      // If we couldn't update student data but saved to a collection
      return {
        success: true,
        studentDataUpdated: false,
        concernsSaved: true,
        docId: results.docId,
        message: 'Saved concerns but could not update student data directly'
      };
    } else {
      // If nothing worked, try localStorage as a last resort
      throw new Error('Could not save to any collection or update student data');
    }
  } catch (error) {
    console.error('Error in submitConcernsSurvey:', error);
    throw error;
  }
};

/**
 * Submits a company evaluation survey
 * @param {Object} data - The survey data
 * @param {String} customDocumentId - Optional custom document ID
 * @returns {Promise<String>} - The created document ID
 */
export const submitCompanyEvaluation = async (data, customDocumentId = null) => {
  console.log('Submitting company evaluation:', data);
  // Validate required fields
  if (!data.studentName) {
    throw new Error('Error submitting evaluation: Missing required fields: studentName');
  }

  try {
    // Determine a unique ID for the document
    let documentId;
    if (customDocumentId) {
      documentId = customDocumentId;
    } else {
      const normalizedStudentName = data.studentName.replace(/\s+/g, '_').toLowerCase();
      const normalizedCompanyName = data.companyName.replace(/\s+/g, '_').toLowerCase();
      documentId = `${normalizedStudentName}_${normalizedCompanyName}_${Date.now()}`;
    }

    // Ensure section has a value even if it's not provided
    const sectionValue = data.section || 'OJT';
    const departmentValue = data.college || 'CICS';
    // Default evaluation mode to FINAL if not provided
    const evalMode = data.evaluationMode || 'FINAL';
    
    // Calculate total scores
    const workEnvironmentScore = Object.values(data.workEnvironmentRatings || {}).reduce((sum, rating) => sum + rating, 0);
    const supportGuidanceScore = Object.values(data.supportGuidanceRatings || {}).reduce((sum, rating) => sum + rating, 0);
    const workPerformanceScore = Object.values(data.workPerformanceRatings || {}).reduce((sum, rating) => sum + rating, 0);
    const overallExperienceScore = Object.values(data.overallExperienceRatings || {}).reduce((sum, rating) => sum + rating, 0);

    const docData = {
      // Survey Information
      surveyType: 'company',
      studentName: data.studentName,
      studentId: data.studentId || '',
      companyName: data.companyName,
      program: data.program,
      schoolYear: data.schoolYear,
      semester: data.semester,
      section: sectionValue, // Use the ensured section value
      college: departmentValue, // Make college optional, default to 'CICS'
      evaluationMode: evalMode, // Include evaluation mode in the document
      accessKey: data.accessKey || '', // Include access key if available
      accessKeyUsed: !!data.accessKey, // Flag to indicate an access key was used
      
      // Ratings Details
      workEnvironment: {
        ratings: data.workEnvironmentRatings || {},
        totalScore: workEnvironmentScore,
        maxPossibleScore: Object.keys(data.workEnvironmentRatings || {}).length * 5
      },
      supportGuidance: {
        ratings: data.supportGuidanceRatings || {},
        totalScore: supportGuidanceScore,
        maxPossibleScore: Object.keys(data.supportGuidanceRatings || {}).length * 5
      },
      workPerformance: {
        ratings: data.workPerformanceRatings || {},
        totalScore: workPerformanceScore,
        maxPossibleScore: Object.keys(data.workPerformanceRatings || {}).length * 5
      },
      overallExperience: {
        ratings: data.overallExperienceRatings || {},
        totalScore: overallExperienceScore,
        maxPossibleScore: Object.keys(data.overallExperienceRatings || {}).length * 5
      },

      // Metadata
      totalScore: workEnvironmentScore + supportGuidanceScore + workPerformanceScore + overallExperienceScore,
      maxPossibleScore: (
        Object.keys(data.workEnvironmentRatings || {}).length + 
        Object.keys(data.supportGuidanceRatings || {}).length + 
        Object.keys(data.workPerformanceRatings || {}).length + 
        Object.keys(data.overallExperienceRatings || {}).length
      ) * 5,
      submittedAt: serverTimestamp(),
      submittedBy: 'anonymous',
      status: 'submitted'
    };

    // Validate required fields before submission
    const requiredFields = ['companyName', 'studentName', 'program', 'schoolYear', 'semester'];
    const missingFields = requiredFields.filter(field => !docData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('Submitting survey with data:', docData);

    // Track successful operations
    const successfulOperations = [];
    
    try {
      // PRIMARY STRUCTURE: companyEvaluations_[period] collection
      // Use a separate collection for each period
      const companyEvalsCollectionName = `companyEvaluations_${evalMode.toLowerCase()}`;
      const companyEvalsRef = collection(db, companyEvalsCollectionName);
      
      // Add document directly to the period-specific collection
      await setDoc(doc(companyEvalsRef, documentId), docData);
      
      successfulOperations.push('primary_structure');
      console.log(`Successfully saved to ${companyEvalsCollectionName}/${documentId}`);
    } catch (error) {
      console.warn(`Error saving to primary structure ${evalMode} collection:`, error.message);
    }
    
    // Also try saving to a combined collection with evaluation mode as a field
    try {
      // Save to a combined collection with evaluationMode as a field
      const combinedCollectionRef = collection(db, 'companyEvaluations');
      await setDoc(doc(combinedCollectionRef, documentId), docData);
      
      successfulOperations.push('combined_collection');
      console.log(`Successfully saved to companyEvaluations/${documentId} with evaluationMode field`);
    } catch (error) {
      console.warn('Error saving to combined collection:', error.message);
    }

    // Try to save to hierarchical structure as well
    try {
      // HIERARCHICAL STRUCTURE
      // 1. Get or create department document
      const departmentRef = doc(db, 'departments', departmentValue);
      
      // 2. Create reference to the sections subcollection within the department
      const sectionsRef = collection(departmentRef, 'sections');
      
      // 3. Get or create the specific section document within the department
      const sectionDocRef = doc(sectionsRef, sectionValue);
      
      // 4. Create reference to the students subcollection within the section
      const studentsRef = collection(sectionDocRef, 'students');
      
      // 5. Use the studentId as the document ID (or create a normalized student name if ID not available)
      const studentDocId = data.studentId 
        ? data.studentId.replace(/[^a-zA-Z0-9]/g, '_')
        : data.studentName.trim().toLowerCase().replace(/\s+/g, '_');
      
      // 6. Create reference to the specific student document
      const studentDocRef = doc(studentsRef, studentDocId);
      
      // 7. Create reference to the evaluations subcollection (with period in the name)
      const evaluationsRef = collection(studentDocRef, `evaluations_${evalMode.toLowerCase()}`);
      
      // 8. Add the evaluation document
      await setDoc(doc(evaluationsRef, documentId), docData);
      
      successfulOperations.push('hierarchical');
      console.log('Successfully saved to hierarchical structure');
    } catch (error) {
      console.warn('Error saving to hierarchical structure:', error.message);
    }

    // If we saved to at least one location, consider it a success
    if (successfulOperations.length > 0) {
      console.log('Evaluation submitted successfully with ID:', documentId);
      return documentId;
    } else {
      // One final fallback attempt with a simpler approach
      try {
        const legacyRef = collection(db, 'companyEvaluations_legacy');
        await setDoc(doc(legacyRef, documentId), docData);
        
        console.log('Evaluation submitted successfully with fallback method. ID:', documentId);
        return documentId;
      } catch (finalError) {
        console.error('All save attempts failed. Final error:', finalError);
        throw new Error('Unable to save evaluation to any location. Please check permissions and network connection and try again.');
      }
    }
  } catch (error) {
    console.error('Error submitting company evaluation:', error);
    throw error;
  }
};

// Helper function for calculating category scores
export const calculateCategoryScore = (ratings) => {
  return ratings.reduce((sum, rating) => sum + (Number(rating) || 0), 0);
}; 