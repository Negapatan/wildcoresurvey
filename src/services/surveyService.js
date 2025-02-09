import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';

export const submitStudentSurvey = async (surveyData) => {
  try {
    // Remove authentication check
    const { 
      workAttitudeRatings, 
      workPerformanceRatings, 
      studentName,
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
      submittedBy: 'anonymous',  // Changed from auth.currentUser.uid
      status: 'submitted'
    };

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
    // Convert all ratings to numbers and ensure proper structure
    const processedData = {
      ...surveyData,
      workEnvironment: {
        ...surveyData.workEnvironment,
        ratings: Object.entries(surveyData.workEnvironment.ratings).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {}),
        totalScore: Number(surveyData.workEnvironment.totalScore)
      },
      supportGuidance: {
        ...surveyData.supportGuidance,
        ratings: Object.entries(surveyData.supportGuidance.ratings).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {}),
        totalScore: Number(surveyData.supportGuidance.totalScore)
      },
      workPerformance: {
        ...surveyData.workPerformance,
        ratings: Object.entries(surveyData.workPerformance.ratings).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {}),
        totalScore: Number(surveyData.workPerformance.totalScore)
      },
      overallExperience: {
        ...surveyData.overallExperience,
        ratings: Object.entries(surveyData.overallExperience.ratings).reduce((acc, [key, value]) => {
          acc[key] = Number(value);
          return acc;
        }, {}),
        totalScore: Number(surveyData.overallExperience.totalScore)
      },
      totalScore: Number(surveyData.totalScore),
      maxPossibleScore: Number(surveyData.maxPossibleScore)
    };

    const evaluationsRef = collection(db, 'companyEvaluations');
    const docRef = await addDoc(evaluationsRef, {
      ...processedData,
      submittedAt: serverTimestamp()
    });
    
    console.log('Evaluation submitted successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting company evaluation:', error);
    throw error;
  }
}; 