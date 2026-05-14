import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses } from '../data/courseCatalog';
import './GPACalculator.css';

// Convert availableCourses object to array format used by the component
const courses = Object.entries(availableCourses).map(([name, data]) => ({
  name,
  value: name,
  weighted: data.weighted,
}));

const gradePoints = {
  'A': 4.0,
  'B': 3.0,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};

const gradeOptions = ['A', 'B', 'C', 'D', 'F'];

const LOCAL_KEY = "gpaCalculatorCache";
const MAX_YEARS = 4;
const emptyGradePair = () => ['', ''];

function normalizeSavedCourses(rawCourses) {
  if (!Array.isArray(rawCourses)) return makeInitialYearCourses();

  const isFlatCourseList = rawCourses.every((item) => typeof item === 'string');
  if (isFlatCourseList) {
    return [rawCourses, ...Array.from({ length: MAX_YEARS - 1 }, () => [])];
  }

  return Array.from({ length: MAX_YEARS }, (_, i) => {
    if (!Array.isArray(rawCourses[i])) return [];
    return rawCourses[i].map((course) => course || '');
  });
}

function normalizeSavedGrades(rawGrades) {
  if (!Array.isArray(rawGrades)) return Array.from({ length: MAX_YEARS }, () => []);

  const isFlatGradeList = rawGrades.every((item) => typeof item === 'string');
  if (isFlatGradeList) {
    return [rawGrades.map((grade) => [grade, grade]), ...Array.from({ length: MAX_YEARS - 1 }, () => [])];
  }

  return Array.from({ length: MAX_YEARS }, (_, i) => {
    if (!Array.isArray(rawGrades[i])) return [];
    return rawGrades[i].map((pair) => {
      if (Array.isArray(pair)) {
        return [pair[0] || '', pair[1] || ''];
      }
      if (typeof pair === 'string') {
        return [pair, pair];
      }
      return emptyGradePair();
    });
  });
}

function makeInitialYearCourses() {
  return Array.from({ length: MAX_YEARS }, () => ['']);
}

function makeInitialYearGrades() {
  return Array.from({ length: MAX_YEARS }, () => [emptyGradePair()]);
}

function saveToCache(courses, grades, offCampusCourses = [], offCampusGrades = []) {
  const data = { courses, grades, offCampusCourses, offCampusGrades };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      courses: normalizeSavedCourses(data.courses),
      grades: normalizeSavedGrades(data.grades),
      offCampusCourses: Array.isArray(data.offCampusCourses) ? data.offCampusCourses : [],
      offCampusGrades: Array.isArray(data.offCampusGrades) ? data.offCampusGrades : [],
    };
  } catch {
    return null;
  }
}

const loadUserCoursesAndGrades = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();

      return {
        courses: normalizeSavedCourses(data.gpaCalculator?.courses ?? (data.gpaCourses || [])),
        grades: normalizeSavedGrades(data.gpaCalculator?.grades ?? (data.gpaGrades || [])),
        offCampusCourses: data.gpaCalculator?.offCampusCourses || [],
        offCampusGrades: data.gpaCalculator?.offCampusGrades || [],
      };
    }

    return { courses: [], grades: [], offCampusCourses: [], offCampusGrades: [] };
  } catch (err) {
    console.error('Error loading Firestore data:', err);
    return { courses: [], grades: [], offCampusCourses: [], offCampusGrades: [] };
  }
};

const loadServicesData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const importedCourses = Array.from({ length: MAX_YEARS }, () => []);
      const importedGrades = Array.from({ length: MAX_YEARS }, () => []);
      const gradeOrder = { '9th': 0, '10th': 1, '11th': 2, '12th': 3 };
      const courseGrades = data.courseGrades || {};

      // Import from regular schedule (Services.jsx courses) into year groups
      if (data.courses && typeof data.courses === 'object') {
        Object.entries(data.courses)
          .filter(([, course]) => course && course.trim())
          .sort(([keyA], [keyB]) => {
            const gradeA = keyA.split('-')[0];
            const gradeB = keyB.split('-')[0];
            return (gradeOrder[gradeA] ?? 99) - (gradeOrder[gradeB] ?? 99) || keyA.localeCompare(keyB);
          })
          .forEach(([key, course]) => {
            const grade = key.split('-')[0];
            const yearIndex = gradeOrder[grade];
            if (yearIndex === undefined) return;
            importedCourses[yearIndex].push(course);
            importedGrades[yearIndex].push([
              courseGrades[`${key}-g1`] || '',
              courseGrades[`${key}-g2`] || '',
            ]);
          });
      }

      // Append off-campus courses into the first available year
      if (data.offCampusCourses && Array.isArray(data.offCampusCourses)) {
        data.offCampusCourses.forEach((course, index) => {
          if (!course || !course.trim()) return;
          const grade = data.offCampusGrades?.[index] || '';
          importedCourses[0].push(course);
          importedGrades[0].push([grade, grade]);
        });
      }

      return {
        courses: importedCourses,
        grades: importedGrades,
      };
    }

    return { courses: [], grades: [] };
  } catch (err) {
    console.error('Error loading Services data:', err);
    return { courses: [], grades: [] };
  }
};

export default function GPA() {
  const cachedData = loadFromCache();
  const yearLabels = ['9th', '10th', '11th', '12th'];
  const [selectedCourses, setSelectedCourses] = useState(cachedData?.courses || makeInitialYearCourses());
  const [grades, setGrades] = useState(() => cachedData?.grades || makeInitialYearGrades());
  const [offCampusCourses, setOffCampusCourses] = useState(cachedData?.offCampusCourses || []);
  const [offCampusGrades, setOffCampusGrades] = useState(cachedData?.offCampusGrades || []);
  const [showPopup, setShowPopup] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedData, setImportedData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);



useEffect(() => {
  let isMounted = true; // Track if component is mounted

  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);

    if (currentUser) {
      try {
        const { courses, grades } = await loadUserCoursesAndGrades(currentUser.uid);
        
        // Only update state if the component is still active
        if (isMounted) {
          if (courses?.length && grades?.length) {
            setSelectedCourses(courses);
            setGrades(grades);
            saveToCache(courses, grades);
          }
          setLoading(false); 
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        if (isMounted) setLoading(false);
      }
    } else {
      if (isMounted) setLoading(false);
    }
  });

  return () => {
    isMounted = false; // Cleanup
    unsubscribe();
  };
}, []);

  // -----------------------------
  // COURSE CHANGE
  // -----------------------------
  const handleCourseChange = (yearIndex, rowIndex, value) => {
    const newCourses = selectedCourses.map((year, yIndex) => {
      if (yIndex !== yearIndex) return year;
      return year.map((course, cIndex) => (cIndex === rowIndex ? value : course));
    });
    setSelectedCourses(newCourses);
    setError('');

    // Save to cache
    saveToCache(newCourses, grades);

    // Save to Firestore
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: newCourses,
          grades,
        },
      }, { merge: true });
    }
  };

  // -----------------------------
  // GRADE CHANGE
  // -----------------------------
  const handleGradeChange = (yearIndex, rowIndex, gradeIndex, value) => {
    const newGrades = grades.map((year, yIndex) => {
      if (yIndex !== yearIndex) return year;
      return year.map((pair, cIndex) => {
        if (cIndex !== rowIndex) return pair;
        const nextPair = [...pair];
        nextPair[gradeIndex] = value;
        return nextPair;
      });
    });
    setGrades(newGrades);
    setError('');

    saveToCache(selectedCourses, newGrades);

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: selectedCourses,
          grades: newGrades,
        },
      }, { merge: true });
    }
  };

  const addCourse = (yearIndex) => {
    const newCourses = selectedCourses.map((year, yIndex) => (
      yIndex !== yearIndex ? year : [...year, '']
    ));
    const newGrades = grades.map((year, yIndex) => (
      yIndex !== yearIndex ? year : [...year, emptyGradePair()]
    ));

    setSelectedCourses(newCourses);
    setGrades(newGrades);
    saveToCache(newCourses, newGrades);

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: newCourses,
          grades: newGrades,
        },
      }, { merge: true });
    }
  };

  const removeCourse = (yearIndex, rowIndex) => {
    const newCourses = selectedCourses.map((year, yIndex) => {
      if (yIndex !== yearIndex) return year;
      return year.filter((_, idx) => idx !== rowIndex);
    });
    const newGrades = grades.map((year, yIndex) => {
      if (yIndex !== yearIndex) return year;
      return year.filter((_, idx) => idx !== rowIndex);
    });

    setSelectedCourses(newCourses);
    setGrades(newGrades);
    saveToCache(newCourses, newGrades);

    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: newCourses,
          grades: newGrades,
        },
      }, { merge: true });
    }
  };

  // Off-Campus Course Handlers
  const handleOffCampusCourseChange = (index, value) => {
    const newCourses = offCampusCourses.map((course, idx) => (idx === index ? value : course));
    setOffCampusCourses(newCourses);
    saveToCache(selectedCourses, grades, newCourses, offCampusGrades);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: selectedCourses,
          grades,
          offCampusCourses: newCourses,
          offCampusGrades,
        },
      }, { merge: true });
    }
  };

  const handleOffCampusGradeChange = (index, gradeIndex, value) => {
    const newGrades = offCampusGrades.map((pair, idx) => {
      if (idx !== index) return pair;
      return [
        gradeIndex === 0 ? value : pair[0],
        gradeIndex === 1 ? value : pair[1],
      ];
    });
    setOffCampusGrades(newGrades);
    saveToCache(selectedCourses, grades, offCampusCourses, newGrades);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: selectedCourses,
          grades,
          offCampusCourses,
          offCampusGrades: newGrades,
        },
      }, { merge: true });
    }
  };

  const addOffCampusCourse = () => {
    const newCourses = [...offCampusCourses, ''];
    const newGrades = [...offCampusGrades, emptyGradePair()];
    setOffCampusCourses(newCourses);
    setOffCampusGrades(newGrades);
    saveToCache(selectedCourses, grades, newCourses, newGrades);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: selectedCourses,
          grades,
          offCampusCourses: newCourses,
          offCampusGrades: newGrades,
        },
      }, { merge: true });
    }
  };

  const removeOffCampusCourse = (index) => {
    const newCourses = offCampusCourses.filter((_, idx) => idx !== index);
    const newGrades = offCampusGrades.filter((_, idx) => idx !== index);
    setOffCampusCourses(newCourses);
    setOffCampusGrades(newGrades);
    saveToCache(selectedCourses, grades, newCourses, newGrades);
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCalculator: {
          courses: selectedCourses,
          grades,
          offCampusCourses: newCourses,
          offCampusGrades: newGrades,
        },
      }, { merge: true });
    }
  };

  const validRows = selectedCourses.flatMap((year, yearIndex) =>
    year.map((course, rowIndex) => {
      const [grade1, grade2] = grades[yearIndex]?.[rowIndex] || emptyGradePair();
      return course !== '' && grade1 !== '' && grade2 !== '';
    })
  );
  const hasInvalidRow = selectedCourses.some((year, yearIndex) =>
    year.some((course, rowIndex) => {
      const [grade1, grade2] = grades[yearIndex]?.[rowIndex] || emptyGradePair();
      return course !== '' && (grade1 === '' || grade2 === '');
    })
  );
  const hasValidRow = validRows.some(Boolean);
  const canCalculate = hasValidRow && !hasInvalidRow;

  const calculateGPA = () => {
    if (!canCalculate) {
      const msg = hasInvalidRow
        ? 'Please fill both grades for any selected course before calculating.'
        : 'Please select at least one course with both grades before calculating.';
      setError(msg);
      setResult(null);
      return;
    }

    let totalUnweighted = 0;
    let totalWeighted = 0;
    let count = 0;

    selectedCourses.forEach((year, yearIndex) => {
      year.forEach((courseValue, rowIndex) => {
        const [grade1, grade2] = grades[yearIndex]?.[rowIndex] || emptyGradePair();
        if (!courseValue || !grade1 || !grade2) return;
        const course = courses.find((c) => (c.value || c.name) === courseValue);
        const points1 = gradePoints[grade1] ?? 0;
        const points2 = gradePoints[grade2] ?? 0;
        const averagePoints = (points1 + points2) / 2;
        totalUnweighted += averagePoints;
        totalWeighted += course && course.weighted ? averagePoints + 1.0 : averagePoints;
        count++;
      });
    });

    setResult({
      unweighted: (totalUnweighted / count).toFixed(2),
      weighted: (totalWeighted / count).toFixed(2),
    });
    setError('');
  };

  const getGPAClass = (value) => {
    const numeric = parseFloat(value);
    if (Number.isNaN(numeric) || numeric === 0) {
      return 'gpa-score-gray';
    }
    if (numeric >= 5.0) {
      return 'gpa-score-blue';
    }
    if (numeric >= 4.0) {
      return 'gpa-score-green';
    }
    if (numeric >= 3.0) {
      return 'gpa-score-yellow';
    }
    if (numeric >= 2.0) {
      return 'gpa-score-orange';
    }
    if (numeric >= 1.0) {
      return 'gpa-score-red';
    }

    return 'gpa-score-gray';
  };

  const handleImportFromServices = async () => {
    if (!user) {
      setError('Please log in to import courses');
      return;
    }

    try {
      const data = await loadServicesData(user.uid);
      if (data.courses.length === 0) {
        setError('No courses found in Services. Please add courses in the Services page first.');
        return;
      }

      setImportedData(data);
      setShowImportDialog(true);
      setError('');
    } catch (err) {
      console.error('Error importing from Services:', err);
      setError('Error loading courses from Services');
    }
  };

  const confirmImport = () => {
    if (importedData) {
      setSelectedCourses(importedData.courses);
      setGrades(importedData.grades);
      setResult(null);
      setError('');

      saveToCache(importedData.courses, importedData.grades);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, {
          gpaCalculator: {
            courses: importedData.courses,
            grades: importedData.grades,
          },
        }, { merge: true });
      }

      setShowImportDialog(false);
      setImportedData(null);
    }
  };

  if (loading) {
    return (
      <main className="gpa-page">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="gpa-page">
      <div className="gpa-header">
        <h1>GPA Calculator</h1>
        <div className="header-buttons">
          <button className="import-btn" onClick={handleImportFromServices} disabled={!user} title="Import courses from Services page">
            Import from Courses
          </button>
          <button className="question-mark-btn" onClick={() => setShowPopup(true)}>?</button>
        </div>
      </div>

      {showImportDialog && importedData && (
        <div className="popup-overlay" onClick={() => setShowImportDialog(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close-x" onClick={() => setShowImportDialog(false)}>×</button>
            <h2>Import Courses from Services</h2>
            <p>Found <strong>{importedData.courses.reduce((sum, year) => sum + year.length, 0)}</strong> courses. Replace current courses?</p>
            <div className="import-preview">
              {importedData.courses.map((yearCourses, yearIndex) => (
                yearCourses.map((course, idx) => (
                  <div key={`${yearIndex}-${idx}`} className="import-item">
                    <span className="import-course">{course}</span>
                    <span className="import-grade">
                      {(importedData.grades[yearIndex]?.[idx]?.[0] || '-')}
                      {' / '}
                      {(importedData.grades[yearIndex]?.[idx]?.[1] || '-')}
                    </span>
                    <span className="import-year">{yearLabels[yearIndex]}</span>
                  </div>
                ))
              ))}
            </div>
            <div className="import-dialog-buttons">
              <button className="confirm-btn" onClick={confirmImport}>Import</button>
              <button className="cancel-btn" onClick={() => setShowImportDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close-x" onClick={() => setShowPopup(false)}>×</button>
            <h2>How to Use</h2>
            <p>Select courses and their grades, then click <strong>Calculate</strong>.</p>
            <h3>Grading Scale</h3>
            <ul>
              <li>A = 4.0</li>
              <li>B = 3.0</li>
              <li>C = 2.0</li>
              <li>D = 1.0</li>
              <li>F = 0.0</li>
            </ul>
            <p><strong>Weighted:</strong> AP and Integrated Math 3 Honors get +1.0.</p>
          </div>
        </div>
      )}

      <div className="gpa-calculator-container">
        <div className="gpa-inputs">
          {yearLabels.map((yearLabel, yearIndex) => (
            <section key={yearLabel} className="gpa-year-section">
              <h2>{yearLabel}</h2>

              {selectedCourses[yearIndex].map((course, rowIndex) => {
                const gradePair = grades[yearIndex]?.[rowIndex] || emptyGradePair();
                const selected = new Set(selectedCourses.flat().filter(Boolean));
                selected.delete(course);
                return (
                  <div key={`${yearIndex}-${rowIndex}`} className="gpa-course-row">
                    <select
                      value={course}
                      onChange={(e) => handleCourseChange(yearIndex, rowIndex, e.target.value)}
                      className="gpa-select course-select"
                      title={course || 'Select Course'}
                    >
                      <option value="">Select Course</option>
                      {courses.map((c) => {
                        const courseValue = c.value || c.name;
                        const isOther = c.name === 'Other (Unweighted)' || c.name === 'Other (Weighted)';
                        const isSelectedElsewhere = !isOther && selected.has(courseValue);
                        return (
                          <option
                            key={courseValue}
                            value={courseValue}
                            disabled={isSelectedElsewhere}
                          >
                            {c.name}
                          </option>
                        );
                      })}
                    </select>

                    <select
                      value={gradePair[0]}
                      onChange={(e) => handleGradeChange(yearIndex, rowIndex, 0, e.target.value)}
                      className="gpa-select"
                    >
                      <option value="">Q1/Q3</option>
                      {gradeOptions.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <select
                      value={gradePair[1]}
                      onChange={(e) => handleGradeChange(yearIndex, rowIndex, 1, e.target.value)}
                      className="gpa-select"
                    >
                      <option value="">Q2/Q4</option>
                      {gradeOptions.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="remove-course-btn"
                      onClick={() => removeCourse(yearIndex, rowIndex)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              <button type="button" className="add-course-btn" onClick={() => addCourse(yearIndex)}>
                Add Course
              </button>
            </section>
          ))}

          <button className="calculate-btn" onClick={calculateGPA} disabled={!canCalculate}>Calculate</button>
          {error && <p className="gpa-error">{error}</p>}
        </div>

        {result && (
          <div className="gpa-result">
            <h2>Your GPA</h2>
            <p>
              <strong>Unweighted GPA:</strong>
              <span className={`gpa-score ${getGPAClass(result.unweighted)}`}>
                {result.unweighted}
              </span>
            </p>
            <p>
              <strong>Weighted GPA:</strong>
              <span className={`gpa-score ${getGPAClass(result.weighted)}`}>
                {result.weighted}
              </span>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}