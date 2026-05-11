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

// -----------------------------
// LOCAL CACHE HELPERS
// -----------------------------
const LOCAL_KEY = "gpaCache";

function saveToCache(courses, grades) {
  const data = { courses, grades };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
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
        courses: data.gpaCourses || [],
        grades: data.gpaGrades || [],
      };
    }

    return { courses: [], grades: [] };
  } catch (err) {
    console.error('Error loading Firestore data:', err);
    return { courses: [], grades: [] };
  }
};

const loadServicesData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const importedCourses = [];
      const importedGrades = [];

      // Import from regular schedule (Services.jsx courses)
      if (data.courses && typeof data.courses === 'object') {
        Object.entries(data.courses).forEach(([key, course]) => {
          if (course && course.trim()) {
            importedCourses.push(course);
            // Find corresponding grades for this course
            const courseGrades = data.courseGrades || {};
            // Get grade from first quarter
            const grade = courseGrades[`${key}-g1`] || '';
            importedGrades.push(grade);
          }
        });
      }

      // Import from off-campus courses
      if (data.offCampusCourses && Array.isArray(data.offCampusCourses)) {
        data.offCampusCourses.forEach((course, index) => {
          if (course && course.trim()) {
            importedCourses.push(course);
            const grade = data.offCampusGrades?.[index] || '';
            importedGrades.push(grade);
          }
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
  const [numSections, setNumSections] = useState(4);
  const [selectedCourses, setSelectedCourses] = useState(Array(4).fill(''));
  const [grades, setGrades] = useState(Array(4).fill(''));
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
            setNumSections(courses.length);
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
  const handleCourseChange = (index, value) => {
    const newCourses = [...selectedCourses];
    newCourses[index] = value;
    setSelectedCourses(newCourses);
    setError('');

    // Save to cache
    saveToCache(newCourses, grades);

    // Save to Firestore
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCourses: newCourses,
        gpaGrades: grades
      }, { merge: true });
    }
  };

  // -----------------------------
  // GRADE CHANGE
  // -----------------------------
  const handleGradeChange = (index, value) => {
    const newGrades = [...grades];
    newGrades[index] = value;
    setGrades(newGrades);
    setError('');

    // Save to cache
    saveToCache(selectedCourses, newGrades);

    // Save to Firestore
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCourses: selectedCourses,
        gpaGrades: newGrades
      }, { merge: true });
    }
  };

  const addSection = () => {
    setNumSections(numSections + 1);
    setSelectedCourses([...selectedCourses, '']);
    setGrades([...grades, '']);
  };

  const removeSection = () => {
    if (numSections > 1) {
      const newCourses = selectedCourses.slice(0, -1);
      const newGrades = grades.slice(0, -1);

      setNumSections(numSections - 1);
      setSelectedCourses(newCourses);
      setGrades(newGrades);

      saveToCache(newCourses, newGrades);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, {
          gpaCourses: newCourses,
          gpaGrades: newGrades
        }, { merge: true });
      }
    }
  };

  const canCalculate = selectedCourses.length > 0 &&
    selectedCourses.every((c) => c !== '') &&
    grades.every((g) => g !== '');

  const calculateGPA = () => {
    if (!canCalculate) {
      const msg = `Please select a course and grade for all ${selectedCourses.length} dropdowns before calculating.`;
      setError(msg);
      setResult(null);
      return;
    }

    let totalUnweighted = 0;
    let totalWeighted = 0;
    let count = 0;

    for (let i = 0; i < selectedCourses.length; i++) {
      const courseValue = selectedCourses[i];
      const grade = grades[i];
      const course = courses.find((c) => (c.value || c.name) === courseValue);
      const points = gradePoints[grade];
      totalUnweighted += points;
      totalWeighted += course && course.weighted ? points + 1.0 : points;
      count++;
    }

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

  const clearAll = () => {
  const emptyCourses = Array(numSections).fill('');
  const emptyGrades = Array(numSections).fill('');

  setSelectedCourses(emptyCourses);
  setGrades(emptyGrades);
  setResult(null);
  setError('');

  saveToCache(emptyCourses, emptyGrades);

  if (user) {
    const userDocRef = doc(db, 'users', user.uid);

    setDoc(userDocRef, {
      gpaCourses: emptyCourses,
      gpaGrades: emptyGrades
    }, { merge: true });
  }
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
      const newNumSections = importedData.courses.length;
      setNumSections(newNumSections);
      setSelectedCourses(importedData.courses);
      setGrades(importedData.grades);
      setResult(null);
      setError('');

      saveToCache(importedData.courses, importedData.grades);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, {
          gpaCourses: importedData.courses,
          gpaGrades: importedData.grades
        }, { merge: true });
      }

      setShowImportDialog(false);
      setImportedData(null);
    }
  };

  return (
    <main className="gpa-page">
      <div className="gpa-header">
        <h1>GPA Calculator</h1>
        <div className="header-buttons">
          <button className="import-btn" onClick={handleImportFromServices} disabled={!user} title="Import courses from Services page">
            Import from Services
          </button>
          <button className="question-mark-btn" onClick={() => setShowPopup(true)}>?</button>
        </div>
      </div>

      {showImportDialog && importedData && (
        <div className="popup-overlay" onClick={() => setShowImportDialog(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close-x" onClick={() => setShowImportDialog(false)}>×</button>
            <h2>Import Courses from Services</h2>
            <p>Found <strong>{importedData.courses.length}</strong> courses. Replace current courses?</p>
            <div className="import-preview">
              {importedData.courses.map((course, idx) => (
                <div key={idx} className="import-item">
                  <span className="import-course">{course}</span>
                  <span className="import-grade">{importedData.grades[idx] || '-'}</span>
                </div>
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
          <div className="gpa-columns">
            <div className="gpa-course-column">
              <h3>Course</h3>
              {selectedCourses.map((course, index) => (
                <select
                  key={`course-${index}`}
                  value={course}
                  onChange={(e) => handleCourseChange(index, e.target.value)}
                  className="gpa-select course-select"
                  title={course || 'Select Course'}
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => {
                    const courseValue = c.value || c.name;
                    const isOther = c.name === 'Other (Unweighted)' || c.name === 'Other (Weighted)';
                    const isSelectedElsewhere = !isOther && selectedCourses.some(
                      (sc, si) => sc === courseValue && si !== index
                    );
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
              ))}
            </div>

            <div className="gpa-grade-column">
              <h3>Grade</h3>
              {grades.map((grade, index) => (
                <select
                  key={`grade-${index}`}
                  value={grade}
                  onChange={(e) => handleGradeChange(index, e.target.value)}
                  className="gpa-select"
                >
                  <option value="">Select Grade</option>
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          <div className="section-buttons">
            <button onClick={addSection}>Add Section</button>
            <button onClick={removeSection} disabled={numSections <= 1}>Remove Section</button>
          </div>

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