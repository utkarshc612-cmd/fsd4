/**
 * AI Engine for Teacher Management System
 * Handles predictive analytics, performance intelligence, and recommendations
 */

const { db } = require('./models');

// ==================== PREDICTIVE SCORING ====================

/**
 * Predict student performance (Fail/Average/Top)
 * Based on: attendance, average marks, trend analysis
 */
function predictStudentPerformance(studentId) {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  const attendance = db.attendance.filter(a => a.studentId === studentId);
  const grades = db.grades.filter(g => g.studentId === studentId);

  if (grades.length === 0) {
    return { studentId, prediction: 'INSUFFICIENT_DATA', confidence: 0, riskScore: 50 };
  }

  // Calculate metrics
  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 50;

  const avgMarks = grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / grades.length;
  const avgPercentage = (avgMarks / 100) * 100;

  // Calculate trend (improving/declining/stable)
  const recentGrades = grades.slice(-5).map(g => g.marksObtained || 0);
  const oldGrades = grades.slice(0, Math.max(1, Math.floor(grades.length / 2))).map(g => g.marksObtained || 0);
  const recentAvg = recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length;
  const oldAvg = oldGrades.reduce((a, b) => a + b, 0) / oldGrades.length;
  const trendDelta = recentAvg - oldAvg;

  // Risk score (0-100, lower is better)
  let riskScore = 100 - avgPercentage;
  riskScore = riskScore * 0.6 + (100 - attendanceRate) * 0.4; // weighted avg

  let prediction = 'AVERAGE';
  let confidence = 0;

  if (avgPercentage >= 80 && attendanceRate >= 85) {
    prediction = 'TOP';
    confidence = Math.min(95, avgPercentage);
  } else if (avgPercentage < 40 || attendanceRate < 60) {
    prediction = 'AT_RISK';
    confidence = Math.min(95, 100 - avgPercentage);
  } else {
    prediction = 'AVERAGE';
    confidence = 75;
  }

  return {
    studentId,
    studentName: student.name,
    prediction,
    confidence: Math.round(confidence),
    avgPercentage: Math.round(avgPercentage),
    attendanceRate,
    trendDelta: Math.round(trendDelta * 100) / 100,
    riskScore: Math.round(riskScore),
    recommendation: generateRecommendation(prediction, trendDelta, attendanceRate)
  };
}

/**
 * Identify knowledge gaps for a student
 */
function identifyKnowledgeGaps(studentId, classId = null) {
  const grades = db.grades.filter(g => g.studentId === studentId);
  if (grades.length === 0) return [];

  const gapsByTopic = {};

  grades.forEach(grade => {
    const assignment = db.assignments.find(a => a.id === grade.assignmentId);
    if (!assignment) return;

    const topic = assignment.title;
    const percentage = grade.marksObtained ? (grade.marksObtained / (assignment.totalMarks || 100)) * 100 : 0;

    if (!gapsByTopic[topic]) {
      gapsByTopic[topic] = { scores: [], feedback: [] };
    }
    gapsByTopic[topic].scores.push(percentage);
    if (grade.feedback) gapsByTopic[topic].feedback.push(grade.feedback);
  });

  // Identify weak topics (< 60%)
  const gaps = Object.entries(gapsByTopic)
    .map(([topic, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      return {
        topic,
        avgPercentage: Math.round(avgScore),
        attemptCount: data.scores.length,
        severity: avgScore < 40 ? 'CRITICAL' : avgScore < 60 ? 'HIGH' : 'MEDIUM',
        commonIssues: data.feedback.slice(0, 3)
      };
    })
    .filter(g => g.avgPercentage < 75)
    .sort((a, b) => a.avgPercentage - b.avgPercentage);

  return gaps;
}

/**
 * Generate adaptive revision suggestions
 */
function generateAdaptiveSuggestions(studentId, classId = null) {
  const gaps = identifyKnowledgeGaps(studentId, classId);
  const performance = predictStudentPerformance(studentId);

  const suggestions = gaps.slice(0, 5).map((gap, idx) => ({
    priority: idx + 1,
    topic: gap.topic,
    currentLevel: gap.avgPercentage,
    targetLevel: 75,
    estimatedHours: Math.ceil((75 - gap.avgPercentage) / 10),
    suggestedResources: generateResourceSuggestions(gap.topic),
    practiceProblems: generatePracticeSet(gap.topic, 'beginner')
  }));

  return {
    studentId,
    nextClassFocus: suggestions.slice(0, 3),
    allGaps: gaps,
    overallStrategy: performance.prediction === 'AT_RISK'
      ? 'Intensive focus on critical gaps + daily practice'
      : performance.trendDelta < 0
        ? 'Stop declining trend: Review basics + consistent practice'
        : 'Consolidate strengths + advance to next level'
  };
}

// ==================== ANALYTICS ENGINE ====================

/**
 * Generate concept-wise performance heatmap
 */
function generatePerformanceHeatmap(classId) {
  const students = db.students.filter(s => s.classId === classId);
  const grades = db.grades.filter(g => g.classId === classId);

  const heatmap = {};

  students.forEach(student => {
    heatmap[student.id] = {
      name: student.name,
      topics: {}
    };
  });

  const assignments = db.assignments.filter(a => a.classId === classId);
  assignments.forEach(assignment => {
    const topic = assignment.title;

    grades.forEach(grade => {
      if (grade.assignmentId === assignment.id && heatmap[grade.studentId]) {
        const percentage = grade.marksObtained ? (grade.marksObtained / (assignment.totalMarks || 100)) * 100 : 0;
        if (!heatmap[grade.studentId].topics[topic]) {
          heatmap[grade.studentId].topics[topic] = [];
        }
        heatmap[grade.studentId].topics[topic].push(percentage);
      }
    });
  });

  // Calculate averages for heatmap
  const heatmapData = Object.entries(heatmap).map(([studentId, data]) => {
    const topicAverages = {};
    Object.entries(data.topics).forEach(([topic, scores]) => {
      topicAverages[topic] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });
    return {
      studentId,
      studentName: data.name,
      topicPerformance: topicAverages,
      overallAverage: Object.values(topicAverages).reduce((a, b) => a + b, 0) / Object.keys(topicAverages).length
    };
  });

  // Find hot (strong) and cold (weak) topics across class
  const topicStats = {};
  assignments.forEach(assignment => {
    const topic = assignment.title;
    const topicGrades = grades.filter(g => g.assignmentId === assignment.id);
    const topicScores = topicGrades.map(g => g.marksObtained || 0);
    topicStats[topic] = {
      avgScore: topicScores.reduce((a, b) => a + b, 0) / Math.max(1, topicScores.length),
      attemptCount: topicScores.length
    };
  });

  return {
    classId,
    studentData: heatmapData,
    classTopicAnalysis: Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      classAverage: Math.round(stats.avgScore),
      difficulty: stats.avgScore < 50 ? 'HARD' : stats.avgScore < 70 ? 'MEDIUM' : 'EASY',
      attempts: stats.attemptCount
    }))
  };
}

/**
 * Longitudinal performance tracking
 */
function getLongitudinalTracking(studentId, monthsBack = 6) {
  const grades = db.grades.filter(g => g.studentId === studentId);
  if (grades.length === 0) return [];

  // Group by month
  const byMonth = {};
  const now = new Date();

  grades.forEach(grade => {
    const gradedAt = new Date(grade.gradedAt || now);
    const monthKey = `${gradedAt.getFullYear()}-${String(gradedAt.getMonth() + 1).padStart(2, '0')}`;

    if (!byMonth[monthKey]) {
      byMonth[monthKey] = [];
    }
    byMonth[monthKey].push(grade.marksObtained || 0);
  });

  const tracking = Object.entries(byMonth)
    .sort()
    .slice(-monthsBack)
    .map(([month, scores]) => ({
      month,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
      trend: scores.length > 1 ? (scores[scores.length - 1] - scores[0] > 0 ? 'UP' : 'DOWN') : 'STABLE'
    }));

  return tracking;
}

/**
 * Effort vs Outcome Analysis
 */
function effortOutcomeAnalysis(classId) {
  const students = db.students.filter(s => s.classId === classId);
  const attendance = db.attendance.filter(a => a.classId === classId);
  const grades = db.grades.filter(g => g.classId === classId);

  const analysis = students.map(student => {
    const studentAttendance = attendance.filter(a => a.studentId === student.id);
    const studentGrades = grades.filter(g => g.studentId === student.id);

    const effortScore = studentAttendance.length > 0
      ? Math.round((studentAttendance.filter(a => a.status === 'present').length / studentAttendance.length) * 100)
      : 0;

    const outcomeScore = studentGrades.length > 0
      ? Math.round(studentGrades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / studentGrades.length)
      : 0;

    const efficiency = effortScore > 0 ? Math.round((outcomeScore / effortScore) * 100) : 0;

    return {
      studentId: student.id,
      studentName: student.name,
      effortScore,
      outcomeScore,
      efficiency,
      category: effortScore >= 80 && outcomeScore >= 75 ? 'EFFICIENT'
        : effortScore >= 80 && outcomeScore < 75 ? 'HIGH_EFFORT_LOW_OUTCOME'
          : effortScore < 60 ? 'LOW_EFFORT'
            : 'AVERAGE'
    };
  }).sort((a, b) => b.efficiency - a.efficiency);

  return analysis;
}

// ==================== AUTO-GRADING & INSIGHTS ====================

/**
 * Auto-grade multiple choice quiz
 */
function autoGradeQuiz(quizId, studentAnswers) {
  // quizId is the assignment ID, studentAnswers = { questionId: selectedOption }
  const assignment = db.assignments.find(a => a.id === quizId);
  if (!assignment) return null;

  // For now, mock scoring (in real system, store correct answers)
  const correctCount = Object.keys(studentAnswers).length * 0.7; // 70% assumed correct
  const totalQuestions = Object.keys(studentAnswers).length;
  const score = Math.round((correctCount / totalQuestions) * (assignment.totalMarks || 100));

  const insights = {
    quizId,
    score,
    percentage: Math.round((score / (assignment.totalMarks || 100)) * 100),
    totalQuestions,
    correctAnswers: Math.round(correctCount),
    timeSpent: null,
    recommendations: score < 60
      ? ['Review fundamentals', 'Practice more similar questions', 'Ask teacher for help']
      : score < 80
        ? ['Good effort! Focus on edge cases', 'Practice variations of these concepts']
        : ['Excellent performance! Move to advanced topics']
  };

  return insights;
}

/**
 * Generate instant insights after grading
 */
function generateGradingInsights(classId) {
  const grades = db.grades.filter(g => g.classId === classId);
  const students = db.students.filter(s => s.classId === classId);

  const classAverage = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / grades.length)
    : 0;

  const topStudents = [];
  const strugglingStudents = [];

  students.forEach(student => {
    const studentGrades = grades.filter(g => g.studentId === student.id);
    if (studentGrades.length === 0) return;

    const avgMarks = studentGrades.reduce((sum, g) => sum + (g.marksObtained || 0), 0) / studentGrades.length;
    if (avgMarks > classAverage + 15) {
      topStudents.push({ name: student.name, average: Math.round(avgMarks) });
    } else if (avgMarks < classAverage - 15) {
      strugglingStudents.push({ name: student.name, average: Math.round(avgMarks) });
    }
  });

  return {
    classId,
    classAverage,
    totalStudents: students.length,
    topPerformers: topStudents.sort((a, b) => b.average - a.average).slice(0, 5),
    needsIntervention: strugglingStudents.sort((a, b) => a.average - b.average).slice(0, 5),
    actionItems: [
      `${topStudents.length} students performing exceptionally well`,
      `${strugglingStudents.length} students need targeted intervention`,
      `Class average is ${classAverage}%`
    ]
  };
}

// ==================== AI-GENERATED CONTENT ====================

/**
 * Generate AI quiz based on topics
 */
function generateAIQuiz(classId, topics, difficulty = 'medium', numQuestions = 10) {
  const questions = [];

  topics.forEach(topic => {
    const count = Math.ceil(numQuestions / topics.length);
    for (let i = 0; i < count && questions.length < numQuestions; i++) {
      questions.push({
        id: Math.random().toString(36).substr(2, 9),
        topic,
        question: `${topic} - ${difficulty} level question ${i + 1}?`,
        type: 'mcq',
        difficulty,
        marks: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
        options: [
          { id: 'a', text: 'Option A' },
          { id: 'b', text: 'Option B' },
          { id: 'c', text: 'Option C' },
          { id: 'd', text: 'Option D' }
        ],
        correctAnswer: 'a', // Mock answer
        explanation: `This tests your understanding of ${topic}`
      });
    }
  });

  return {
    quizId: Math.random().toString(36).substr(2, 9),
    classId,
    topics,
    difficulty,
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    totalQuestions: questions.length,
    questions,
    estimatedTime: Math.ceil(numQuestions * 2.5), // ~2.5 min per question
    instructions: `Answer all ${numQuestions} questions. Difficulty: ${difficulty}`
  };
}

/**
 * Generate remedial worksheet for weak students
 */
function generateRemedialWorksheet(studentId, topicId, difficulty = 'beginner') {
  const student = db.students.find(s => s.id === studentId);
  if (!student) return null;

  const problems = [];
  const problemTypes = ['concept-definition', 'simple-example', 'numerical', 'word-problem'];

  for (let i = 0; i < 8; i++) {
    problems.push({
      id: i + 1,
      type: problemTypes[i % problemTypes.length],
      problem: `${topicId} - Problem ${i + 1} (${difficulty} difficulty)`,
      hints: ['Read carefully', 'Break into steps', 'Check your work'],
      solutionSteps: []
    });
  }

  return {
    worksheetId: Math.random().toString(36).substr(2, 9),
    studentId,
    studentName: student.name,
    topic: topicId,
    difficulty,
    totalProblems: problems.length,
    estimatedTime: '45-60 minutes',
    problems,
    instructions: `Complete all problems. This worksheet targets ${topicId} at ${difficulty} level`,
    reviewAfter: 'Compare with answer key and mark your progress'
  };
}

// ==================== HELPER FUNCTIONS ====================

function generateRecommendation(prediction, trendDelta, attendance) {
  if (prediction === 'AT_RISK') {
    return 'Schedule intervention meeting immediately. Focus on attendance and fundamentals.';
  } else if (prediction === 'TOP') {
    return 'Encourage advanced topics. Consider as peer mentor.';
  } else {
    return trendDelta < 0
      ? 'Performance declining. Provide extra support.'
      : 'Keep up the steady progress!';
  }
}

function generateResourceSuggestions(topic) {
  return [
    `Video: ${topic} explained step-by-step`,
    `Interactive tool: Practice ${topic} problems`,
    `Reading: ${topic} fundamentals guide`,
    `Quiz: ${topic} self-assessment`
  ];
}

function generatePracticeSet(topic, level) {
  return [
    { id: 1, problem: `${topic} - ${level} level problem 1`, marks: 5 },
    { id: 2, problem: `${topic} - ${level} level problem 2`, marks: 5 },
    { id: 3, problem: `${topic} - ${level} level problem 3`, marks: 5 }
  ];
}

// ==================== EXPORTS ====================

module.exports = {
  // Predictions
  predictStudentPerformance,
  identifyKnowledgeGaps,
  generateAdaptiveSuggestions,

  // Analytics
  generatePerformanceHeatmap,
  getLongitudinalTracking,
  effortOutcomeAnalysis,

  // Auto-Grading
  autoGradeQuiz,
  generateGradingInsights,

  // Content Generation
  generateAIQuiz,
  generateRemedialWorksheet
};
