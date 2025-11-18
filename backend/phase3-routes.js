/**
 * Phase 3: Security, Optimization & Accessibility API Routes
 * Anti-Cheating, Schedule Optimization, Parent Insights
 */

const express = require('express');
const router = express.Router();
const phase3 = require('./phase3-engine');

// ==================== ANTI-CHEATING PROCTORING ====================

/**
 * POST /api/phase3/proctor/start/:examId/:studentId
 * Start a proctoring session
 */
router.post('/proctor/start/:examId/:studentId', (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const session = phase3.initProctoringSession(examId, studentId);
    
    res.json({
      success: true,
      message: 'Proctoring session started',
      sessionId: session.sessionId,
      session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/phase3/proctor/flag/:sessionId
 * Log suspicious activity
 */
router.post('/proctor/flag/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { activityType, severity = 'low', details = {} } = req.body;

    if (!activityType) {
      return res.status(400).json({ error: 'Missing required field: activityType' });
    }

    const flag = phase3.logSuspiciousActivity(sessionId, activityType, severity, details);
    
    if (!flag) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      message: 'Activity logged',
      flag
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/phase3/proctor/end/:sessionId
 * End proctoring session and generate report
 */
router.post('/proctor/end/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const report = phase3.endProctoringSession(sessionId);
    
    if (!report) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      message: 'Proctoring session ended',
      report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phase3/proctor/exam-summary/:examId
 * Get proctoring summary for an exam
 */
router.get('/proctor/exam-summary/:examId', (req, res) => {
  try {
    const { examId } = req.params;
    const summary = phase3.getExamIntegritySummary(examId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCHEDULE OPTIMIZATION ====================

/**
 * GET /api/phase3/schedule/analyze/:studentId
 * Analyze student's performance patterns
 */
router.get('/schedule/analyze/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const patterns = phase3.analyzeStudentPatterns(studentId);
    
    if (!patterns) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phase3/schedule/optimize/:classId
 * Get optimized class schedule
 */
router.get('/schedule/optimize/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const optimized = phase3.optimizeClassSchedule(classId);
    
    res.json({
      success: true,
      data: optimized
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== TIME-ON-TASK ANALYSIS ====================

/**
 * GET /api/phase3/time-task/analyze/:studentId/:assignmentId
 * Analyze time spent on assignment
 */
router.get('/time-task/analyze/:studentId/:assignmentId', (req, res) => {
  try {
    const { studentId, assignmentId } = req.params;
    const analysis = phase3.analyzeTimeOnTask(studentId, assignmentId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Student or assignment not found' });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PARENT INSIGHTS MODE ====================

/**
 * GET /api/phase3/parent/report/:studentId
 * Get parent-friendly report for a student
 */
router.get('/parent/report/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const report = phase3.generateParentReport(studentId);
    
    if (!report) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phase3/parent/class-insights/:classId
 * Get parent-friendly class insights
 */
router.get('/parent/class-insights/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const insights = phase3.generateParentClassInsights(classId);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CROSS-CLASS COMPARISON ====================

/**
 * GET /api/phase3/comparison/cohort/:studentId
 * Compare student with class cohort
 */
router.get('/comparison/cohort/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const comparison = phase3.compareStudentToCohort(studentId);
    
    if (!comparison) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
