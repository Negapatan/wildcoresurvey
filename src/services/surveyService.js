import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
      semester
    } = surveyData;
    
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
    const requiredFields = ['studentName', 'studentId', 'companyName', 'program', 'schoolYear', 'semester'];
    const missingFields = requiredFields.filter(field => !docData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const studentSurveysRef = collection(db, 'studentSurveys');
    const docRef = await addDoc(studentSurveysRef, docData);
    console.log('Survey submitted successfully with ID:', docRef.id);
    return docRef.id;
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

    const surveysRef = collection(db, 'OJTadvisers');
    const docRef = await addDoc(surveysRef, surveyData);
    return docRef;
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
      program: surveyData.program,
      schoolYear: surveyData.schoolYear,
      semester: surveyData.semester,

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
    const requiredFields = ['companyName', 'studentName', 'program', 'schoolYear', 'semester'];
    const missingFields = requiredFields.filter(field => !surveyData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const evaluationsRef = collection(db, 'companyEvaluations');
    const docRef = await addDoc(evaluationsRef, evaluationData);
    
    console.log('Evaluation submitted successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting company evaluation:', error);
    throw error;
  }
};

// Helper function for calculating category scores
const calculateCategoryScore = (ratings) => {
  return ratings.reduce((sum, rating) => sum + (Number(rating) || 0), 0);
}; 