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
  const [_dropdownOpen, _setDropdownOpen] = useState({});
  const [searchText, setSearchText] = useState({});
  const [_highlightedIndex, _setHighlightedIndex] = useState({});
  const [totalCredits, setTotalCredits] = useState(() => {
    try { const s = localStorage.getItem('totalCredits'); return s ? Number(s) : 0; } catch { return 0; }
  });
  const [showTips, setShowTips] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const servicesRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const [offCampusCourses, setOffCampusCourses] = useState([]);
  const [offCampusGrades, setOffCampusGrades] = useState([]);
  const [offCampusSearchText, setOffCampusSearchText] = useState({});
  const [offCampusDropdownOpen, setOffCampusDropdownOpen] = useState({});
  const [offCampusHighlightedIndex, setOffCampusHighlightedIndex] = useState({});

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

    // Add off-campus grades
    offCampusCourses.forEach((course, index) => {
      const grade = offCampusGrades[index];
      if (grade && gradePoints[grade] !== undefined) {
        gradeEntries.push([`off-${index}`, grade]);
      }
    });

    if (gradeEntries.length === 0) {
      return { unweighted: 'N/A', weighted: 'N/A' };
    }

    let totalUnweighted = 0;
    let totalWeighted = 0;
    let count = 0;

    gradeEntries.forEach(([key, value]) => {
      const courseKey = key.replace(/-g\d+$/, '');
      let courseName = courses[courseKey];
      let isWeighted = false;

      if (key.startsWith('off-')) {
        const index = parseInt(key.split('-')[1]);
        courseName = offCampusCourses[index];
      } else {
        courseName = courses[courseKey];
      }

      if (courseName && availableCourses[courseName]) {
        isWeighted = availableCourses[courseName].weighted;
      }

      const points = gradePoints[value];
      totalUnweighted += points;
      totalWeighted += isWeighted ? points + 1.0 : points;
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
  // 2. Firebase Sync Helper (debounced)
  // -----------------------------
  const syncToFirebase = async (updates) => {
    if (!user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, updates, { merge: true });

        setSaveStatus('Changes saved to account');
        setTimeout(() => setSaveStatus(''), 1500);
      } catch (e) {
        console.error('Error syncing to Firebase:', e);
        setSaveStatus('Error saving to cloud');
      }
    }, 500); // Debounce saves by 500ms
  };

  // -----------------------------
  // 3. Load from Firestore
  // -----------------------------
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

            // Only update if different (prevents re-renders)
            if (data.courses) setCourses(prev => prev !== data.courses ? data.courses : prev);
            if (data.courseGrades) setCourseGrades(prev => prev !== data.courseGrades ? data.courseGrades : prev);
            if (data.lockedSections) setLockedSections(prev => prev !== data.lockedSections ? data.lockedSections : prev);
            if (data.offCampusCourses) setOffCampusCourses(prev => prev !== data.offCampusCourses ? data.offCampusCourses : prev);
            if (data.offCampusGrades) setOffCampusGrades(prev => prev !== data.offCampusGrades ? data.offCampusGrades : prev);

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

  // Clear pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Optionally, trigger the save immediately
        // But since it's async, and component is unmounting, perhaps not.
      }
    };
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
    syncToFirebase({ courses: newCourses });
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
    syncToFirebase({ courseGrades: newGrades });
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
    syncToFirebase({ lockedSections: newLocked });
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
    syncToFirebase({ lockedSections: newLocked });
  } else {
    setSaveStatus('Please log in to save changes');
    setTimeout(() => setSaveStatus(''), 1500);
  }
};

const isSectionLocked = (grade, semester) =>
  lockedSections[`${grade}-${semester}`] === true;

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
    setCourseGrades(newGrades);

    if (user) {
      syncToFirebase({
        courses: newCourses,
        courseGrades: newGrades
      });
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

  const calculateTotalCredits = () => {
    let total = 0;
    Object.values(courses).forEach(course => {
      if (course && availableCourses[course]) {
        total += availableCourses[course].credits;
      }
    });
    offCampusCourses.forEach(course => {
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

    // Add off-campus credits to Elective
    offCampusCourses.forEach(course => {
      if (course && availableCourses[course]) {
        rawTotals.Elective = (rawTotals.Elective || 0) + availableCourses[course].credits;
      }
    });

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

  const handleOffCampusCourseChange = (index, value) => {
    // Prevent selecting courses already in regular schedule
    if (value && Object.values(courses).includes(value)) {
      setSaveStatus('Course already selected in schedule');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    // Prevent duplicates in off-campus
    if (value && offCampusCourses.some((c, i) => c === value && i !== index)) {
      setSaveStatus('Course already selected in off-campus');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const newCourses = [...offCampusCourses];
    newCourses[index] = value;
    setOffCampusCourses(newCourses);

    if (user) {
      syncToFirebase({ offCampusCourses: newCourses });
    }
  };

  const handleOffCampusGradeChange = (index, value) => {
    const newGrades = [...offCampusGrades];
    newGrades[index] = value;
    setOffCampusGrades(newGrades);

    if (user) {
      syncToFirebase({ offCampusGrades: newGrades });
    }
  };

  const addOffCampusSection = () => {
    setOffCampusCourses([...offCampusCourses, '']);
    setOffCampusGrades([...offCampusGrades, '']);
  };

  const removeOffCampusSection = () => {
    if (offCampusCourses.length > 0) {
      const newCourses = offCampusCourses.slice(0, -1);
      const newGrades = offCampusGrades.slice(0, -1);
      setOffCampusCourses(newCourses);
      setOffCampusGrades(newGrades);

      if (user) {
        syncToFirebase({ offCampusCourses: newCourses, offCampusGrades: newGrades });
      }
    }
  };

  const handleOffCampusSearchChange = (index, value) => {
    const updated = { ...offCampusSearchText, [index]: value };
    setOffCampusSearchText(updated);

    setOffCampusDropdownOpen(prev => ({ ...prev, [index]: value.length > 0 }));

    if (!value.trim()) {
      handleOffCampusCourseChange(index, '');
    }
  };

  const handleOffCampusCourseSelect = (index, course) => {
    handleOffCampusCourseChange(index, course);

    setOffCampusSearchText(prev => ({ ...prev, [index]: course }));
    setOffCampusDropdownOpen(prev => ({ ...prev, [index]: false }));
    setOffCampusHighlightedIndex(prev => ({ ...prev, [index]: 0 }));
  };

  const handleOffCampusKeyDown = (e, index) => {
    const filtered = getFilteredCourses(offCampusSearchText[index] || '');
    const currentIndex = offCampusHighlightedIndex[index] || 0;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOffCampusDropdownOpen(prev => ({ ...prev, [index]: true }));
        setOffCampusHighlightedIndex(prev => ({
          ...prev,
          [index]: (currentIndex + 1) % filtered.length
        }));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setOffCampusHighlightedIndex(prev => ({
          ...prev,
          [index]: (currentIndex - 1 + filtered.length) % filtered.length
        }));
        break;

      case 'Enter':
        e.preventDefault();
        if (offCampusDropdownOpen[index] && filtered.length > 0) {
          handleOffCampusCourseSelect(index, filtered[currentIndex]);
        }
        break;

      case 'Escape':
        setOffCampusDropdownOpen(prev => ({ ...prev, [index]: false }));
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
                        <div className="grade-column-labels">                          <span className="credits-label">Credits</span>                          {sem === 'Fall Semester' ? (
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

        <div className="services-middle">
          <div className="off-campus-credits">
            <h3>Off-Campus Credits</h3>
            {offCampusCourses.map((course, index) => {
              const filtered = getFilteredCourses(offCampusSearchText[index] || '');
              const isOpen = offCampusDropdownOpen[index] && filtered.length > 0;

              return (
                <div key={index} className="off-campus-row">
                  <div className="off-campus-input-group">
                    <div className="off-campus-dropdown">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={offCampusSearchText[index] || course || ''}
                        className="off-campus-input"
                        onChange={(e) => handleOffCampusSearchChange(index, e.target.value)}
                        onKeyDown={(e) => handleOffCampusKeyDown(e, index)}
                        onFocus={() => setOffCampusDropdownOpen(prev => ({ ...prev, [index]: true }))}
                        onBlur={() => setTimeout(() => setOffCampusDropdownOpen(prev => ({ ...prev, [index]: false })), 100)}
                      />

                      {course && (
                        <button
                          type="button"
                          className="off-campus-clear-btn"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleOffCampusCourseChange(index, '')}
                          title="Clear course"
                        >
                          ×
                        </button>
                      )}

                      {isOpen && (
                        <ul className="off-campus-dropdown-list">
                          {filtered.slice(0, 10).map((c, idx) => (
                            <li
                              key={c}
                              className={`off-campus-dropdown-item ${idx === offCampusHighlightedIndex[index] ? 'highlighted' : ''}`}
                              onClick={() => handleOffCampusCourseSelect(index, c)}
                            >
                              {c}
                              <span className="off-campus-course-category">({availableCourses[c].category})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="off-campus-credits-display">
                    {course && availableCourses[course] ? availableCourses[course].credits : ''}
                  </div>

                  <select
                    value={offCampusGrades[index] || ''}
                    onChange={(e) => handleOffCampusGradeChange(index, e.target.value)}
                    className="off-campus-grade-select"
                  >
                    <option value="">Grade</option>
                    {['A', 'B', 'C', 'D', 'F'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              );
            })}
            <div className="off-campus-buttons">
              <button onClick={addOffCampusSection}>Add Off-Campus Course</button>
              <button onClick={removeOffCampusSection} disabled={offCampusCourses.length === 0}>Remove</button>
            </div>
          </div>
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

          <hr />

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
}}