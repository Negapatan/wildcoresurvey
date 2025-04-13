import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
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
      college
    } = surveyData;
    
    // Ensure section has a value even if it's not provided
    const sectionValue = section || 'OJT';
    const departmentValue = college || 'CICS';
    
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

    // HIERARCHICAL STRUCTURE IMPLEMENTATION
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
    
    // 7. Create reference to the student-surveys subcollection within the student document
    const studentSurveysRef = collection(studentDocRef, 'student-surveys');
    
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
    
    // 8. Add the survey with the custom ID in the student's surveys subcollection
    const surveyDocRef = doc(studentSurveysRef, documentId);
    await setDoc(surveyDocRef, docData);
    
    // 9. Also save to the flat studentSurveys collection for backward compatibility and easier querying
    const legacyRef = collection(db, 'studentSurveys');
    const legacyDocRef = doc(legacyRef, documentId);
    await setDoc(legacyDocRef, docData);
    
    console.log('Survey submitted successfully with ID:', documentId);
    console.log('Saved to hierarchical structure:', `departments/${departmentValue}/sections/${sectionValue}/students/${normalizedStudentId}/student-surveys/${documentId}`);
    
    return documentId;
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

    // First, ensure we have the department/college and section information
    const department = surveyData.college || 'CICS';
    const section = surveyData.section || 'Unspecified';

    // NEW HIERARCHICAL STRUCTURE:
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
    
    // 7. Create reference to the evaluations subcollection within the student document
    const evaluationsRef = collection(studentDocRef, 'evaluations');
    
    // 8. Add the evaluation with an auto-generated ID in the student's evaluations subcollection
    const evalDocRef = await addDoc(evaluationsRef, evaluationData);
    
    // 9. Also save to the flat companyEvaluations collection for backward compatibility and easier querying
    const legacyRef = collection(db, 'companyEvaluations');
    await setDoc(doc(legacyRef, evalDocRef.id), evaluationData);
    
    console.log('Evaluation submitted successfully with ID:', evalDocRef.id);
    console.log('Saved to hierarchical structure:', `departments/${department}/sections/${section}/students/${studentDocId}/evaluations/${evalDocRef.id}`);
    
    return evalDocRef.id;
  } catch (error) {
    console.error('Error submitting company evaluation:', error);
    throw error;
  }
};

// Helper function for calculating category scores
const calculateCategoryScore = (ratings) => {
  return ratings.reduce((sum, rating) => sum + (Number(rating) || 0), 0);
}; 