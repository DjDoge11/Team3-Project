import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses } from '../data/courseCatalog';
import './Services.css';
import CourseDropdown from '../components/CourseDropdown';

export default function Courses() {
  const [courses, setCourses] = useState(() => {
    try {
      const s = localStorage.getItem('courseSelections');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [courseGrades, setCourseGrades] = useState(() => {
    try {
      const s = localStorage.getItem('courseGrades');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [_dropdownOpen, _setDropdownOpen] = useState({});
  const [searchText, setSearchText] = useState({});
  const [_highlightedIndex, _setHighlightedIndex] = useState({});
  const [totalCredits, setTotalCredits] = useState(() => {
    try { const s = localStorage.getItem('totalCredits'); return s ? Number(s) : 0; } catch { return 0; }
  });
  const [showTips, setShowTips] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedSections, setLockedSections] = useState(() => {
    try { const s = localStorage.getItem('lockedSections'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const gradeColors = {
    'A': '#00B4D8',
    'B': '#2ecc71',
    'C': '#f1c40f',
    'D': '#e67e22',
    'F': '#e74c3c',
    '': 'white'
  };

  // --- Centralized Save Helper ---
  const syncToFirebase = async (updates) => {
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        // Use merge: true so we don't overwrite other fields (like profile info)
        await setDoc(userDocRef, updates, { merge: true });
        setSaveStatus('Changes saved to account');
        setTimeout(() => setSaveStatus(''), 1500);
      } catch (e) {
        console.error('Error syncing to Firebase:', e);
        setSaveStatus('Error saving to cloud');
      }
    }
  };

  useEffect(() => {
    // Load any saved state from localStorage first (allows offline use)
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Merge cloud data with local state when appropriate
            if (data.courses) setCourses(prev => ({ ...prev, ...data.courses }));
            if (data.courseGrades) setCourseGrades(prev => ({ ...prev, ...data.courseGrades }));
            if (data.lockedSections) setLockedSections(prev => ({ ...prev, ...data.lockedSections }));
            if (data.totalCredits) setTotalCredits(data.totalCredits);
            setSaveStatus('Schedule loaded');
            setTimeout(() => setSaveStatus(''), 2000);
          }
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGradeChange = async (inputKey, gradeIndex, value) => {
    const [grade, semester] = inputKey.split('-');
    if (isSectionLocked(grade, semester)) return;

    const gradeKey = `${inputKey}-g${gradeIndex}`;
    const newGrades = { ...courseGrades, [gradeKey]: value };
    setCourseGrades(newGrades);
    try { localStorage.setItem('courseGrades', JSON.stringify(newGrades)); } catch { /* ignore */ }

    // Immediate Cloud Save
    await syncToFirebase({ courseGrades: newGrades });
  };

  const lockSection = async (grade, semester) => {
    // Validate that all course inputs and both grade inputs are filled for every slot
    const complete = semesterIsComplete(grade, semester);
    if (!complete) {
      setSaveStatus('Fill all course and grade fields before locking this semester.');
      setTimeout(() => setSaveStatus(''), 2500);
      return;
    }

    const sectionKey = `${grade}-${semester}`;
    const newLocked = { ...lockedSections, [sectionKey]: true };
    setLockedSections(newLocked);
    // persist locally so offline users keep their locked state
    try { localStorage.setItem('lockedSections', JSON.stringify(newLocked)); } catch { /* ignore */ }

    // compute credits for this semester (count selected courses in this semester)
    let semesterCount = 0;
    classSlots.forEach((slot) => {
      const key = `${grade}-${semester}-${slot}`;
      if (courses[key] && courses[key] in availableCourses) semesterCount += 1;
    });
    const semesterCredits = semesterCount * 10;
    const newTotal = (totalCredits || 0) + semesterCredits;
    setTotalCredits(newTotal);

    await syncToFirebase({ lockedSections: newLocked, totalCredits: newTotal });
    try { localStorage.setItem('totalCredits', String(newTotal)); } catch { /* ignore */ }
  };

  const unlockSection = async (grade, semester) => {
    const sectionKey = `${grade}-${semester}`;
    const newLocked = { ...lockedSections };
    delete newLocked[sectionKey];
    setLockedSections(newLocked);
    try { localStorage.setItem('lockedSections', JSON.stringify(newLocked)); } catch { /* ignore */ }

    // subtract credits belonging to this semester from totalCredits
    let semesterCount = 0;
    classSlots.forEach((slot) => {
      const key = `${grade}-${semester}-${slot}`;
      if (courses[key] && courses[key] in availableCourses) semesterCount += 1;
    });
    const semesterCredits = semesterCount * 10;
    const newTotal = Math.max(0, (totalCredits || 0) - semesterCredits);
    setTotalCredits(newTotal);

    try { localStorage.setItem('totalCredits', String(newTotal)); } catch { /* ignore */ }

    await syncToFirebase({ lockedSections: newLocked, totalCredits: newTotal });
  };

  const isSectionLocked = (grade, semester) => {
    return lockedSections[`${grade}-${semester}`] === true;
  };

  const courseInput = async (grade, semester, slot, value) => {
    if (isSectionLocked(grade, semester)) {
      setSaveStatus('This section is locked. Unlock to edit.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const key = `${grade}-${semester}-${slot}`;
    const newCourses = { ...courses };

    if (value && value.trim()) {
      newCourses[key] = value;
    } else {
      delete newCourses[key];
    }

    setCourses(newCourses);
    localStorage.setItem('courseSelections', JSON.stringify(newCourses));

    // Immediate Cloud Save
    if (user) {
      await syncToFirebase({ courses: newCourses });
    } else {
      setSaveStatus('Auto-saved to browser');
      setTimeout(() => setSaveStatus(''), 1500);
    }
  };

  const semesterIsComplete = (grade, semester) => {
    // every slot must have a selected course and both grade inputs filled
    for (let slot of classSlots) {
      const key = `${grade}-${semester}-${slot}`;
      if (!courses[key]) return false;
      const g1 = courseGrades[`${key}-g1`];
      const g2 = courseGrades[`${key}-g2`];
      if (!g1 || !g2) return false;
    }
    return true;
  };
  
  const clearSemester = async (grade, semester) => {
    if (window.confirm(`Clear all courses for ${grade} ${semester}?`)) {
      const newCourses = { ...courses };
      const newGrades = { ...courseGrades };
      const newSearchText = { ...searchText };

      Object.keys(newCourses).forEach((key) => {
        if (key.startsWith(`${grade}-${semester}-`)) delete newCourses[key];
      });
      Object.keys(newGrades).forEach((key) => {
        if (key.startsWith(`${grade}-${semester}-`)) delete newGrades[key];
      });
      Object.keys(newSearchText).forEach((key) => {
        if (key.startsWith(`${grade}-${semester}-`)) delete newSearchText[key];
      });

      setCourses(newCourses);
      setCourseGrades(newGrades);
      setSearchText(newSearchText);
      localStorage.setItem('courseSelections', JSON.stringify(newCourses));
      try { localStorage.setItem('courseGrades', JSON.stringify(newGrades)); } catch { /* ignore */ }

      // Sync the deletions to Firebase
      await syncToFirebase({ 
        courses: newCourses, 
        courseGrades: newGrades 
      });
    }
  };

  // --- Logic Helpers ---
  const grades = ['9th', '10th', '11th', '12th'];
  const semesters = ['Fall Semester', 'Spring Semester'];
  const classSlots = [1, 2, 3, 4];
  const courseList = Object.keys(availableCourses);

  const getFilteredCourses = (search) => {
    if (!search || search.length === 0) return courseList;
    const lowerSearch = search.toLowerCase();
    return courseList.filter(course =>
      course.toLowerCase().includes(lowerSearch)
    );
  };

  if (loading) return <div className="loading">Loading Schedule...</div>;

  return (
    <main className="services-main">
      <div className="services-header">
        <h1>Course Selection and Credit Requirement</h1>
        <div className="header-actions">
          <div className="credits-card">
            <div className="credits-summary">Credits: {totalCredits} / 230</div>
          </div>
          <button className="question-mark-btn" onClick={() => setShowTips(true)}>?</button>
          {!user && (
            <div className="login-card">
              <span className="login-hint">Log in to sync with your account</span>
            </div>
          )}
        </div>
      </div>

      {showTips && (
        <div className="popup-overlay" onClick={() => setShowTips(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close-x" onClick={() => setShowTips(false)}>×</button>
            <h2>Tips</h2>
            <p>Fill in all boxes for a semester before locking.</p>
          </div>
        </div>
      )}

      {saveStatus && <div className="save-status">{saveStatus}</div>}

      {grades.map((grade) => (
        <section key={grade} className="grade-section">
          <h2>{grade} Grade</h2>
          <div className="semester-container">
            {semesters.map((sem) => {
              const isLocked = isSectionLocked(grade, sem);
return (
                <div
                  key={sem}
                  className={`semester-card ${isLocked ? 'locked' : ''}`}
                >
                  <div className="semester-header">
                    <h3>{sem} {isLocked && '🔒'}</h3>
                    <div className="semester-actions">
                      {!isLocked ? (
                        <>
                          <button className="lock-btn" onClick={() => lockSection(grade, sem)}>Lock</button>
                          <button className="clear-semester-btn" onClick={() => clearSemester(grade, sem)}>Clear</button>
                        </>
                      ) : (
                        <button className="unlock-btn" onClick={() => unlockSection(grade, sem)}>Unlock</button>
                      )}
                    </div>
                  </div>

<div className="grade-column-header">
                    <span className="grade-col-spacer"></span>
                    <div className="grade-column-labels">
                      {sem === 'Fall Semester' ? (
                        <>
                          <span className="quarter-column-label">Q1</span>
                          <span className="quarter-column-label">Q2</span>
                        </>
                      ) : (
                        <>
                          <span className="quarter-column-label">Q3</span>
                          <span className="quarter-column-label">Q4</span>
                        </>
                      )}
                    </div>
                  </div>

                  {classSlots.map((slot) => {
                    const inputKey = `${grade}-${sem}-${slot}`;
                    const _filteredCourses = getFilteredCourses(searchText[inputKey] || '');

                    return (
                      <div key={slot} className="course-period-row">
                        <div className="course-input-group">
                          <label>Period {slot}</label>
                                <div className="course-dropdown">
                                  <CourseDropdown
                                    inputKey={inputKey}
                                    value={courses[inputKey] || ''}
                                    onChange={(course) => courseInput(grade, sem, slot, course)}
                                    disabled={isLocked}
                                    availableCourses={availableCourses}
                                    isSelectedElsewhere={(course) => {
                                      const otherKeys = Object.keys(courses).filter(k => k !== inputKey);
                                      const isOther = course === 'Other (Weighted)' || course === 'Other (Unweighted)';
                                      if (isOther) return false;
                                      return otherKeys.some(k => courses[k] === course);
                                    }}
                                  />
                                </div>
                        </div>

{/* ADDED: Grade Dropdowns */}
                        <div className="grade-inputs-container">
                          {/* Credits column - shows value only when course is explicitly selected/confirmed */}
                          <div className="credits-box">
                            {(courses[inputKey] && courses[inputKey] in availableCourses) ? 10 : ''}
                          </div>
                          {[1, 2].map((gradeNum) => {
                            const val = courseGrades[`${inputKey}-g${gradeNum}`] || '';
                            return (
                              <select
                                key={gradeNum}
                                className="grade-box"
                                value={val}
                                disabled={isLocked}
                                style={{ backgroundColor: gradeColors[val] }}
                                onChange={(e) => handleGradeChange(inputKey, gradeNum, e.target.value)}
                              >
                                <option value="">-</option>
                                {['A', 'B', 'C', 'D', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}