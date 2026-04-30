import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses } from '../data/courseCatalog';
import './Services.css';

export default function Courses() {
  const [courses, setCourses] = useState({});
  const [courseGrades, setCourseGrades] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [searchText, setSearchText] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedSections, setLockedSections] = useState({});

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

    // Immediate Cloud Save
    await syncToFirebase({ courseGrades: newGrades });
  };

  const lockSection = async (grade, semester) => {
    const sectionKey = `${grade}-${semester}`;
    const newLocked = { ...lockedSections, [sectionKey]: true };
    setLockedSections(newLocked);

    await syncToFirebase({ lockedSections: newLocked });
  };

  const unlockSection = async (grade, semester) => {
    const sectionKey = `${grade}-${semester}`;
    const newLocked = { ...lockedSections };
    delete newLocked[sectionKey];
    setLockedSections(newLocked);

    await syncToFirebase({ lockedSections: newLocked });
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

  const handleSearchChange = (key, value) => {
    setSearchText(prev => ({ ...prev, [key]: value }));
    setDropdownOpen(prev => ({ ...prev, [key]: value.length > 0 }));

    if (!value || value.trim() === '') {
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
    const filteredCourses = getFilteredCourses(searchText[inputKey] || '');
    const currentIndex = highlightedIndex[inputKey] || 0;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setDropdownOpen(prev => ({ ...prev, [inputKey]: true }));
        setHighlightedIndex(prev => ({
          ...prev,
          [inputKey]: (currentIndex + 1) % filteredCourses.length
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => ({
          ...prev,
          [inputKey]: (currentIndex - 1 + filteredCourses.length) % filteredCourses.length
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (dropdownOpen[inputKey] && filteredCourses.length > 0) {
          handleCourseSelect(inputKey, filteredCourses[currentIndex]);
        }
        break;
      case 'Escape':
        setDropdownOpen(prev => ({ ...prev, [inputKey]: false }));
        break;
      default:
        break;
    }
  };

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
                    const filteredCourses = getFilteredCourses(searchText[inputKey] || '');
                    const isDropdownOpen = dropdownOpen[inputKey] && filteredCourses.length > 0;

                    return (
                      <div key={slot} className="course-period-row">
                        <div className="course-input-group">
                          <label>Period {slot}</label>
                          <div className="course-dropdown">
                            <input
                              type="text"
                              placeholder={isLocked ? 'Locked' : 'Search courses...'}
                              value={searchText[inputKey] || courses[inputKey] || ''}
                              disabled={isLocked}
                              className="course-input"
                              onChange={(e) => handleSearchChange(inputKey, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, inputKey)}
                              onFocus={() => setDropdownOpen(prev => ({ ...prev, [inputKey]: true }))}
                            />
                            {isDropdownOpen && !isLocked && (
                              <ul className="dropdown-list">
                                {filteredCourses.slice(0, 10).map((course, idx) => (
                                  <li
                                    key={course}
                                    className={`dropdown-item ${idx === highlightedIndex[inputKey] ? 'highlighted' : ''}`}
                                    onClick={() => handleCourseSelect(inputKey, course)}
                                  >
                                    {course} <span className="course-category">({availableCourses[course].category})</span>
                                  </li>
                                ))}
                              </ul>
                            )}
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