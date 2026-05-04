import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses, requiredCredits, totalCreditsRequired } from '../data/courseCatalog';
import './Services.css';

export default function Courses() {
  // -----------------------------
  // 1. State initialization
  // -----------------------------
  const [courses, setCourses] = useState({});
  const [courseGrades, setCourseGrades] = useState({});
  const [lockedSections, setLockedSections] = useState({});
  const [searchText, setSearchText] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const servicesRef = useRef(null);

  const gradeColors = {
    'A': '#00B4D8',
    'B': '#2ecc71',
    'C': '#f1c40f',
    'D': '#e67e22',
    'F': '#e74c3c',
    '': 'white'
  };

  const gradePoints = {
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0,
  };

  const getGradeColor = (grade) => gradeColors[grade] || 'white';

  const getGPAClass = (value) => {
    if (value === 'N/A') return 'gpa-score-gray';

    const numeric = parseFloat(value);
    if (Number.isNaN(numeric) || numeric === 0) return 'gpa-score-gray';
    if (numeric >= 5.0) return 'gpa-score-blue';
    if (numeric >= 4.0) return 'gpa-score-green';
    if (numeric >= 3.0) return 'gpa-score-yellow';
    if (numeric >= 2.0) return 'gpa-score-orange';
    if (numeric >= 1.0) return 'gpa-score-red';
    return 'gpa-score-gray';
  };

  const calculateGPAResult = () => {
    const gradeEntries = Object.entries(courseGrades).filter(
      ([key, value]) => value && gradePoints[value] !== undefined
    );

    if (gradeEntries.length === 0) {
      return { unweighted: 'N/A', weighted: 'N/A' };
    }

    let totalUnweighted = 0;
    let totalWeighted = 0;
    let count = 0;

    gradeEntries.forEach(([key, value]) => {
      const courseKey = key.replace(/-g\d+$/, '');
      const courseName = courses[courseKey];

      if (!courseName || !availableCourses[courseName]) {
        return;
      }

      const points = gradePoints[value];
      totalUnweighted += points;
      totalWeighted += availableCourses[courseName].weighted ? points + 1.0 : points;
      count += 1;
    });

    if (count === 0) {
      return { unweighted: 'N/A', weighted: 'N/A' };
    }

    return {
      unweighted: (totalUnweighted / count).toFixed(2),
      weighted: (totalWeighted / count).toFixed(2),
    };
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
  // 3. Load from Firestore
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

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setDropdownOpen({});
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
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
  if (!value || !value.trim()) {
    setSearchText(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { courses: newCourses },
        { merge: true }
      );

      setSaveStatus('Saved to your account');
      setTimeout(() => setSaveStatus(''), 1500);
    } catch (err) {
      console.error('Firestore save error:', err);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(''), 1500);
    }
  } else {
    setSaveStatus('Please log in to save changes');
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

  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { courseGrades: newGrades },
        { merge: true }
      );

      setSaveStatus('Saved to your account');
      setTimeout(() => setSaveStatus(''), 1500);
    } catch (err) {
      console.error('Firestore save error:', err);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(''), 1500);
    }
  } else {
    setSaveStatus('Please log in to save changes');
    setTimeout(() => setSaveStatus(''), 1500);
  }
};


  // -----------------------------
  // 6. Lock / Unlock (optimized)
  // -----------------------------
 const lockSection = async (grade, semester) => {
  const key = `${grade}-${semester}`;
  const newLocked = { ...lockedSections, [key]: true };

  setLockedSections(newLocked);

  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { lockedSections: newLocked },
        { merge: true }
      );

      setSaveStatus(`${grade} ${semester} locked`);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Firestore save error:', err);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  } else {
    setSaveStatus('Please log in to save changes');
    setTimeout(() => setSaveStatus(''), 1500);
  }
};

const unlockSection = async (grade, semester) => {
  const key = `${grade}-${semester}`;
  const newLocked = { ...lockedSections };
  delete newLocked[key];

  setLockedSections(newLocked);

  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        { lockedSections: newLocked },
        { merge: true }
      );

      setSaveStatus(`${grade} ${semester} unlocked`);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Firestore save error:', err);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  } else {
    setSaveStatus('Please log in to save changes');
    setTimeout(() => setSaveStatus(''), 1500);
  }
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

  const calculateTotalCredits = () => {
    let total = 0;
    Object.values(courses).forEach(course => {
      if (course && availableCourses[course]) {
        total += availableCourses[course].credits;
      }
    });
    return total;
  };

  const calculateCategoryCredits = () => {
    const rawTotals = Object.values(courses).reduce((totals, course) => {
      if (course && availableCourses[course]) {
        const { category, credits } = availableCourses[course];
        const bucket = requiredCredits[category] ? category : 'Elective';
        totals[bucket] = (totals[bucket] || 0) + credits;
      }
      return totals;
    }, {});

    let electiveOverflow = rawTotals.Elective || 0;
    const cappedTotals = Object.entries(requiredCredits).reduce((totals, [category, required]) => {
      const earned = rawTotals[category] || 0;
      const capped = Math.min(earned, required);
      electiveOverflow += Math.max(0, earned - required);
      totals[category] = capped;
      return totals;
    }, {});

    return {
      ...cappedTotals,
      Elective: electiveOverflow,
    };
  };

  const categoryCredits = calculateCategoryCredits();
  const gpaResult = calculateGPAResult();

  const handleSearchChange = (key, value) => {
    const updated = { ...searchText, [key]: value };
    setSearchText(updated);

    // saveCache({
    //   courses,
    //   courseGrades,
    //   lockedSections,
    //   searchText: updated
    // });

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
    <main className="services-main" ref={servicesRef}>
      <div className="services-content">
        <div className="services-left">
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
                                  onBlur={() => setTimeout(() => setDropdownOpen(prev => ({ ...prev, [inputKey]: false })), 100)}
                                />

                                {courses[inputKey] && !locked && (
                                  <button
                                    type="button"
                                    className="clear-course-btn"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => courseInput(grade, sem, slot, '')}
                                    title="Clear course"
                                  >
                                    ×
                                  </button>
                                )}

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
                                    style={{ backgroundColor: getGradeColor(val) }}
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
        </div>

        <div className="services-sidebar">
          <h3>Credit Progress</h3>
          <div className="credit-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((calculateTotalCredits() / totalCreditsRequired) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {calculateTotalCredits()} / {totalCreditsRequired} Credits
            </div>
          </div>

          <div className="category-progress">
            {Object.entries(requiredCredits).map(([category, required]) => {
              const earned = categoryCredits[category] || 0;
              const percent = Math.min((earned / required) * 100, 100);

              return (
                <div key={category} className="category-row">
                  <div className="category-label">
                    <span>{category}</span>
                    <span>{earned} / {required}</span>
                  </div>
                  <div className="category-bar">
                    <div className="category-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="gpa-calculator">
            <h3>GPA Calculator</h3>
            <div className="gpa-value">
              <span>Unweighted GPA</span>
              <span className={`gpa-score ${getGPAClass(gpaResult.unweighted)}`}>
                {gpaResult.unweighted}
              </span>
            </div>
            <div className="gpa-value">
              <span>Weighted GPA</span>
              <span className={`gpa-score ${getGPAClass(gpaResult.weighted)}`}>
                {gpaResult.weighted}
              </span>
            </div>
            <p className="gpa-note">Calculated from selected courses and their assigned grades.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
