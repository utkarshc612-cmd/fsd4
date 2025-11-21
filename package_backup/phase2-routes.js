/**
 * Phase 2: Advanced Monitoring & Intelligence API Routes
 * Smart Classroom, Lesson Planning, Feedback Generation
 */

const express = require('express');
const router = express.Router();
const phase2 = require('./phase2-engine');

// ==================== SMART CLASSROOM MONITORING ====================

/**
 * POST /api/phase2/classroom/doubt
 * Log a student's doubt in class
 */
router.post('/classroom/doubt', (req, res) => {
  try {
    const { classId, studentId, conceptId } = req.body;
    
    if (!classId || !studentId || !conceptId) {
      return res.status(400).json({ 
        error: 'Missing required fields: classId, studentId, conceptId' 
      });
    }

    const doubt = phase2.logStudentDoubt(classId, studentId, conceptId);
    res.json({
      success: true,
      message: 'Doubt logged successfully',
      doubt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phase2/classroom/dashboard/:classId
 * Get real-time classroom monitoring dashboard
 */
router.get('/classroom/dashboard/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const dashboard = phase2.getClassroomDashboard(classId);
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/phase2/classroom/doubt/resolve/:doubtId
 * Mark a doubt as resolved
 */
router.post('/classroom/doubt/resolve/:doubtId', (req, res) => {
  try {
    const { doubtId } = req.params;
    const resolved = phase2.resolveDoubt(doubtId);
    
    if (!resolved) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    res.json({
      success: true,
      message: 'Doubt marked as resolved',
      doubt: resolved
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phase2/classroom/engagement/:classId
 * Get engagement/attention heatmap
 */
router.get('/classroom/engagement/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const heatmap = phase2.getEngagementHeatmap(classId);
    
    res.json({
      success: true,
      data: heatmap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LESSON PLANNING ====================

/**
 * POST /api/phase2/lesson/generate
 * Generate AI lesson plan
 */
router.post('/lesson/generate', (req, res) => {
  try {
    const { classId, topicId, duration = 60 } = req.body;
    
    if (!classId || !topicId) {
      return res.status(400).json({ 
        error: 'Missing required fields: classId, topicId' 
      });
    }

    const lessonPlan = phase2.generateLessonPlan(classId, topicId, duration);
    
    res.json({
      success: true,
      data: lessonPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phase2/lesson/suggest-time/:classId
 * Get suggested optimal lesson time based on class patterns
 */
router.get('/lesson/suggest-time/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const suggestion = phase2.getSuggestedLessonTime(classId);
    
    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FEEDBACK GENERATION ====================

/**
 * GET /api/phase2/feedback/student/:studentId
 * Generate personalized feedback for a student
 */
router.get('/feedback/student/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const feedback = phase2.generateStudentFeedback(studentId);
    
    if (!feedback) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/phase2/feedback/class/:classId
 * Generate feedback for entire class
 */
router.get('/feedback/class/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const feedback = phase2.generateClassFeedback(classId);
    
    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONTENT RECOMMENDATIONS ====================

/**
 * GET /api/phase2/content/recommend/:studentId/:classId
 * Get content recommendations for a student
 */
router.get('/content/recommend/:studentId/:classId', (req, res) => {
  try {
    const { studentId, classId } = req.params;
    const recommendations = phase2.recommendContent(studentId, classId);
    
    if (!recommendations) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
