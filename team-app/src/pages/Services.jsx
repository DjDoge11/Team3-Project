import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses, requiredCredits } from '../data/courseCatalog';
import './Services.css';

export default function Courses() {
  const [courses, setCourses] = useState({});
  const [courseGrades, setCourseGrades] = useState({}); // ADDED: State for grades
  const [saveStatus, setSaveStatus] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [searchText, setSearchText] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockedSections, setLockedSections] = useState({});

  // ADDED: Grade Color Mapping
  const gradeColors = {
    'A': '#0077B6', // Dark Blue
    'B': '#2ecc71', // Green
    'C': '#f1c40f', // Yellow
    'D': '#e67e22', // Orange
    'F': '#e74c3c', // Red
    '': 'white'
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.courses) setCourses(data.courses);
            if (data.courseGrades) setCourseGrades(data.courseGrades); // ADDED: Load grades
            if (data.lockedSections) setLockedSections(data.lockedSections);
            setSaveStatus('Loaded from your account');
            setTimeout(() => setSaveStatus(''), 2000);
          }
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ADDED: Handle Grade Input
  const handleGradeChange = async (inputKey, gradeIndex, value) => {
    const [grade, semester] = inputKey.split('-');
    if (isSectionLocked(grade, semester)) return;

    const gradeKey = `${inputKey}-g${gradeIndex}`;
    const newGrades = { ...courseGrades, [gradeKey]: value };
    setCourseGrades(newGrades);

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { courseGrades: newGrades }, { merge: true });
      } catch (e) {
        console.error('Error saving grade:', e);
      }
    }
  };

  const lockSection = async (grade, semester) => {
    const sectionKey = `${grade}-${semester}`;
    const newLocked = { ...lockedSections, [sectionKey]: true };
    setLockedSections(newLocked);

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { lockedSections: newLocked }, { merge: true });
      setSaveStatus(`${grade} ${semester} locked & saved`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const unlockSection = async (grade, semester) => {
    const sectionKey = `${grade}-${semester}`;
    const newLocked = { ...lockedSections };
    delete newLocked[sectionKey];
    setLockedSections(newLocked);

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { lockedSections: newLocked }, { merge: true });
      setSaveStatus(`${grade} ${semester} unlocked`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
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

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { courses: newCourses }, { merge: true });
        setSaveStatus('Auto-saved to your account');
        setTimeout(() => setSaveStatus(''), 1500);
      } catch (e) {
        console.error('Auto-save error:', e);
      }
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
      const newCourses = { ...courses };
      delete newCourses[key];
      setCourses(newCourses);
      localStorage.setItem('courseSelections', JSON.stringify(newCourses));
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
        if (dropdownOpen[inputKey]) {
          setHighlightedIndex(prev => ({
            ...prev,
            [inputKey]: (currentIndex + 1) % filteredCourses.length
          }));
        } else {
          setDropdownOpen(prev => ({ ...prev, [inputKey]: true }));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (dropdownOpen[inputKey]) {
          setHighlightedIndex(prev => ({
            ...prev,
            [inputKey]: (currentIndex - 1 + filteredCourses.length) % filteredCourses.length
          }));
        } else {
          setDropdownOpen(prev => ({ ...prev, [inputKey]: true }));
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (dropdownOpen[inputKey] && filteredCourses.length > 0) {
          const selectedCourse = filteredCourses[currentIndex];
          handleCourseSelect(inputKey, selectedCourse);
        } else if (searchText[inputKey]) {
          const lowerSearch = searchText[inputKey].toLowerCase();
          const closestMatch =
            filteredCourses.find(course =>
              course.toLowerCase().startsWith(lowerSearch)
            ) || filteredCourses[0];
          if (closestMatch) {
            handleCourseSelect(inputKey, closestMatch);
          }
        }
        break;
      case 'Escape':
        setDropdownOpen(prev => ({ ...prev, [inputKey]: false }));
        setHighlightedIndex(prev => ({ ...prev, [inputKey]: 0 }));
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.course-dropdown')) {
        setDropdownOpen({});
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const clearSemester = (grade, semester) => {
    if (confirm(`Clear all courses for ${grade} ${semester}?`)) {
      const newCourses = { ...courses };
      const newGrades = { ...courseGrades }; // Also clear grades for that semester

      Object.keys(newCourses).forEach((key) => {
        if (key.startsWith(`${grade}-${semester}-`)) {
          delete newCourses[key];
        }
      });
      
      // ADDED: Clear associated grades
      Object.keys(newGrades).forEach((key) => {
        if (key.startsWith(`${grade}-${semester}-`)) {
          delete newGrades[key];
        }
      });

      setCourses(newCourses);
      setCourseGrades(newGrades);

      const newSearchText = { ...searchText };
      Object.keys(newSearchText).forEach((key) => {
        if (key.startsWith(`${grade}-${semester}-`)) {
          delete newSearchText[key];
        }
      });
      setSearchText(newSearchText);

      localStorage.setItem('courseSelections', JSON.stringify(newCourses));
      setSaveStatus(`${grade} ${semester} cleared`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  return (
    <main className="services-main">
      <div className="services-header">
        <h1>Course Selection and Credit Requirement</h1>
        {!user && (
          <span className="login-hint">Log in to save automatically</span>
        )}
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
                    <h3>
                      {sem} {isLocked && '🔒'}
                    </h3>
                    <div className="semester-actions">
                      {!isLocked ? (
                        <button
                          className="lock-btn"
                          onClick={() => lockSection(grade, sem)}
                          disabled={!user}
                        >
                          Lock
                        </button>
                      ) : (
                        <button
                          className="unlock-btn"
                          onClick={() => unlockSection(grade, sem)}
                        >
                          Unlock
                        </button>
                      )}
                      {!isLocked && (
                        <button
                          className="clear-semester-btn"
                          onClick={() => clearSemester(grade, sem)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {classSlots.map((slot) => {
                    const inputKey = `${grade}-${sem}-${slot}`;
                    const filteredCourses = getFilteredCourses(
                      searchText[inputKey] || ''
                    );
                    const isDropdownOpen =
                      dropdownOpen[inputKey] && filteredCourses.length > 0;

                    return (
                      <div key={slot} className="course-period-row"> {/* ADDED: Container for period + grades */}
                        <div className="course-input-group">
                          <label>Period {slot}</label>
                          <div className="course-dropdown">
                            <input
                              type="text"
                              placeholder={isLocked ? 'Locked' : 'Course name'}
                              value={searchText[inputKey] || courses[inputKey] || ''}
                              disabled={isLocked}
                              className="course-input"
                              onChange={(e) => {
                                courseInput(grade, sem, slot, e.target.value);
                                handleSearchChange(inputKey, e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, inputKey)}
                              onFocus={() => {
                                if (searchText[inputKey] || courses[inputKey]) {
                                  setDropdownOpen(prev => ({ ...prev, [inputKey]: true }));
                                }
                              }}
                            />
                            {isDropdownOpen && (
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
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="F">F</option>
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