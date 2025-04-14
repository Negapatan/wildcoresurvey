import { collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase-config';

export const submitStudentSurvey = async (surveyData) => {
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
      evaluationMode
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
    const requiredFields = ['studentName', 'studentId', 'companyName', 'program', 'schoolYear', 'semester', 'section'];
    const missingFields = requiredFields.filter(field => !docData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('Submitting survey with data:', docData);

    // Generate a unique document ID for this specific submission
    let documentId;
    if (studentName && companyName) {
      // Normalize the student name and company name for consistent IDs
      const normalizedName = studentName.trim().toLowerCase().replace(/\s+/g, '_');
      const normalizedCompany = companyName.trim().toLowerCase().replace(/\s+/g, '_');
      documentId = `${normalizedName}_${normalizedCompany}_${Date.now()}`; // Adding timestamp to ensure uniqueness
    } else {
      documentId = `survey_${Date.now()}`;
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

export const submitCompanySurvey = async (formData) => {
  try {
    const surveyData = {
      surveyType: 'company',
      meetingDate: formData.meetingDate,
      companyName: formData.companyName,
      studentNames: formData.studentNames,
      overallPerformance: parseInt(formData.overallPerformance),
      tasksAssigned: formData.tasksAssigned,
      trainingProvided: formData.trainingProvided,
      technicalSkills: formData.technicalSkills,
      recommendations: formData.recommendations,
      industryMentor: formData.industryMentor,
      recommendToStudents: formData.recommendToStudents,
      program: formData.program,
      totalScore: parseInt(formData.overallPerformance),
      maxPossibleScore: 10,
      submittedAt: serverTimestamp(),
      submittedBy: 'anonymous',
      status: 'submitted'
    };

    // Ensure we have the department/college information
    const department = formData.college || 'CICS';
    
    // HIERARCHICAL STRUCTURE FOR COMPANY SURVEYS:
    // 1. Get or create department document
    const departmentRef = doc(db, 'departments', department);
    
    // 2. Create reference to the companies subcollection within the department
    const companiesRef = collection(departmentRef, 'companies');
    
    // 3. Use the company name as the document ID
    const normalizedCompanyName = formData.companyName
      ? formData.companyName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')
      : `company_${Date.now()}`;
    
    // 4. Create reference to the specific company document
    const companyDocRef = doc(companiesRef, normalizedCompanyName);
    
    // 5. Create reference to the surveys subcollection within the company document
    const surveysRef = collection(companyDocRef, 'surveys');
    
    // 6. Generate a unique document ID for this specific submission
    const documentId = `survey_${Date.now()}`;
    
    // 7. Add the survey with the unique ID in the company's surveys subcollection
    const surveyDocRef = doc(surveysRef, documentId);
    await setDoc(surveyDocRef, surveyData);
    
    // 8. Also save to the flat OJTadvisers collection for backward compatibility
    const legacyRef = collection(db, 'OJTadvisers');
    const legacyDocRef = doc(legacyRef, documentId);
    await setDoc(legacyDocRef, surveyData);
    
    console.log('Company survey submitted successfully with ID:', documentId);
    console.log('Saved to hierarchical structure:', `departments/${department}/companies/${normalizedCompanyName}/surveys/${documentId}`);
    
    return documentId;
  } catch (error) {
    console.error('Error submitting company survey:', error);
    throw error;
  }
};

export const submitCompanyEvaluation = async (surveyData) => {
  try {
    console.log('Submitting data:', surveyData);

    // Ensure studentName is present
    if (!surveyData.studentName) {
      throw new Error('Student Name is required');
    }

    const evaluationData = {
      // Basic Information (required by rules)
      companyName: surveyData.companyName,
      studentName: surveyData.studentName,
      studentId: surveyData.studentId || '',
      program: surveyData.program,
      schoolYear: surveyData.schoolYear,
      semester: surveyData.semester,
      userRole: surveyData.userRole || 'student',
      section: surveyData.section || '', // Ensure section is included
      evaluationMode: surveyData.evaluationMode || 'FINAL', // Include evaluation mode with default
      college: surveyData.college || 'CICS', // Include college info

      // Work Environment
      workEnvironment: {
        workstation: Number(surveyData.workstation || 0),
        resources: Number(surveyData.resources || 0),
        safety: Number(surveyData.safety || 0),
        workload: Number(surveyData.workload || 0),
        totalScore: 0,
        maxPossibleScore: 20
      },

      // Performance Support
      performanceSupport: {
        supervision: Number(surveyData.supervision || 0),
        feedback: Number(surveyData.feedback || 0),
        training: Number(surveyData.training || 0),
        mentorship: Number(surveyData.mentorship || 0),
        totalScore: 0,
        maxPossibleScore: 20
      },

      // Experience Quality
      experienceQuality: {
        relevance: Number(surveyData.relevance || 0),
        skills: Number(surveyData.skills || 0),
        growth: Number(surveyData.growth || 0),
        satisfaction: Number(surveyData.satisfaction || 0),
        totalScore: 0,
        maxPossibleScore: 20
      },

      // Overall Metrics
      overall: {
        totalScore: 0,
        maxPossibleScore: 60,
        averageRating: '0'
      },

      // Metadata
      submittedAt: serverTimestamp(),
      status: 'submitted'
    };

    // Calculate individual section scores using calculateCategoryScore
    evaluationData.workEnvironment.totalScore = calculateCategoryScore([
      evaluationData.workEnvironment.workstation,
      evaluationData.workEnvironment.resources,
      evaluationData.workEnvironment.safety,
      evaluationData.workEnvironment.workload
    ]);

    evaluationData.performanceSupport.totalScore = calculateCategoryScore([
      evaluationData.performanceSupport.supervision,
      evaluationData.performanceSupport.feedback,
      evaluationData.performanceSupport.training,
      evaluationData.performanceSupport.mentorship
    ]);

    evaluationData.experienceQuality.totalScore = calculateCategoryScore([
      evaluationData.experienceQuality.relevance,
      evaluationData.experienceQuality.skills,
      evaluationData.experienceQuality.growth,
      evaluationData.experienceQuality.satisfaction
    ]);

    // Calculate overall total
    evaluationData.overall.totalScore = 
      evaluationData.workEnvironment.totalScore +
      evaluationData.performanceSupport.totalScore +
      evaluationData.experienceQuality.totalScore;

    evaluationData.overall.averageRating = 
      (evaluationData.overall.totalScore / 12).toFixed(2);

    // Final validation before submission
    const requiredFields = ['companyName', 'studentName', 'studentId', 'program', 'schoolYear', 'semester'];
    const missingFields = requiredFields.filter(field => !surveyData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Get the evaluation mode and other key info
    const department = surveyData.college || 'CICS';
    const section = surveyData.section || 'Unspecified';
    const evaluationMode = surveyData.evaluationMode || 'FINAL';

    // Track successful operations
    const successfulOperations = [];
    let documentId = `company_eval_${Date.now()}`; // Create a consistent ID to use
    
    try {
      // PRIMARY STRUCTURE: companyEvaluations_[period] collection
      // Use a separate collection for each period
      const companyEvalsCollectionName = `companyEvaluations_${evaluationMode.toLowerCase()}`;
      const companyEvalsRef = collection(db, companyEvalsCollectionName);
      
      // Add document directly to the period-specific collection
      await setDoc(doc(companyEvalsRef, documentId), evaluationData);
      
      successfulOperations.push('primary_structure');
      console.log(`Successfully saved to ${companyEvalsCollectionName}/${documentId}`);
    } catch (error) {
      console.warn(`Error saving to primary structure ${evaluationMode} collection:`, error.message);
    }
    
    // Also try saving to a combined collection with evaluation mode as a field
    try {
      // Save to a combined collection with evaluationMode as a field
      const combinedCollectionRef = collection(db, 'companyEvaluations');
      await setDoc(doc(combinedCollectionRef, documentId), evaluationData);
      
      successfulOperations.push('combined_collection');
      console.log(`Successfully saved to companyEvaluations/${documentId} with evaluationMode field`);
    } catch (error) {
      console.warn('Error saving to combined collection:', error.message);
    }

    // Try to save to hierarchical structure as well
    try {
      // HIERARCHICAL STRUCTURE
      // 1. Get or create department document
      const departmentRef = doc(db, 'departments', department);
      
      // 2. Create reference to the sections subcollection within the department
      const sectionsRef = collection(departmentRef, 'sections');
      
      // 3. Get or create the specific section document within the department
      const sectionDocRef = doc(sectionsRef, section);
      
      // 4. Create reference to the students subcollection within the section
      const studentsRef = collection(sectionDocRef, 'students');
      
      // 5. Use the studentId as the document ID (or create a normalized student name if ID not available)
      const studentDocId = surveyData.studentId 
        ? surveyData.studentId.replace(/[^a-zA-Z0-9]/g, '_')
        : surveyData.studentName.trim().toLowerCase().replace(/\s+/g, '_');
      
      // 6. Create reference to the specific student document
      const studentDocRef = doc(studentsRef, studentDocId);
      
      // 7. Create reference to the evaluations subcollection (with period in the name)
      const evaluationsRef = collection(studentDocRef, `evaluations_${evaluationMode.toLowerCase()}`);
      
      // 8. Add the evaluation document
      await setDoc(doc(evaluationsRef, documentId), evaluationData);
      
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
        await setDoc(doc(legacyRef, documentId), evaluationData);
        
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
const calculateCategoryScore = (ratings) => {
  return ratings.reduce((sum, rating) => sum + (Number(rating) || 0), 0);
}; 