import React, { useState, useEffect, useLayoutEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses } from '../data/courseCatalog';
import './Services.css';

// -----------------------------
// Local Cache Helpers
// -----------------------------
const CACHE_KEY = "coursePlannerCache";

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export default function Courses() {
  // -----------------------------
  // 1. Lazy initialization (instant load)
  // -----------------------------
  const cached = loadCache() || {};

  const [courses, setCourses] = useState(cached.courses || {});
  const [courseGrades, setCourseGrades] = useState(cached.courseGrades || {});
  const [lockedSections, setLockedSections] = useState(cached.lockedSections || {});
  const [searchText, setSearchText] = useState(cached.searchText || {});
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const gradeColors = {
    'A': '#00B4D8',
    'B': '#2ecc71',
    'C': '#f1c40f',
    'D': '#e67e22',
    'F': '#e74c3c',
    '': 'white'
  };

  // -----------------------------
  // 2. Firebase Sync Helper
  // -----------------------------
  const syncToFirebase = async (updates) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, updates, { merge: true });

      setSaveStatus('Changes saved to account');
      setTimeout(() => setSaveStatus(''), 1500);
    } catch (e) {
      console.error('Error syncing to Firebase:', e);
      setSaveStatus('Error saving to cloud');
    }
  };

  // -----------------------------
  // 3. Load Firebase AFTER cache (fast)
  // -----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();

            // Only update if different (prevents re-renders)
            if (data.courses) setCourses(prev => prev !== data.courses ? data.courses : prev);
            if (data.courseGrades) setCourseGrades(prev => prev !== data.courseGrades ? data.courseGrades : prev);
            if (data.lockedSections) setLockedSections(prev => prev !== data.lockedSections ? data.lockedSections : prev);

            // Sync Firebase → cache
            saveCache({
              courses: data.courses || {},
              courseGrades: data.courseGrades || {},
              lockedSections: data.lockedSections || {},
              searchText
            });

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

  // -----------------------------
  // 4. Course Input (optimized)
  // -----------------------------
  const courseInput = async (grade, semester, slot, value) => {
    const key = `${grade}-${semester}-${slot}`;

    if (lockedSections[`${grade}-${semester}`]) {
      setSaveStatus('This section is locked. Unlock to edit.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const newCourses = { ...courses };
    if (value && value.trim()) newCourses[key] = value;
    else delete newCourses[key];

    setCourses(newCourses);

    saveCache({
      courses: newCourses,
      courseGrades,
      lockedSections,
      searchText
    });

    if (user) {
      await syncToFirebase({ courses: newCourses });
    } else {
      setSaveStatus('Auto-saved to browser');
      setTimeout(() => setSaveStatus(''), 1500);
    }
  };

  // -----------------------------
  // 5. Grade Change (optimized)
  // -----------------------------
  const handleGradeChange = async (inputKey, gradeIndex, value) => {
    const gradeKey = `${inputKey}-g${gradeIndex}`;
    const newGrades = { ...courseGrades, [gradeKey]: value };

    setCourseGrades(newGrades);

    saveCache({
      courses,
      courseGrades: newGrades,
      lockedSections,
      searchText
    });

    await syncToFirebase({ courseGrades: newGrades });
  };

  // -----------------------------
  // 6. Lock / Unlock (optimized)
  // -----------------------------
  const lockSection = async (grade, semester) => {
    const key = `${grade}-${semester}`;
    const newLocked = { ...lockedSections, [key]: true };

    setLockedSections(newLocked);

    saveCache({
      courses,
      courseGrades,
      lockedSections: newLocked,
      searchText
    });

    await syncToFirebase({ lockedSections: newLocked });
  };

  const unlockSection = async (grade, semester) => {
    const key = `${grade}-${semester}`;
    const newLocked = { ...lockedSections };
    delete newLocked[key];

    setLockedSections(newLocked);

    saveCache({
      courses,
      courseGrades,
      lockedSections: newLocked,
      searchText
    });

    await syncToFirebase({ lockedSections: newLocked });
  };

  const isSectionLocked = (grade, semester) =>
    lockedSections[`${grade}-${semester}`] === true;

  // -----------------------------
  // 7. Clear Semester (optimized)
  // -----------------------------
  const clearSemester = async (grade, semester) => {
    const newCourses = { ...courses };
    const newGrades = { ...courseGrades };

    Object.keys(newCourses).forEach(key => {
      if (key.startsWith(`${grade}-${semester}`)) delete newCourses[key];
    });

    Object.keys(newGrades).forEach(key => {
      if (key.startsWith(`${grade}-${semester}`)) delete newGrades[key];
    });

    setCourses(newCourses);
    setCourseGrades(newGrades);

    saveCache({
      courses: newCourses,
      courseGrades: newGrades,
      lockedSections,
      searchText
    });

    if (user) {
      await syncToFirebase({
        courses: newCourses,
        courseGrades: newGrades
      });
    }
  };


  const grades = ['9th', '10th', '11th', '12th'];
  const semesters = ['Fall Semester', 'Spring Semester'];
  const classSlots = [1, 2, 3, 4];
  const courseList = Object.keys(availableCourses);

  const getFilteredCourses = (search) => {
    if (!search) return courseList;
    const lower = search.toLowerCase();
    return courseList.filter(c => c.toLowerCase().includes(lower));
  };

  const handleSearchChange = (key, value) => {
    const updated = { ...searchText, [key]: value };
    setSearchText(updated);

    saveCache({
      courses,
      courseGrades,
      lockedSections,
      searchText: updated
    });

    setDropdownOpen(prev => ({ ...prev, [key]: value.length > 0 }));

    if (!value.trim()) {
      const [grade, semester, slot] = key.split('-');
      courseInput(grade, semester, slot, '');
    }
  };

  const handleCourseSelect = (key, course) => {
    const [grade, semester, slot] = key.split('-');
    courseInput(grade, semester, slot, course);

    setSearchText(prev => ({ ...prev, [key]: course }));
    setDropdownOpen(prev => ({ ...prev, [key]: false }));
    setHighlightedIndex(prev => ({ ...prev, [key]: 0 }));
  };

  const handleKeyDown = (e, inputKey) => {
    const filtered = getFilteredCourses(searchText[inputKey] || '');
    const currentIndex = highlightedIndex[inputKey] || 0;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setDropdownOpen(prev => ({ ...prev, [inputKey]: true }));
        setHighlightedIndex(prev => ({
          ...prev,
          [inputKey]: (currentIndex + 1) % filtered.length
        }));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => ({
          ...prev,
          [inputKey]: (currentIndex - 1 + filtered.length) % filtered.length
        }));
        break;

      case 'Enter':
        e.preventDefault();
        if (dropdownOpen[inputKey] && filtered.length > 0) {
          handleCourseSelect(inputKey, filtered[currentIndex]);
        }
        break;

      case 'Escape':
        setDropdownOpen(prev => ({ ...prev, [inputKey]: false }));
        break;
    }
  };

  // -----------------------------
  // 9. UI Rendering
  // -----------------------------
  if (loading) return <div className="loading">Loading Schedule...</div>;

  return (
    <main className="services-main">
      <div className="services-header">
        <h1>Course Selection and Credit Requirement</h1>
        {!user && <span className="login-hint">Log in to sync with your account</span>}
      </div>

      {saveStatus && <div className="save-status">{saveStatus}</div>}

      {grades.map((grade) => (
        <section key={grade} className="grade-section">
          <h2>{grade} Grade</h2>

          <div className="semester-container">
            {semesters.map((sem) => {
              const locked = isSectionLocked(grade, sem);

              return (
                <div key={sem} className={`semester-card ${locked ? 'locked' : ''}`}>
                  <div className="semester-header">
                    <h3>{sem} {locked && '🔒'}</h3>

                    <div className="semester-actions">
                      {!locked ? (
                        <>
                          <button className="lock-btn" onClick={() => lockSection(grade, sem)} disabled={!user}>Lock</button>
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
                    const filtered = getFilteredCourses(searchText[inputKey] || '');
                    const isOpen = dropdownOpen[inputKey] && filtered.length > 0;

                    return (
                      <div key={slot} className="course-period-row">
                        <div className="course-input-group">
                          <label>Period {slot}</label>

                          <div className="course-dropdown">
                            <input
                              type="text"
                              placeholder={locked ? 'Locked' : 'Search courses...'}
                              value={searchText[inputKey] || courses[inputKey] || ''}
                              disabled={locked}
                              className="course-input"
                              onChange={(e) => handleSearchChange(inputKey, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, inputKey)}
                              onFocus={() => setDropdownOpen(prev => ({ ...prev, [inputKey]: true }))}
                            />

                            {isOpen && !locked && (
                              <ul className="dropdown-list">
                                {filtered.slice(0, 10).map((course, idx) => (
                                  <li
                                    key={course}
                                    className={`dropdown-item ${idx === highlightedIndex[inputKey] ? 'highlighted' : ''}`}
                                    onClick={() => handleCourseSelect(inputKey, course)}
                                  >
                                    {course}
                                    <span className="course-category">({availableCourses[course].category})</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        <div className="grade-inputs-container">
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
                                disabled={locked}
                                style={{ backgroundColor: gradeColors[val] }}
                                onChange={(e) => handleGradeChange(inputKey, gradeNum, e.target.value)}
                              >
                                <option value="">-</option>
                                {['A', 'B', 'C', 'D', 'F'].map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
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
