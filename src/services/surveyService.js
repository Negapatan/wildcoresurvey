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

export const submitCompanySurvey = async (surveyData) => {
  try {
    const { 
      meetingDate,
      companyName,
      studentNames,
      overallPerformance,
      tasksAssigned,
      trainingProvided,
      technicalSkills,
      recommendations,
      industryMentor,
      recommendToStudents,
      program
    } = surveyData;

    const docData = {
      // Basic Information
      surveyType: 'company',
      meetingDate,
      companyName,
      studentNames,
      program,
      
      // Survey Details
      overallPerformance: parseInt(overallPerformance) || 0,
      tasksAssigned,
      trainingProvided,
      technicalSkills,
      recommendations,
      industryMentor,
      recommendToStudents,

      // Overall score (only for overall performance)
      totalScore: parseInt(overallPerformance) || 0,
      maxPossibleScore: 10,

      // Metadata
      submittedAt: serverTimestamp(),
      submittedBy: 'anonymous',
      status: 'submitted'
    };

    const companySurveysRef = collection(db, 'companySurveys');
    const docRef = await addDoc(companySurveysRef, docData);
    console.log('Survey submitted successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting company survey:', error);
    throw error;
  }
}; 