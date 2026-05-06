import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses, requiredCredits, totalCreditsRequired } from '../data/courseCatalog';
import './Services.css';

export default function Courses() {
  const [courses, setCourses] = useState({});
  const [courseGrades, setCourseGrades] = useState({});
  const [lockedSections, setLockedSections] = useState({});

  const [searchText, setSearchText] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState({});
  // kept for potential future keyboard navigation; currently not used
  // eslint-disable-next-line no-unused-vars
  const [highlightedIndex, setHighlightedIndex] = useState({});



  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  const servicesRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const loadingStartedAtRef = useRef(0);
  const loadingDelayRef = useRef(null);

  const [offCampusCourses, setOffCampusCourses] = useState([]);
  const [offCampusGrades, setOffCampusGrades] = useState([]);
  const [offCampusSearchText, setOffCampusSearchText] = useState({});
  const [offCampusDropdownOpen, setOffCampusDropdownOpen] = useState({});


  const grades = ['9th', '10th', '11th', '12th'];
  const semesters = ['Fall Semester', 'Spring Semester'];
  const classSlots = [1, 2, 3, 4];
  const courseList = Object.keys(availableCourses);
  const saveStatusTone = (
    saveStatus.toLowerCase().includes('error')
    || saveStatus.toLowerCase().includes('locked')
    || saveStatus.toLowerCase().includes('already')
    || saveStatus.toLowerCase().includes('fill')
  ) ? 'error' : 'success';

  const gradePoints = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };

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

  const syncToFirebase = async (updates) => {
    if (!user) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

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
    }, 500);
  };

  useEffect(() => {
    loadingStartedAtRef.current = Date.now();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.courses) setCourses(data.courses);
            if (data.courseGrades) setCourseGrades(data.courseGrades);
            if (data.lockedSections) setLockedSections(data.lockedSections);
            if (data.offCampusCourses) setOffCampusCourses(data.offCampusCourses);
            if (data.offCampusGrades) setOffCampusGrades(data.offCampusGrades);
          }
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      }

      const minimumLoadingTime = 2200;
      const elapsed = Date.now() - loadingStartedAtRef.current;
      const settleAfterDataTime = currentUser ? Math.min(900, Math.max(450, Math.floor(elapsed * 0.12))) : 350;
      const remaining = Math.max(minimumLoadingTime - elapsed, settleAfterDataTime);

      loadingDelayRef.current = setTimeout(() => {
        setLoading(false);
      }, remaining);
    });

    return () => {
      unsubscribe();
      if (loadingDelayRef.current) clearTimeout(loadingDelayRef.current);
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

  const isOtherCourse = (course) => course === 'Other (Weighted)' || course === 'Other (Unweighted)';

  const isCourseSelectedElsewhere = (course, currentKey) => {
    if (!course || isOtherCourse(course)) return false;

    const selectedInSchedule = Object.entries(courses).some(([key, selected]) => key !== currentKey && selected === course);
    const selectedOffCampus = offCampusCourses.some((selected, index) => `off-${index}` !== currentKey && selected === course);
    return selectedInSchedule || selectedOffCampus;
  };

  const getFilteredCourses = (search, currentKey) => {
    const available = courseList.filter((course) => !isCourseSelectedElsewhere(course, currentKey));
    if (!search || search.length === 0) return available;
    const lowerSearch = search.toLowerCase();
    return available.filter((course) => course.toLowerCase().includes(lowerSearch));
  };

  const isSectionLocked = (grade, semester) => lockedSections[`${grade}-${semester}`] === true;

  const getSectionKey = (grade, semester) => `${grade}-${semester}`;

  const getCourseKey = (grade, semester, slot) => `${grade}-${semester}-${slot}`;

  const isCourseKeyInLockedSection = (courseKey) => (
    grades.some((grade) => (
      semesters.some((semester) => courseKey.startsWith(`${getSectionKey(grade, semester)}-`) && isSectionLocked(grade, semester))
    ))
  );

  const isSemesterComplete = (grade, semester) => (
    classSlots.every((slot) => {
      const inputKey = getCourseKey(grade, semester, slot);
      return (
        courses[inputKey]
        && courseGrades[`${inputKey}-g1`]
        && courseGrades[`${inputKey}-g2`]
      );
    })
  );

  const lockSection = async (grade, semester) => {
    if (!isSemesterComplete(grade, semester)) {
      setSaveStatus('Fill every course and grade before locking.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const key = getSectionKey(grade, semester);
    const newLocked = { ...lockedSections, [key]: true };
    setLockedSections(newLocked);
    if (user) await syncToFirebase({ lockedSections: newLocked });
  };

  const unlockSection = async (grade, semester) => {
    const sectionKey = getSectionKey(grade, semester);
    const newLocked = { ...lockedSections };

    delete newLocked[sectionKey];
    setLockedSections(newLocked);
    if (user) await syncToFirebase({ lockedSections: newLocked });
  };



  const handleCourseInput = async (grade, semester, slot, value) => {
    if (isSectionLocked(grade, semester)) {
      setSaveStatus('This section is locked. Unlock to edit.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const key = getCourseKey(grade, semester, slot);

    if (value && isCourseSelectedElsewhere(value, key)) {
      setSaveStatus('Course already selected');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const newCourses = { ...courses };
    const newGrades = { ...courseGrades };

    if (value && value.trim()) newCourses[key] = value;
    else {
      delete newCourses[key];
      delete newGrades[`${key}-g1`];
      delete newGrades[`${key}-g2`];
    }

    setCourses(newCourses);
    setCourseGrades(newGrades);

    // Clear searchText for that input when cleared
    setSearchText((prev) => {
      const next = { ...prev };
      if (value && value.trim()) next[key] = value;
      else delete next[key];
      return next;
    });

    if (user) await syncToFirebase({ courses: newCourses, courseGrades: newGrades });
  };

  const handleGradeChange = async (inputKey, gradeIndex, value) => {
    const gradeKey = `${inputKey}-g${gradeIndex}`;
    const newGrades = { ...courseGrades, [gradeKey]: value };
    setCourseGrades(newGrades);
    if (user) await syncToFirebase({ courseGrades: newGrades });
  };

  const getFilteredOffCampusCourses = (search, currentIndex) => {
    const currentKey = `off-${currentIndex}`;
    const available = courseList.filter((course) => !isCourseSelectedElsewhere(course, currentKey));
    if (!search || search.length === 0) return available;
    const lowerSearch = search.toLowerCase();
    return available.filter((course) => course.toLowerCase().includes(lowerSearch));
  };

  const handleOffCampusCourseChange = async (index, value) => {
    if (value && isCourseSelectedElsewhere(value, `off-${index}`)) {
      setSaveStatus('Course already selected');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }

    const newCourses = [...offCampusCourses];
    const newGrades = [...offCampusGrades];
    newCourses[index] = value;
    if (!value || !value.trim()) newGrades[index] = '';
    setOffCampusCourses(newCourses);
    setOffCampusGrades(newGrades);
    setOffCampusSearchText((prev) => {
      const next = { ...prev };
      if (value && value.trim()) next[index] = value;
      else delete next[index];
      return next;
    });
    if (user) await syncToFirebase({ offCampusCourses: newCourses, offCampusGrades: newGrades });
  };

  const handleOffCampusGradeChange = async (index, value) => {
    const newGrades = [...offCampusGrades];
    newGrades[index] = value;
    setOffCampusGrades(newGrades);
    if (user) await syncToFirebase({ offCampusGrades: newGrades });
  };

  const addOffCampusSection = () => {
    setOffCampusCourses((prev) => [...prev, '']);
    setOffCampusGrades((prev) => [...prev, '']);
  };

  const removeOffCampusSection = async () => {
    if (offCampusCourses.length <= 0) return;
    const newCourses = offCampusCourses.slice(0, -1);
    const newGrades = offCampusGrades.slice(0, -1);
    setOffCampusCourses(newCourses);
    setOffCampusGrades(newGrades);
    if (user) await syncToFirebase({ offCampusCourses: newCourses, offCampusGrades: newGrades });
  };

  const handleSearchChange = async (key, value) => {
    const updated = { ...searchText, [key]: value };
    setSearchText(updated);
    setDropdownOpen((prev) => ({ ...prev, [key]: true }));

    if (courses[key] && value !== courses[key]) {
      const newCourses = { ...courses };
      delete newCourses[key];

      const newGrades = { ...courseGrades };
      delete newGrades[`${key}-g1`];
      delete newGrades[`${key}-g2`];

      setCourses(newCourses);
      setCourseGrades(newGrades);
      if (user) await syncToFirebase({ courses: newCourses, courseGrades: newGrades });
    }
  };

  // GPA/credits sidebar

  const calculateTotalCredits = () => {
    let total = 0;
    Object.entries(courses).forEach(([courseKey, course]) => {
      if (!isCourseKeyInLockedSection(courseKey)) return;
      if (course && availableCourses[course]) total += availableCourses[course].credits;
    });
    offCampusCourses.forEach((course) => {
      if (course && availableCourses[course]) total += availableCourses[course].credits;
    });
    return total;
  };

  const calculateCategoryCredits = () => {
    const rawTotals = Object.entries(courses).reduce((totals, [courseKey, course]) => {
      if (!isCourseKeyInLockedSection(courseKey)) return totals;
      if (course && availableCourses[course]) {
        const { category, credits } = availableCourses[course];
        const bucket = requiredCredits[category] ? category : 'Elective';
        totals[bucket] = (totals[bucket] || 0) + credits;
      }
      return totals;
    }, {});

    offCampusCourses.forEach((course) => {
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

    return { ...cappedTotals, Elective: electiveOverflow };
  };

  const calculateGPAResult = () => {
    const gradeEntries = Object.entries(courseGrades).filter(
      (([gradeKey, value]) => {
        const courseKey = gradeKey.replace(/-g\d+$/, '');
        return isCourseKeyInLockedSection(courseKey) && value && gradePoints[value] !== undefined;
      })
    );



    offCampusCourses.forEach((course, index) => {
      const grade = offCampusGrades[index];
      if (course && grade && gradePoints[grade] !== undefined) {
        gradeEntries.push([`off-${index}`, grade]);
      }
    });

    if (gradeEntries.length === 0) return { unweighted: 'N/A', weighted: 'N/A' };

    let totalUnweighted = 0;
    let totalWeighted = 0;
    let count = 0;

    gradeEntries.forEach(([gradeKey, value]) => {
      const courseKey = gradeKey.replace(/-g\d+$/, '');

      let courseName = courses[courseKey];
      let isWeighted = false;

      if (gradeKey.startsWith('off-')) {
        const index = parseInt(gradeKey.split('-')[1]);
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

    if (count === 0) return { unweighted: 'N/A', weighted: 'N/A' };

    return {
      unweighted: (totalUnweighted / count).toFixed(2),
      weighted: (totalWeighted / count).toFixed(2),
    };
  };

  const gpaResult = calculateGPAResult();
  const categoryCredits = calculateCategoryCredits();

  if (loading) {
    return (
      <main className="services-loading-screen" aria-live="polite" aria-busy="true">
        <div className="services-loading-card">
          <div className="services-loading-mark" />
          <span className="home-eyebrow">Course planner</span>
          <h1>Loading your schedule</h1>
          <p>Pulling in saved courses, grades, credits, and account progress.</p>
          <div className="services-loading-bar">
            <span />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="services-main" ref={servicesRef}>
      <div className="services-content">
        <div className="services-left">
          <div className="services-header">
            <div>
              <span className="home-eyebrow">Schedule builder</span>
              <h1>Course Selection and Credit Requirement</h1>
            </div>
            <div className="services-header-status">
              {!user && <span className="login-hint">Log in to sync with your account</span>}
            </div>
          </div>

          {saveStatus && (
            <div className={`save-status save-status--${saveStatusTone}`} role="status" aria-live="polite">
              {saveStatus}
            </div>
          )}

          {grades.map((grade) => (
            <section key={grade} className="grade-section">
              <h2>{grade} Grade</h2>

              <div className="semester-container">
                {semesters.map((sem) => {
                  const locked = isSectionLocked(grade, sem);
                  const complete = isSemesterComplete(grade, sem);

                  return (
                    <div key={sem} className={`semester-card ${locked ? 'locked' : ''}`}>
                      <div className="semester-header">
                        <h3>{sem} {locked ? '🔒' : ''}</h3>

                        <div className="semester-actions">
                          {!locked ? (
                            <button
                              className="lock-btn"
                              onClick={() => lockSection(grade, sem)}
                              disabled={!user || !complete}
                              title={!user ? 'Log in to lock sections' : !complete ? 'Fill every course and grade before locking' : 'Lock this semester'}
                            >
                              Lock
                            </button>
                          ) : (
                            <button className="unlock-btn" onClick={() => unlockSection(grade, sem)}>
                              Unlock
                            </button>
                          )}
                        </div>
                      </div>
                      {!locked && !complete && (
                        <p className="semester-lock-hint">Fill all courses and grades to lock and update totals.</p>
                      )}

                      <div className="grade-column-header">
                        <span className="grade-col-spacer" />
                        <div className="grade-column-labels">
                          <span className="credits-label">Credits</span>
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
                        const inputKey = getCourseKey(grade, sem, slot);
                        const filtered = getFilteredCourses(searchText[inputKey] || '', inputKey);
                        const isOpen = dropdownOpen[inputKey] && filtered.length > 0;
                        const selectedCourse = courses[inputKey] || '';

                        return (
                          <div key={slot} className="course-period-row">
                            <div className="course-input-group">
                              <label>Period {slot}</label>

                              <div className="course-dropdown">
                                <input
                                  type="text"
                                  placeholder={locked ? 'Locked' : 'Search courses...'}
                                  value={searchText[inputKey] ?? selectedCourse}
                                  disabled={locked}
                                  className="course-input"
                                  onChange={(e) => handleSearchChange(inputKey, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setDropdownOpen((prev) => ({ ...prev, [inputKey]: true }));
                                      setHighlightedIndex((prev) => ({
                                        ...prev,
                                        [inputKey]: (prev[inputKey] ?? 0) + 1,
                                      }));
                                    }
                                  }}
                                  onFocus={() => setDropdownOpen((prev) => ({ ...prev, [inputKey]: true }))}
                                  onBlur={() => setTimeout(() => setDropdownOpen((prev) => ({ ...prev, [inputKey]: false })), 100)}
                                  aria-label={`Course selection for ${grade} ${sem} period ${slot}`}
                                />

                                {selectedCourse && !locked && (
                                  <button
                                    type="button"
                                    className="clear-course-btn"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleCourseInput(grade, sem, slot, '')}
                                    title="Clear course"
                                  >
                                    ×
                                  </button>
                                )}

                                {isOpen && !locked && (
                                  <ul className="dropdown-list">
                                    {filtered.slice(0, 10).map((course) => (
                                      <li
                                        key={course}
                                        className="dropdown-item"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleCourseInput(grade, sem, slot, course)}
                                      >
                                        {course}{' '}
                                        <span className="course-category">({availableCourses[course].category})</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div className="grade-inputs-container">
                              <div className="credits-box">
                                {(selectedCourse && selectedCourse in availableCourses) ? 10 : ''}
                              </div>

                              {[1, 2].map((gradeNum) => {
                                const gradeKey = `${inputKey}-g${gradeNum}`;
                                const val = courseGrades[gradeKey] || '';
                                const backgroundColor = (() => {
                                  switch (val) {
                                    case 'A': return '#00B4D8';
                                    case 'B': return '#2ecc71';
                                    case 'C': return '#f1c40f';
                                    case 'D': return '#e67e22';
                                    case 'F': return '#e74c3c';
                                    default: return '#ffffff';
                                  }
                                })();

                                return (
                                  <select
                                    key={gradeNum}
                                    className="grade-box"
                                    value={val}
                                    disabled={locked}
                                    style={{ backgroundColor }}
                                    onChange={(e) => handleGradeChange(inputKey, gradeNum, e.target.value)}
                                    aria-label={`Grade ${gradeNum} for ${grade} ${sem} period ${slot}`}
                                  >
                                    <option value="">-</option>
                                    {['A', 'B', 'C', 'D', 'F'].map((g) => (
                                      <option key={g} value={g}>
                                        {g}
                                      </option>
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
              const filtered = getFilteredOffCampusCourses(offCampusSearchText[index] || '', index);
              const isOpen = offCampusDropdownOpen[index] && filtered.length > 0;

              return (
                <div key={index} className="off-campus-row">
                  <div className="off-campus-input-group">
                    <div className="off-campus-dropdown">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={offCampusSearchText[index] ?? course}
                        className="off-campus-input"
                        onChange={(e) => {
                          if (course && e.target.value !== course) {
                            handleOffCampusCourseChange(index, '');
                          }
                          const updated = { ...offCampusSearchText, [index]: e.target.value };
                          setOffCampusSearchText(updated);
                          setOffCampusDropdownOpen((prev) => ({ ...prev, [index]: e.target.value.length > 0 }));
                        }}
                        onFocus={() => setOffCampusDropdownOpen((prev) => ({ ...prev, [index]: true }))}
                        onBlur={() => setTimeout(() => setOffCampusDropdownOpen((prev) => ({ ...prev, [index]: false })), 100)}
                        aria-label={`Off-campus course selection ${index + 1}`}
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
                          {filtered.slice(0, 10).map((c) => (
                            <li
                              key={c}
                              className="off-campus-dropdown-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                handleOffCampusCourseChange(index, c);
                                setOffCampusDropdownOpen((prev) => ({ ...prev, [index]: false }));
                              }}
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
                    aria-label={`Off-campus grade ${index + 1}`}
                  >
                    <option value="">Grade</option>
                    {['A', 'B', 'C', 'D', 'F'].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            <div className="off-campus-buttons">
              <button type="button" onClick={addOffCampusSection}>
                Add Off-Campus Course
              </button>
              <button type="button" onClick={removeOffCampusSection} disabled={offCampusCourses.length === 0}>
                Remove
              </button>
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
              />
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
                    <span>
                      {earned} / {required}
                    </span>
                  </div>
                  <div className="category-bar">
                    <div className="category-fill" style={{ width: `${percent}%` }} />
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
              <span className={`gpa-score ${getGPAClass(gpaResult.unweighted)}`}>{gpaResult.unweighted}</span>
            </div>
            <div className="gpa-value">
              <span>Weighted GPA</span>
              <span className={`gpa-score ${getGPAClass(gpaResult.weighted)}`}>{gpaResult.weighted}</span>
            </div>
            <p className="gpa-note">Calculated from selected courses and their assigned grades.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

