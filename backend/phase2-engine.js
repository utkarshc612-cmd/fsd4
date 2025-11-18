/**
 * Phase 2: Advanced Monitoring & Intelligence Features
 * Smart Classroom, Lesson Planning, Feedback Generation
 */

const { db } = require('./models');

// ==================== SMART CLASSROOM MONITORING ====================

/**
 * Real-time doubt/confusion tracking
 */
function logStudentDoubt(classId, studentId, conceptId, timestamp = new Date()) {
  if (!db.classroomMonitoring) {
    db.classroomMonitoring = [];
  }

  const doubt = {
    id: Math.random().toString(36).substr(2, 9),
    classId,
    studentId,
    conceptId,
    timestamp,
    resolved: false
  };

  db.classroomMonitoring.push(doubt);
  return doubt;
}

/**
 * Get real-time doubt dashboard for class
 */
function getClassroomDashboard(classId) {
  if (!db.classroomMonitoring) db.classroomMonitoring = [];

  const students = db.students.filter(s => s.classId === classId);
  const recentDoubts = db.classroomMonitoring
    .filter(d => d.classId === classId && !d.resolved)
    .slice(-20);

  const doubtsByStudent = {};
  students.forEach(s => {
    doubtsByStudent[s.id] = {
      name: s.name,
      doubts: recentDoubts.filter(d => d.studentId === s.id).length,
      concepts: [...new Set(recentDoubts.filter(d => d.studentId === s.id).map(d => d.conceptId))]
    };
  });

  const doubtsByConcept = {};
  recentDoubts.forEach(d => {
    if (!doubtsByConcept[d.conceptId]) doubtsByConcept[d.conceptId] = 0;
    doubtsByConcept[d.conceptId]++;
  });

  return {
    classId,
    totalDoubtStudents: Object.values(doubtsByStudent).filter(s => s.doubts > 0).length,
    totalUnresolvedDoubts: recentDoubts.length,
    studentDoubts: doubtsByStudent,
    conceptHotspots: Object.entries(doubtsByConcept)
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    recentDoubts
  };
}

/**
 * Mark doubt as resolved
 */
function resolveDoubt(doubtId) {
  if (!db.classroomMonitoring) return null;
  const doubt = db.classroomMonitoring.find(d => d.id === doubtId);
  if (doubt) {
    doubt.resolved = true;
  }
  return doubt;
}

/**
 * Get attention/engagement heatmap (simulated)
 */
function getEngagementHeatmap(classId) {
  const students = db.students.filter(s => s.classId === classId);
  
  // Simulate engagement based on attendance + grades
  const engagement = students.map(student => {
    const attendance = db.attendance.filter(a => a.studentId === student.id);
    const grades = db.grades.filter(g => g.studentId === student.id);
    
    const attendanceRate = attendance.length > 0
      ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100
      : 0;
    
    const avgGrades = grades.length > 0
      ? grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / grades.length
      : 0;

    const engagementScore = (attendanceRate * 0.4 + avgGrades * 0.6);
    
    return {
      studentId: student.id,
      studentName: student.name,
      engagementScore: Math.round(engagementScore),
      status: engagementScore >= 75 ? 'HIGH' : engagementScore >= 50 ? 'MEDIUM' : 'LOW'
    };
  });

  return {
    classId,
    engagement: engagement.sort((a, b) => b.engagementScore - a.engagementScore),
    avgEngagement: Math.round(engagement.reduce((sum, e) => sum + e.engagementScore, 0) / Math.max(1, engagement.length)),
    lowEngagementStudents: engagement.filter(e => e.status === 'LOW')
  };
}

// ==================== AI LESSON PLANNING ====================

/**
 * Generate lesson plan for a topic
 */
function generateLessonPlan(classId, topicId, duration = 60) {
  // duration in minutes
  const sections = [
    {
      name: 'Introduction',
      duration: Math.ceil(duration * 0.1),
      activities: ['Hook/Engagement activity', 'Learning objectives overview']
    },
    {
      name: 'Concept Development',
      duration: Math.ceil(duration * 0.4),
      activities: ['Direct instruction', 'Visual demonstrations', 'Real-world examples']
    },
    {
      name: 'Guided Practice',
      duration: Math.ceil(duration * 0.25),
      activities: ['Worked examples', 'Peer discussion', 'Q&A session']
    },
    {
      name: 'Independent Practice',
      duration: Math.ceil(duration * 0.15),
      activities: ['Problem solving', 'Worksheet exercises']
    },
    {
      name: 'Closure',
      duration: Math.ceil(duration * 0.1),
      activities: ['Summary recap', 'Preview next topic', 'Homework assignment']
    }
  ];

  // Distribute difficulty
  const learningLevels = {
    beginning: Math.ceil(duration * 0.2),
    developing: Math.ceil(duration * 0.4),
    proficient: Math.ceil(duration * 0.3),
    advanced: Math.ceil(duration * 0.1)
  };

  return {
    planId: Math.random().toString(36).substr(2, 9),
    classId,
    topicId,
    totalDuration: duration,
    sections,
    learningObjectives: [
      `Students will understand basic concepts of ${topicId}`,
      `Students will solve problems involving ${topicId}`,
      `Students will apply ${topicId} to real-world scenarios`
    ],
    assessmentMethods: ['Observation', 'Questioning', 'Independent work', 'Group discussion'],
    resources: [
      `Textbook: Chapter on ${topicId}`,
      'Digital resources/videos',
      'Practice worksheets',
      'Interactive tools'
    ],
    differentiation: {
      forAdvanced: [`Extension problems on ${topicId}`, 'Peer teaching opportunities'],
      forStruggling: [`Simplified worksheet on ${topicId}`, 'Visual aids', 'One-on-one support']
    },
    homework: {
      duration: 30,
      description: `Practice exercises on ${topicId} (Page X, Questions 1-10)`,
      followUp: 'Review homework answers in next class'
    }
  };
}

/**
 * Get optimal lesson time based on class patterns
 */
function getSuggestedLessonTime(classId) {
  const attendance = db.attendance.filter(a => a.classId === classId);
  
  // Analyze attendance patterns (simplified - in real system, track by time of day)
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const totalDays = attendance.length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return {
    classId,
    suggestedDayOfWeek: attendanceRate > 80 ? 'Mid-week (Wed-Thu)' : 'Monday-Tuesday',
    suggestedTimeSlot: attendanceRate > 80 ? 'Morning (9-11 AM)' : 'Early morning (8-9 AM)',
    reason: attendanceRate > 80 
      ? 'High attendance mid-week suggests best focus time'
      : 'Need early morning for better attendance'
  };
}

// ==================== INTELLIGENT FEEDBACK GENERATION ====================

/**
 * Generate personalized feedback for a student
 */
function generateStudentFeedback(studentId) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  const grades = db.grades.filter(g => g.studentId === studentId);
  const attendance = db.attendance.filter(a => a.studentId === studentId);
  
  if (grades.length === 0) {
    return {
      studentId,
      studentName: student.name,
      status: 'INSUFFICIENT_DATA',
      message: 'Not enough grades to generate feedback yet.'
    };
  }

  // Calculate metrics
  const avgGrade = grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / grades.length;
  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 0;

  // Identify strengths
  const strongTopics = {};
  const weakTopics = {};
  grades.forEach(g => {
    const assignment = db.assignments.find(a => a.id === g.assignmentId);
    if (!assignment) return;
    
    const percentage = (g.marksObtained / (assignment.totalMarks || 100)) * 100;
    if (percentage >= 75) {
      strongTopics[assignment.title] = Math.round(percentage);
    } else if (percentage < 60) {
      weakTopics[assignment.title] = Math.round(percentage);
    }
  });

  // Generate personalized comments
  const strengths = [];
  const areasForImprovement = [];
  const studyTips = [];
  let overallComment = '';

  if (avgGrade >= 80) {
    strengths.push('Excellent command of concepts');
    strengths.push('Consistent high performance');
    overallComment = 'Outstanding work! You are demonstrating mastery of the subject. Keep up this excellent work!';
    studyTips.push('Challenge yourself with advanced problems');
    studyTips.push('Help peers with difficult concepts');
  } else if (avgGrade >= 70) {
    strengths.push('Solid understanding of core concepts');
    strengths.push('Good consistent performance');
    overallComment = 'Good work! You are progressing well. Focus on the challenging areas to improve further.';
    studyTips.push('Practice more complex problems');
    studyTips.push('Review previous exams');
  } else if (avgGrade >= 60) {
    areasForImprovement.push('Need more practice on key topics');
    areasForImprovement.push('Review fundamental concepts');
    overallComment = 'Satisfactory performance. With focused effort on weak areas, you can improve significantly.';
    studyTips.push('Daily practice for 30 minutes');
    studyTips.push('Form study groups with classmates');
  } else {
    areasForImprovement.push('Needs significant improvement in most topics');
    areasForImprovement.push('Requires additional support');
    overallComment = 'You need to increase your effort. Please see me for additional support and resources.';
    studyTips.push('Daily tutoring sessions');
    studyTips.push('Complete all assignments');
    studyTips.push('Ask for help immediately when confused');
  }

  if (attendanceRate < 80) {
    areasForImprovement.push('Attendance needs improvement');
    studyTips.push('Attend every class without fail');
  }

  return {
    studentId,
    studentName: student.name,
    generatedDate: new Date(),
    overallGrade: Math.round(avgGrade),
    attendanceRate,
    
    strengths: Object.keys(strongTopics).length > 0
      ? strengths.concat([`Strong performance in: ${Object.keys(strongTopics).join(', ')}`])
      : strengths,
    
    areasForImprovement: Object.keys(weakTopics).length > 0
      ? areasForImprovement.concat([`Needs work on: ${Object.keys(weakTopics).join(', ')}`])
      : areasForImprovement,
    
    studyTips,
    
    overallComment,
    
    recommendedActions: [
      avgGrade < 60 ? 'Schedule one-on-one meeting with teacher' : 'Continue current study approach',
      attendanceRate < 80 ? 'Discuss attendance concerns' : 'Maintain good attendance',
      Object.keys(weakTopics).length > 2 ? 'Consider tutoring support' : 'Targeted practice on weak topics'
    ]
  };
}

/**
 * Generate feedback for entire class
 */
function generateClassFeedback(classId) {
  const students = db.students.filter(s => s.classId === classId);
  
  const feedback = students.map(student => ({
    studentId: student.id,
    studentName: student.name,
    feedback: generateStudentFeedback(student.id)
  }));

  // Class-level insights
  const avgClassGrade = feedback.reduce((sum, f) => sum + (f.feedback?.overallGrade || 0), 0) / Math.max(1, feedback.length);
  const needsSupport = feedback.filter(f => (f.feedback?.overallGrade || 0) < 60).length;
  const excellent = feedback.filter(f => (f.feedback?.overallGrade || 0) >= 80).length;

  return {
    classId,
    totalStudents: students.length,
    classAverageGrade: Math.round(avgClassGrade),
    studentsNeedingSupport: needsSupport,
    excellentPerformers: excellent,
    feedback,
    classRecommendations: [
      avgClassGrade < 70 ? 'Consider revisiting key topics as a class' : 'Class is performing well overall',
      needsSupport > 0 ? `Provide additional support to ${needsSupport} students` : 'All students are progressing well',
      avgClassGrade < 60 ? 'Review teaching methodology and pacing' : 'Continue current approach'
    ]
  };
}

// ==================== CONTENT RECOMMENDATIONS ====================

/**
 * Recommend content based on student performance and syllabus
 */
function recommendContent(studentId, classId) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  const gaps = require('./ai-engine').identifyKnowledgeGaps(studentId, classId);
  
  // Mock content from various sources
  const contentSources = {
    videos: [
      { title: 'Basics of Algebra - Khan Academy', url: 'youtube.com', level: 'beginner', rating: 4.8 },
      { title: 'Advanced Calculus Concepts', url: 'youtube.com', level: 'advanced', rating: 4.5 },
      { title: 'Geometry Fundamentals', url: 'youtube.com', level: 'beginner', rating: 4.7 }
    ],
    mcqs: [
      { title: '10 MCQs on Algebra', count: 10, level: 'medium', rating: 4.6 },
      { title: 'Geometry Practice Set', count: 20, level: 'hard', rating: 4.4 },
      { title: 'Calculus Self-Assessment', count: 15, level: 'medium', rating: 4.5 }
    ],
    previousYearQuestions: [
      { title: 'Algebra - Last 5 Years PYQ', count: 25, level: 'hard', rating: 4.9 },
      { title: 'Geometry - Board Exam Questions', count: 30, level: 'hard', rating: 4.8 }
    ],
    notes: [
      { title: 'Algebra Quick Reference', pages: 15, level: 'medium', rating: 4.6 },
      { title: 'Geometry Formulas & Theorems', pages: 10, level: 'medium', rating: 4.7 }
    ]
  };

  const recommendations = gaps.slice(0, 3).map(gap => ({
    topic: gap.topic,
    severity: gap.severity,
    suggestedContent: {
      videos: contentSources.videos.filter(v => v.level !== 'advanced').slice(0, 2),
      mcqs: contentSources.mcqs.slice(0, 2),
      pyqs: contentSources.previousYearQuestions.slice(0, 1),
      notes: contentSources.notes.slice(0, 1)
    }
  }));

  return {
    studentId,
    studentName: student.name,
    recommendations,
    totalResources: recommendations.reduce((sum, r) => 
      sum + (r.suggestedContent.videos.length + r.suggestedContent.mcqs.length + 
             r.suggestedContent.pyqs.length + r.suggestedContent.notes.length), 0)
  };
}

// ==================== EXPORTS ====================

module.exports = {
  // Smart Classroom
  logStudentDoubt,
  getClassroomDashboard,
  resolveDoubt,
  getEngagementHeatmap,

  // Lesson Planning
  generateLessonPlan,
  getSuggestedLessonTime,

  // Feedback
  generateStudentFeedback,
  generateClassFeedback,

  // Content Recommendations
  recommendContent
};
