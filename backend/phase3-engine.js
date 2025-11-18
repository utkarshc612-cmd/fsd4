/**
 * Phase 3: Security, Optimization & Accessibility Features
 * Anti-Cheating, Schedule Optimization, Time-on-Task, Parent Insights
 */

const { db } = require('./models');

// ==================== ANTI-CHEATING PROCTORING ====================

/**
 * Log proctoring session
 */
function initProctoringSession(examId, studentId, startTime = new Date()) {
  if (!db.proctoringSessions) {
    db.proctoringSessions = [];
  }

  const session = {
    sessionId: Math.random().toString(36).substr(2, 9),
    examId,
    studentId,
    startTime,
    endTime: null,
    flags: [],
    tabSwitches: 0,
    webcamAlert: false,
    audioAlert: false,
    screenShare: false,
    multipleMonitorsDetected: false,
    status: 'ACTIVE'
  };

  db.proctoringSessions.push(session);
  return session;
}

/**
 * Log suspicious activity during exam
 */
function logSuspiciousActivity(sessionId, activityType, severity = 'low', details = {}) {
  if (!db.proctoringSessions) return null;

  const session = db.proctoringSessions.find(s => s.sessionId === sessionId);
  if (!session) return null;

  const flag = {
    flagId: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    type: activityType, // 'tab-switch', 'audio-detected', 'multiple-faces', 'face-missing', 'screenshot', 'third-party-app'
    severity, // 'low', 'medium', 'high'
    details
  };

  session.flags.push(flag);

  // Track specific metrics
  if (activityType === 'tab-switch') session.tabSwitches++;
  if (activityType === 'audio-detected') session.audioAlert = true;
  if (activityType === 'multiple-faces') session.webcamAlert = true;
  if (activityType === 'face-missing') session.webcamAlert = true;
  if (activityType === 'screen-share' || activityType === 'second-screen') session.screenShare = true;

  return flag;
}

/**
 * End proctoring session and generate report
 */
function endProctoringSession(sessionId, endTime = new Date()) {
  if (!db.proctoringSessions) return null;

  const session = db.proctoringSessions.find(s => s.sessionId === sessionId);
  if (!session) return null;

  session.endTime = endTime;
  session.status = 'COMPLETED';

  // Calculate integrity score
  const highSeverityFlags = session.flags.filter(f => f.severity === 'high').length;
  const mediumSeverityFlags = session.flags.filter(f => f.severity === 'medium').length;

  let integrityScore = 100;
  integrityScore -= highSeverityFlags * 15;
  integrityScore -= mediumSeverityFlags * 5;
  integrityScore = Math.max(0, integrityScore);

  return {
    sessionId,
    studentId: session.studentId,
    examId: session.examId,
    duration: (endTime - session.startTime) / 1000 / 60, // minutes
    totalFlags: session.flags.length,
    highSeverityFlags,
    mediumSeverityFlags,
    integrityScore,
    flagSummary: {
      tabSwitches: session.tabSwitches,
      webcamAlerts: session.webcamAlert ? 1 : 0,
      audioDetected: session.audioAlert ? 1 : 0,
      screenShareDetected: session.screenShare ? 1 : 0
    },
    allFlags: session.flags,
    recommendation: integrityScore >= 85 
      ? 'PASS - No significant cheating indicators'
      : integrityScore >= 70
      ? 'REVIEW - Minor suspicious activity detected'
      : integrityScore >= 50
      ? 'INVESTIGATE - Multiple suspicious activities. Manual review recommended'
      : 'FAIL - Significant evidence of cheating',
    status: session.status
  };
}

/**
 * Get proctoring summary for exam
 */
function getExamIntegritySummary(examId) {
  if (!db.proctoringSessions) db.proctoringSessions = [];

  const sessions = db.proctoringSessions.filter(s => s.examId === examId && s.status === 'COMPLETED');
  
  const reports = sessions.map(session => endProctoringSession(session.sessionId));
  
  const avgIntegrity = sessions.length > 0
    ? reports.reduce((sum, r) => sum + r.integrityScore, 0) / sessions.length
    : 100;

  const flaggedStudents = reports.filter(r => r.integrityScore < 85);

  return {
    examId,
    totalStudents: sessions.length,
    avgIntegrityScore: Math.round(avgIntegrity),
    studentsFlagged: flaggedStudents.length,
    flaggedStudents: flaggedStudents.map(r => ({
      studentId: r.studentId,
      integrityScore: r.integrityScore,
      flags: r.totalFlags,
      recommendation: r.recommendation
    })),
    overallSecurity: avgIntegrity >= 85 ? 'SECURE' : avgIntegrity >= 70 ? 'CAUTION' : 'COMPROMISED'
  };
}

// ==================== SCHEDULE OPTIMIZER ====================

/**
 * Analyze student patterns to optimize schedule
 */
function analyzeStudentPatterns(studentId) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  const attendance = db.attendance.filter(a => a.studentId === studentId);
  const grades = db.grades.filter(g => g.studentId === studentId);

  // Analyze performance by day of week (simulated)
  const dayPatterns = {
    Monday: { attendance: 95, avgGrade: 78 },
    Tuesday: { attendance: 92, avgGrade: 80 },
    Wednesday: { attendance: 88, avgGrade: 75 },
    Thursday: { attendance: 85, avgGrade: 72 },
    Friday: { attendance: 70, avgGrade: 68 }
  };

  // Analyze performance by time of day (simulated)
  const timePatterns = {
    'morning': { attendance: 95, avgGrade: 82 },
    'late-morning': { attendance: 90, avgGrade: 78 },
    'afternoon': { attendance: 80, avgGrade: 71 },
    'late-afternoon': { attendance: 65, avgGrade: 62 }
  };

  // Identify best times
  const bestDays = Object.entries(dayPatterns)
    .sort((a, b) => (b[1].avgGrade + b[1].attendance) - (a[1].avgGrade + a[1].attendance))
    .slice(0, 2)
    .map(d => d[0]);

  const bestTimes = Object.entries(timePatterns)
    .sort((a, b) => (b[1].avgGrade + b[1].attendance) - (a[1].avgGrade + a[1].attendance))
    .slice(0, 2)
    .map(t => t[0]);

  return {
    studentId,
    studentName: student.name,
    bestDaysForStudy: bestDays,
    bestTimeSlots: bestTimes,
    patternInsights: [
      `Highest performance on ${bestDays[0]} mornings`,
      `${attendance.filter(a => a.status === 'present').length}/${attendance.length} attendance rate`,
      `Average grade: ${Math.round(grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / Math.max(1, grades.length))}`
    ]
  };
}

/**
 * Recommend optimized class schedule
 */
function optimizeClassSchedule(classId) {
  const students = db.students.filter(s => s.classId === classId);
  
  // Analyze patterns for all students
  const allPatterns = students.map(s => analyzeStudentPatterns(s.id)).filter(p => p !== null);

  // Count preferences
  const dayVotes = {};
  const timeVotes = {};

  allPatterns.forEach(p => {
    p.bestDaysForStudy.forEach(day => {
      dayVotes[day] = (dayVotes[day] || 0) + 1;
    });
    p.bestTimeSlots.forEach(time => {
      timeVotes[time] = (timeVotes[time] || 0) + 1;
    });
  });

  const optimalDays = Object.entries(dayVotes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(d => d[0]);

  const optimalTimes = Object.entries(timeVotes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(t => t[0]);

  return {
    classId,
    totalStudents: students.length,
    recommendedSchedule: {
      days: optimalDays,
      timeSlots: optimalTimes
    },
    expectedAttendanceImprovement: `+${Math.min(15, students.length * 2)}%`,
    reasoning: `Based on ${allPatterns.length} students' performance patterns`,
    implementationNotes: [
      `Schedule main lectures on ${optimalDays[0]} during ${optimalTimes[0]}`,
      'Reserve afternoon slots for review and practice',
      'Schedule assessments on high-engagement days'
    ]
  };
}

// ==================== TIME-ON-TASK ANALYSIS ====================

/**
 * Analyze time spent on assignments
 */
function analyzeTimeOnTask(studentId, assignmentId) {
  const student = db.students.find(s => s.id === studentId);
  const assignment = db.assignments.find(a => a.id === assignmentId);

  if (!student || !assignment) return null;

  const grade = db.grades.find(g => g.studentId === studentId && g.assignmentId === assignmentId);
  
  // Simulated time tracking
  const expectedTime = assignment.totalMarks >= 50 ? 60 : 30; // minutes
  const actualTime = grade ? (grade.marksObtained / assignment.totalMarks) * 100 > 70 ? expectedTime * 0.8 : expectedTime * 1.3 : expectedTime;

  const efficiency = (expectedTime / actualTime) * 100;

  return {
    studentId,
    studentName: student.name,
    assignmentId,
    assignmentTitle: assignment.title,
    expectedTime: expectedTime + ' minutes',
    actualTime: Math.round(actualTime) + ' minutes',
    timeRatio: Math.round((actualTime / expectedTime) * 100) + '%',
    efficiency: Math.round(efficiency) + '%',
    marksObtained: grade?.marksObtained || 0,
    totalMarks: assignment.totalMarks,
    percentageScore: grade ? Math.round((grade.marksObtained / assignment.totalMarks) * 100) : 0,
    insights: efficiency > 100
      ? 'Taking more time than peers on similar assignments'
      : efficiency > 80
      ? 'Reasonable time investment'
      : 'Quick completion - consider if quality is maintained',
    recommendations: efficiency > 120
      ? ['Try timed practice tests', 'Identify difficult concepts', 'Use study guides']
      : ['Continue current approach', 'Help struggling classmates']
  };
}

// ==================== PARENT INSIGHTS MODE ====================

/**
 * Generate parent-friendly report for a student
 */
function generateParentReport(studentId) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  const grades = db.grades.filter(g => g.studentId === studentId);
  const attendance = db.attendance.filter(a => a.studentId === studentId);

  const avgGrade = grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / grades.length
    : 0;

  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 0;

  // Create simple traffic light system for parents
  const overallStatus = avgGrade >= 75 && attendanceRate >= 90
    ? 'EXCELLENT'
    : avgGrade >= 60 && attendanceRate >= 80
    ? 'GOOD'
    : avgGrade >= 50 && attendanceRate >= 70
    ? 'SATISFACTORY'
    : 'NEEDS_SUPPORT';

  return {
    studentName: student.name,
    studentId: student.id,
    reportDate: new Date().toLocaleDateString(),
    
    // Simple metrics
    overallPerformance: overallStatus,
    academicScore: Math.round(avgGrade),
    attendancePercentage: attendanceRate,
    
    // Parent-friendly summary
    summary: `${student.name} is performing at a ${overallStatus.toLowerCase().replace(/_/g, ' ')} level.`,
    
    highlights: [
      `Current average score: ${Math.round(avgGrade)}%`,
      `Attendance rate: ${attendanceRate}%`,
      `Completed ${grades.length} assessments`
    ],
    
    keyStrengths: avgGrade >= 70
      ? ['Strong grasp of core concepts', 'Good exam preparation', 'Consistent effort']
      : ['Working on improving fundamentals', 'Attending classes regularly'],
    
    areasToSupport: avgGrade < 70
      ? ['Daily practice at home (30 mins)', 'Extra tutoring sessions', 'Regular homework completion']
      : ['Maintain current study habits', 'Challenge with advanced problems'],
    
    nextSteps: [
      'Review weekly progress reports via this portal',
      'Communicate with teacher for specific concerns',
      'Celebrate achievements and progress'
    ],
    
    contactTeacher: 'Please reach out to the teacher if you have any questions or concerns.',
    
    // Traffic light indicators
    trafficLight: {
      academic: avgGrade >= 75 ? 'GREEN' : avgGrade >= 60 ? 'YELLOW' : 'RED',
      attendance: attendanceRate >= 90 ? 'GREEN' : attendanceRate >= 80 ? 'YELLOW' : 'RED',
      overall: overallStatus === 'EXCELLENT' ? 'GREEN' : overallStatus === 'GOOD' || overallStatus === 'SATISFACTORY' ? 'YELLOW' : 'RED'
    }
  };
}

/**
 * Generate class insights for parents (cohort performance)
 */
function generateParentClassInsights(classId) {
  const students = db.students.filter(s => s.classId === classId);
  const reports = students.map(s => generateParentReport(s.id)).filter(r => r !== null);

  const avgClassGrade = reports.reduce((sum, r) => sum + r.academicScore, 0) / Math.max(1, reports.length);
  const avgAttendance = reports.reduce((sum, r) => sum + r.attendancePercentage, 0) / Math.max(1, reports.length);

  return {
    classId,
    classSummary: `Class average: ${Math.round(avgClassGrade)}% | Attendance: ${Math.round(avgAttendance)}%`,
    classPerformance: avgClassGrade >= 75 ? 'STRONG' : avgClassGrade >= 60 ? 'AVERAGE' : 'NEEDS_SUPPORT',
    totalStudents: students.length,
    topPerformers: reports
      .filter(r => r.academicScore >= 80)
      .sort((a, b) => b.academicScore - a.academicScore)
      .slice(0, 5)
      .map(r => ({ name: r.studentName, score: r.academicScore })),
    parentWeeklyUpdate: {
      title: 'Weekly Class Update',
      message: `This week, the class focused on core concepts with good engagement levels. Keep supporting your child with regular homework and attendance.`,
      upcoming: ['Final assessment next week', 'Remedial classes available for interested students']
    }
  };
}

// ==================== CROSS-CLASS COMPARISON ====================

/**
 * Compare student with cohort (other students in same grade)
 */
function compareStudentToCohort(studentId) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  // Get all students in same class for cohort
  const cohortStudents = db.students.filter(s => s.classId === student.classId && s.id !== studentId);
  
  const studentGrade = db.grades.filter(g => g.studentId === studentId);
  const studentAvg = studentGrade.length > 0
    ? studentGrade.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / studentGrade.length
    : 0;

  const cohortAvgs = cohortStudents.map(c => {
    const cGrades = db.grades.filter(g => g.studentId === c.id);
    return cGrades.length > 0
      ? cGrades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / cGrades.length
      : 0;
  });

  const cohortAverage = cohortAvgs.length > 0
    ? cohortAvgs.reduce((sum, avg) => sum + avg, 0) / cohortAvgs.length
    : 0;

  const percentile = Math.round((cohortAvgs.filter(avg => avg <= studentAvg).length / Math.max(1, cohortAvgs.length)) * 100);

  return {
    studentId,
    studentName: student.name,
    studentAverage: Math.round(studentAvg),
    cohortAverage: Math.round(cohortAverage),
    difference: Math.round(studentAvg - cohortAverage),
    percentile,
    rank: {
      position: cohortAvgs.filter(avg => avg > studentAvg).length + 1,
      outOf: cohortStudents.length + 1
    },
    performanceLevel: percentile >= 75 ? 'ABOVE_AVERAGE' : percentile >= 50 ? 'AVERAGE' : 'BELOW_AVERAGE',
    analysis: percentile >= 75
      ? 'Student is performing well above class average'
      : percentile >= 50
      ? 'Student is performing at or near class average'
      : 'Student is below class average; consider support',
    classComparison: {
      topPerformer: Math.max(...cohortAvgs),
      bottomPerformer: Math.min(...cohortAvgs),
      spreadRange: Math.max(...cohortAvgs) - Math.min(...cohortAvgs)
    }
  };
}

// ==================== EXPORTS ====================

module.exports = {
  // Anti-Cheating Proctoring
  initProctoringSession,
  logSuspiciousActivity,
  endProctoringSession,
  getExamIntegritySummary,

  // Schedule Optimization
  analyzeStudentPatterns,
  optimizeClassSchedule,

  // Time-on-Task Analysis
  analyzeTimeOnTask,

  // Parent Insights
  generateParentReport,
  generateParentClassInsights,

  // Cross-Class Comparison
  compareStudentToCohort
};
