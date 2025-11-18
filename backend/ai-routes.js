// AI-Powered Routes for Teacher Management System
const express = require('express');
const router = express.Router();
const aiEngine = require('./ai-engine');

// ==================== PREDICTIVE ANALYTICS ====================

// Get performance prediction for a student
router.get('/predictions/student/:studentId', (req, res) => {
  const prediction = aiEngine.predictStudentPerformance(req.params.studentId);
  if (!prediction) return res.status(404).json({ error: 'Student not found' });
  res.json(prediction);
});

// Get predictions for all students in a class
router.get('/predictions/class/:classId', (req, res) => {
  const { db } = require('./models');
  const students = db.students.filter(s => s.classId === req.params.classId);
  const predictions = students.map(s => aiEngine.predictStudentPerformance(s.id));
  
  const summary = {
    classId: req.params.classId,
    totalStudents: students.length,
    atRisk: predictions.filter(p => p.prediction === 'AT_RISK').length,
    average: predictions.filter(p => p.prediction === 'AVERAGE').length,
    topPerformers: predictions.filter(p => p.prediction === 'TOP').length,
    predictions: predictions.sort((a, b) => a.riskScore - b.riskScore)
  };
  
  res.json(summary);
});

// ==================== KNOWLEDGE GAPS ====================

// Get knowledge gaps for a student
router.get('/gaps/student/:studentId', (req, res) => {
  const gaps = aiEngine.identifyKnowledgeGaps(req.params.studentId);
  res.json({
    studentId: req.params.studentId,
    gaps,
    totalGaps: gaps.length,
    criticalGaps: gaps.filter(g => g.severity === 'CRITICAL')
  });
});

// ==================== ADAPTIVE SUGGESTIONS ====================

// Get revision suggestions for a student
router.get('/suggestions/student/:studentId', (req, res) => {
  const suggestions = aiEngine.generateAdaptiveSuggestions(req.params.studentId);
  res.json(suggestions);
});

// ==================== ANALYTICS & HEATMAPS ====================

// Get performance heatmap for a class
router.get('/analytics/heatmap/:classId', (req, res) => {
  const heatmap = aiEngine.generatePerformanceHeatmap(req.params.classId);
  res.json(heatmap);
});

// Get longitudinal performance tracking
router.get('/analytics/longitudinal/student/:studentId', (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const tracking = aiEngine.getLongitudinalTracking(req.params.studentId, months);
  res.json({
    studentId: req.params.studentId,
    months,
    data: tracking
  });
});

// Get effort vs outcome analysis for a class
router.get('/analytics/effort-outcome/:classId', (req, res) => {
  const analysis = aiEngine.effortOutcomeAnalysis(req.params.classId);
  res.json({
    classId: req.params.classId,
    analysis,
    efficient: analysis.filter(a => a.category === 'EFFICIENT'),
    needsSupport: analysis.filter(a => a.category === 'HIGH_EFFORT_LOW_OUTCOME')
  });
});

// ==================== AUTO-GRADING ====================

// Auto-grade a quiz
router.post('/grade/auto-grade', (req, res) => {
  const { quizId, studentAnswers } = req.body;
  if (!quizId || !studentAnswers) {
    return res.status(400).json({ error: 'quizId and studentAnswers required' });
  }
  const result = aiEngine.autoGradeQuiz(quizId, studentAnswers);
  if (!result) return res.status(404).json({ error: 'Quiz not found' });
  res.json(result);
});

// Get grading insights for a class
router.get('/grade/insights/:classId', (req, res) => {
  const insights = aiEngine.generateGradingInsights(req.params.classId);
  res.json(insights);
});

// ==================== CONTENT GENERATION ====================

// Generate AI quiz
router.post('/generate/quiz', (req, res) => {
  const { classId, topics, difficulty = 'medium', numQuestions = 10 } = req.body;
  if (!classId || !topics || !Array.isArray(topics)) {
    return res.status(400).json({ error: 'classId and topics array required' });
  }
  const quiz = aiEngine.generateAIQuiz(classId, topics, difficulty, numQuestions);
  res.status(201).json(quiz);
});

// Generate remedial worksheet
router.post('/generate/worksheet', (req, res) => {
  const { studentId, topicId, difficulty = 'beginner' } = req.body;
  if (!studentId || !topicId) {
    return res.status(400).json({ error: 'studentId and topicId required' });
  }
  const worksheet = aiEngine.generateRemedialWorksheet(studentId, topicId, difficulty);
  if (!worksheet) return res.status(404).json({ error: 'Student not found' });
  res.status(201).json(worksheet);
});

// ==================== DASHBOARD ENDPOINTS ====================

// Unified AI dashboard for teacher
router.get('/dashboard/:classId', (req, res) => {
  const { db } = require('./models');
  const classId = req.params.classId;
  
  const predictions = (() => {
    const students = db.students.filter(s => s.classId === classId);
    return students.map(s => aiEngine.predictStudentPerformance(s.id));
  })();

  const heatmap = aiEngine.generatePerformanceHeatmap(classId);
  const insights = aiEngine.generateGradingInsights(classId);
  const effortAnalysis = aiEngine.effortOutcomeAnalysis(classId);

  res.json({
    classId,
    summary: {
      totalStudents: db.students.filter(s => s.classId === classId).length,
      atRiskCount: predictions.filter(p => p.prediction === 'AT_RISK').length,
      topPerformersCount: predictions.filter(p => p.prediction === 'TOP').length
    },
    topStudents: predictions.filter(p => p.prediction === 'TOP').slice(0, 5),
    atRiskStudents: predictions.filter(p => p.prediction === 'AT_RISK').slice(0, 5),
    performanceHeatmap: heatmap.classTopicAnalysis,
    gradingInsights: insights,
    effortOutcomeAnalysis: effortAnalysis.slice(0, 10)
  });
});

module.exports = router;
