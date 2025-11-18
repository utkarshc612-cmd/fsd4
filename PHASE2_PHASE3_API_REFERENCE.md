# Phase 2 & Phase 3: API Reference

## Base URL
```
http://localhost:3000/api/phase2/
http://localhost:3000/api/phase3/
```

---

## Phase 2: Smart Classroom & Lesson Planning API

### 1. Classroom Monitoring

#### Log Student Doubt
```
POST /api/phase2/classroom/doubt

Request Body:
{
  "classId": "class_001",
  "studentId": "student_001",
  "conceptId": "quadratic_equations"
}

Response (200):
{
  "success": true,
  "message": "Doubt logged successfully",
  "doubt": {
    "id": "doubt_abc123",
    "classId": "class_001",
    "studentId": "student_001",
    "conceptId": "quadratic_equations",
    "timestamp": "2024-01-15T10:30:00Z",
    "resolved": false
  }
}

Error (400):
{
  "error": "Missing required fields: classId, studentId, conceptId"
}
```

#### Get Classroom Dashboard
```
GET /api/phase2/classroom/dashboard/:classId

Response (200):
{
  "success": true,
  "data": {
    "classId": "class_001",
    "totalDoubtStudents": 4,
    "totalUnresolvedDoubts": 7,
    "studentDoubts": {
      "student_001": {
        "name": "Alice",
        "doubts": 2,
        "concepts": ["quadratic_equations", "integration"]
      },
      ...
    },
    "conceptHotspots": [
      {
        "concept": "quadratic_equations",
        "count": 3
      },
      {
        "concept": "integration",
        "count": 2
      }
    ],
    "recentDoubts": [...]
  }
}
```

#### Resolve Doubt
```
POST /api/phase2/classroom/doubt/resolve/:doubtId

Response (200):
{
  "success": true,
  "message": "Doubt marked as resolved",
  "doubt": {
    "id": "doubt_abc123",
    "resolved": true,
    ...
  }
}

Error (404):
{
  "error": "Doubt not found"
}
```

#### Get Engagement Heatmap
```
GET /api/phase2/classroom/engagement/:classId

Response (200):
{
  "success": true,
  "data": {
    "classId": "class_001",
    "engagement": [
      {
        "studentId": "student_001",
        "studentName": "Alice",
        "engagementScore": 85,
        "status": "HIGH"
      },
      {
        "studentId": "student_002",
        "studentName": "Bob",
        "engagementScore": 62,
        "status": "MEDIUM"
      },
      {
        "studentId": "student_003",
        "studentName": "Charlie",
        "engagementScore": 45,
        "status": "LOW"
      }
    ],
    "avgEngagement": 72,
    "lowEngagementStudents": [...]
  }
}
```

---

### 2. Lesson Planning

#### Generate Lesson Plan
```
POST /api/phase2/lesson/generate

Request Body:
{
  "classId": "class_001",
  "topicId": "Quadratic Equations",
  "duration": 60
}

Response (200):
{
  "success": true,
  "data": {
    "planId": "plan_xyz789",
    "classId": "class_001",
    "topicId": "Quadratic Equations",
    "totalDuration": 60,
    "sections": [
      {
        "name": "Introduction",
        "duration": 6,
        "activities": [
          "Hook/Engagement activity",
          "Learning objectives overview"
        ]
      },
      {
        "name": "Concept Development",
        "duration": 24,
        "activities": [
          "Direct instruction",
          "Visual demonstrations",
          "Real-world examples"
        ]
      },
      ...
    ],
    "learningObjectives": [
      "Students will understand basic concepts of Quadratic Equations",
      "Students will solve problems involving Quadratic Equations",
      "Students will apply Quadratic Equations to real-world scenarios"
    ],
    "assessmentMethods": [
      "Observation",
      "Questioning",
      "Independent work",
      "Group discussion"
    ],
    "resources": [
      "Textbook: Chapter on Quadratic Equations",
      "Digital resources/videos",
      "Practice worksheets",
      "Interactive tools"
    ],
    "differentiation": {
      "forAdvanced": [
        "Extension problems on Quadratic Equations",
        "Peer teaching opportunities"
      ],
      "forStruggling": [
        "Simplified worksheet on Quadratic Equations",
        "Visual aids",
        "One-on-one support"
      ]
    },
    "homework": {
      "duration": 30,
      "description": "Practice exercises on Quadratic Equations (Page X, Questions 1-10)",
      "followUp": "Review homework answers in next class"
    }
  }
}

Error (400):
{
  "error": "Missing required fields: classId, topicId"
}
```

#### Suggest Optimal Lesson Time
```
GET /api/phase2/lesson/suggest-time/:classId

Response (200):
{
  "success": true,
  "data": {
    "classId": "class_001",
    "suggestedDayOfWeek": "Mid-week (Wed-Thu)",
    "suggestedTimeSlot": "Morning (9-11 AM)",
    "reason": "High attendance mid-week suggests best focus time"
  }
}
```

---

### 3. Feedback Generation

#### Generate Student Feedback
```
GET /api/phase2/feedback/student/:studentId

Response (200):
{
  "success": true,
  "data": {
    "studentId": "student_001",
    "studentName": "Alice",
    "generatedDate": "2024-01-15T10:30:00Z",
    "overallGrade": 82,
    "attendanceRate": 94,
    "strengths": [
      "Excellent command of concepts",
      "Consistent high performance",
      "Strong performance in: Algebra, Calculus"
    ],
    "areasForImprovement": [
      "Continue current study approach"
    ],
    "studyTips": [
      "Challenge yourself with advanced problems",
      "Help peers with difficult concepts"
    ],
    "overallComment": "Outstanding work! You are demonstrating mastery of the subject. Keep up this excellent work!",
    "recommendedActions": [
      "Continue current study approach",
      "Maintain good attendance",
      "Targeted practice on weak topics"
    ]
  }
}

Error (404):
{
  "error": "Student not found"
}
```

#### Generate Class Feedback
```
GET /api/phase2/feedback/class/:classId

Response (200):
{
  "success": true,
  "data": {
    "classId": "class_001",
    "totalStudents": 28,
    "classAverageGrade": 74,
    "studentsNeedingSupport": 4,
    "excellentPerformers": 6,
    "feedback": [
      {
        "studentId": "student_001",
        "studentName": "Alice",
        "feedback": {...}
      },
      ...
    ],
    "classRecommendations": [
      "Class is performing well overall",
      "Provide additional support to 4 students",
      "Continue current approach"
    ]
  }
}
```

---

### 4. Content Recommendations

#### Get Content Recommendations
```
GET /api/phase2/content/recommend/:studentId/:classId

Response (200):
{
  "success": true,
  "data": {
    "studentId": "student_001",
    "studentName": "Alice",
    "recommendations": [
      {
        "topic": "Algebra Fundamentals",
        "severity": "high",
        "suggestedContent": {
          "videos": [
            {
              "title": "Basics of Algebra - Khan Academy",
              "url": "youtube.com",
              "level": "beginner",
              "rating": 4.8
            }
          ],
          "mcqs": [
            {
              "title": "10 MCQs on Algebra",
              "count": 10,
              "level": "medium",
              "rating": 4.6
            }
          ],
          "pyqs": [
            {
              "title": "Algebra - Last 5 Years PYQ",
              "count": 25,
              "level": "hard",
              "rating": 4.9
            }
          ],
          "notes": [
            {
              "title": "Algebra Quick Reference",
              "pages": 15,
              "level": "medium",
              "rating": 4.6
            }
          ]
        }
      }
    ],
    "totalResources": 8
  }
}

Error (404):
{
  "error": "Student not found"
}
```

---

## Phase 3: Security, Optimization & Accessibility API

### 1. Anti-Cheating Proctoring

#### Start Proctoring Session
```
POST /api/phase3/proctor/start/:examId/:studentId

Response (200):
{
  "success": true,
  "message": "Proctoring session started",
  "sessionId": "session_abc123",
  "session": {
    "sessionId": "session_abc123",
    "examId": "exam_001",
    "studentId": "student_001",
    "startTime": "2024-01-15T10:30:00Z",
    "endTime": null,
    "flags": [],
    "tabSwitches": 0,
    "webcamAlert": false,
    "audioAlert": false,
    "screenShare": false,
    "status": "ACTIVE"
  }
}
```

#### Log Suspicious Activity
```
POST /api/phase3/proctor/flag/:sessionId

Request Body:
{
  "activityType": "tab-switch",
  "severity": "medium",
  "details": {
    "fromApp": "Exam",
    "toApp": "Browser",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}

Response (200):
{
  "success": true,
  "message": "Activity logged",
  "flag": {
    "flagId": "flag_xyz789",
    "timestamp": "2024-01-15T10:35:00Z",
    "type": "tab-switch",
    "severity": "medium",
    "details": {...}
  }
}

Error (400):
{
  "error": "Missing required field: activityType"
}

Error (404):
{
  "error": "Session not found"
}
```

**Valid Activity Types:**
- `tab-switch` - Student switched tabs/windows
- `audio-detected` - Ambient audio detected
- `multiple-faces` - Multiple faces in webcam
- `face-missing` - Student face not in frame
- `screenshot` - Screenshot attempt detected
- `second-screen` - Multiple displays detected

#### End Proctoring Session
```
POST /api/phase3/proctor/end/:sessionId

Response (200):
{
  "success": true,
  "message": "Proctoring session ended",
  "report": {
    "sessionId": "session_abc123",
    "studentId": "student_001",
    "examId": "exam_001",
    "duration": 45,
    "totalFlags": 5,
    "highSeverityFlags": 1,
    "mediumSeverityFlags": 2,
    "integrityScore": 82,
    "flagSummary": {
      "tabSwitches": 3,
      "webcamAlerts": 1,
      "audioDetected": 0,
      "screenShareDetected": 0
    },
    "recommendation": "REVIEW - Minor suspicious activity detected",
    "status": "COMPLETED"
  }
}
```

#### Get Exam Integrity Summary
```
GET /api/phase3/proctor/exam-summary/:examId

Response (200):
{
  "success": true,
  "data": {
    "examId": "exam_001",
    "totalStudents": 25,
    "avgIntegrityScore": 87,
    "studentsFlagged": 3,
    "flaggedStudents": [
      {
        "studentId": "student_005",
        "integrityScore": 72,
        "flags": 8,
        "recommendation": "INVESTIGATE - Multiple suspicious activities"
      }
    ],
    "overallSecurity": "SECURE"
  }
}
```

---

### 2. Schedule Optimization

#### Analyze Student Patterns
```
GET /api/phase3/schedule/analyze/:studentId

Response (200):
{
  "success": true,
  "data": {
    "studentId": "student_001",
    "studentName": "Alice",
    "bestDaysForStudy": ["Monday", "Tuesday"],
    "bestTimeSlots": ["morning", "late-morning"],
    "patternInsights": [
      "Highest performance on Monday mornings",
      "95/102 attendance rate",
      "Average grade: 82"
    ]
  }
}

Error (404):
{
  "error": "Student not found"
}
```

#### Optimize Class Schedule
```
GET /api/phase3/schedule/optimize/:classId

Response (200):
{
  "success": true,
  "data": {
    "classId": "class_001",
    "totalStudents": 28,
    "recommendedSchedule": {
      "days": ["Monday", "Tuesday", "Wednesday"],
      "timeSlots": ["morning", "late-morning", "afternoon"]
    },
    "expectedAttendanceImprovement": "+15%",
    "reasoning": "Based on 28 students' performance patterns",
    "implementationNotes": [
      "Schedule main lectures on Monday during morning",
      "Reserve afternoon slots for review and practice",
      "Schedule assessments on high-engagement days"
    ]
  }
}
```

---

### 3. Time-on-Task Analysis

#### Analyze Time on Task
```
GET /api/phase3/time-task/analyze/:studentId/:assignmentId

Response (200):
{
  "success": true,
  "data": {
    "studentId": "student_001",
    "studentName": "Alice",
    "assignmentId": "assign_001",
    "assignmentTitle": "Chapter 5 Quiz",
    "expectedTime": "48 minutes",
    "actualTime": "42 minutes",
    "timeRatio": "88%",
    "efficiency": "115%",
    "marksObtained": 85,
    "totalMarks": 100,
    "percentageScore": 85,
    "insights": "Reasonable time investment",
    "recommendations": [
      "Continue current approach",
      "Help struggling classmates"
    ]
  }
}

Error (404):
{
  "error": "Student or assignment not found"
}
```

---

### 4. Parent Insights

#### Generate Parent Report
```
GET /api/phase3/parent/report/:studentId

Response (200):
{
  "success": true,
  "data": {
    "studentName": "Alice",
    "studentId": "student_001",
    "reportDate": "1/15/2024",
    "overallPerformance": "GOOD",
    "academicScore": 82,
    "attendancePercentage": 94,
    "summary": "Alice is performing at a good level.",
    "highlights": [
      "Current average score: 82%",
      "Attendance rate: 94%",
      "Completed 24 assessments"
    ],
    "keyStrengths": [
      "Strong grasp of core concepts",
      "Good exam preparation",
      "Consistent effort"
    ],
    "areasToSupport": [
      "Maintain current study habits",
      "Challenge with advanced problems"
    ],
    "nextSteps": [
      "Review weekly progress reports via this portal",
      "Communicate with teacher for specific concerns",
      "Celebrate achievements and progress"
    ],
    "contactTeacher": "Please reach out to the teacher if you have any questions or concerns.",
    "trafficLight": {
      "academic": "GREEN",
      "attendance": "GREEN",
      "overall": "GREEN"
    }
  }
}

Error (404):
{
  "error": "Student not found"
}
```

#### Generate Class Parent Insights
```
GET /api/phase3/parent/class-insights/:classId

Response (200):
{
  "success": true,
  "data": {
    "classId": "class_001",
    "classSummary": "Class average: 74% | Attendance: 88%",
    "classPerformance": "AVERAGE",
    "totalStudents": 28,
    "topPerformers": [
      {
        "name": "Alice",
        "score": 92
      },
      {
        "name": "Bob",
        "score": 88
      }
    ],
    "parentWeeklyUpdate": {
      "title": "Weekly Class Update",
      "message": "This week, the class focused on core concepts with good engagement levels...",
      "upcoming": [
        "Final assessment next week",
        "Remedial classes available for interested students"
      ]
    }
  }
}
```

---

### 5. Cross-Class Comparison

#### Compare Student with Cohort
```
GET /api/phase3/comparison/cohort/:studentId

Response (200):
{
  "success": true,
  "data": {
    "studentId": "student_001",
    "studentName": "Alice",
    "studentAverage": 82,
    "cohortAverage": 74,
    "difference": 8,
    "percentile": 85,
    "rank": {
      "position": 4,
      "outOf": 28
    },
    "performanceLevel": "ABOVE_AVERAGE",
    "analysis": "Student is performing well above class average",
    "classComparison": {
      "topPerformer": 95,
      "bottomPerformer": 52,
      "spreadRange": 43
    }
  }
}

Error (404):
{
  "error": "Student not found"
}
```

---

## Error Handling

All endpoints return consistent error responses:

### 400 Bad Request
```json
{
  "error": "Description of what went wrong"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

---

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {...} OR "message": "...",
  "sessionId": "..." (for specific endpoints)
}
```

---

## Rate Limiting

Currently no rate limiting. Production deployment should implement:
- 100 requests/minute per IP
- 1000 requests/minute per authenticated user

---

## Authentication

All endpoints require valid teacher token (from login).
Token passed via HTTP header: `Authorization: Bearer <token>`

Currently not enforced in development mode.

---

## Testing

### cURL Examples

**Get Classroom Dashboard:**
```bash
curl "http://localhost:3000/api/phase2/classroom/dashboard/class_001"
```

**Generate Lesson Plan:**
```bash
curl -X POST "http://localhost:3000/api/phase2/lesson/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class_001",
    "topicId": "Algebra",
    "duration": 60
  }'
```

**Generate Parent Report:**
```bash
curl "http://localhost:3000/api/phase3/parent/report/student_001"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial Phase 2 & Phase 3 release |

---

**Last Updated:** January 15, 2024
