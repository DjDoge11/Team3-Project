import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses } from '../data/courseCatalog';
import './GPACalculator.css';
import CourseDropdown from '../components/CourseDropdown';

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

export default function GPA() {
  const [numSections, setNumSections] = useState(4);
  const [selectedCourses, setSelectedCourses] = useState(Array(4).fill(''));
  const [grades, setGrades] = useState(Array(4).fill(''));
  const [showPopup, setShowPopup] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [_loading, setLoading] = useState(true);

  // Monitor auth state and load user GPA data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // If user is logged in, load their saved GPA data from Firestore
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.gpaCourses && data.gpaGrades) {
              setSelectedCourses(data.gpaCourses);
              setGrades(data.gpaGrades);
              setNumSections(data.gpaCourses.length || 4);
            }
          }
        } catch (e) {
          console.error('Error loading user GPA data:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCourseChange = (index, value) => {
    const newCourses = [...selectedCourses];
    newCourses[index] = value;
    setSelectedCourses(newCourses);
    setError('');
    
    // Auto-save to Firestore if user is logged in
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { 
        gpaCourses: newCourses, 
        gpaGrades: grades 
      }, { merge: true });
    }
  };

  const handleGradeChange = (index, value) => {
    const newGrades = [...grades];
    newGrades[index] = value;
    setGrades(newGrades);
    setError('');
    
    // Auto-save to Firestore if user is logged in
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
      setNumSections(numSections - 1);
      setSelectedCourses(selectedCourses.slice(0, -1));
      setGrades(grades.slice(0, -1));
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
    const empty = ['', '', '', ''];
    setSelectedCourses(empty);
    setGrades(empty);
    setResult(null);
    setError('');

    // Clear cache
    saveToCache(empty, empty);

    // Clear Firestore
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        gpaCourses: empty,
        gpaGrades: empty
      }, { merge: true });
    }
  };

  return (
    <main className="gpa-page">
      <div className="gpa-header">
        <h1>GPA Calculator</h1>
        <button className="question-mark-btn" onClick={() => setShowPopup(true)}>?</button>
      </div>

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
            <p>If you don’t see your course, use the Other course option.</p>
          </div>
        </div>
      )}

      <div className="gpa-calculator-container container">
        <div className="gpa-inputs card">
          <div className="gpa-columns">
            <div className="gpa-course-column">
              <h3>Course</h3>
              {selectedCourses.map((course, index) => (
                <div key={`course-${index}`} className="gpa-course-item">
                  <CourseDropdown
                    inputKey={`gpa-${index}`}
                    value={course}
                    onChange={(v) => handleCourseChange(index, v)}
                    disabled={false}
                    availableCourses={availableCourses}
                    isSelectedElsewhere={(candidate) => {
                      const isOther = candidate === 'Other (Weighted)' || candidate === 'Other (Unweighted)';
                      if (isOther) return false;
                      return selectedCourses.some((sc, si) => si !== index && sc === candidate);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="gpa-grade-column">
              <h3>Grade</h3>
              {grades.map((grade, index) => (
                <div key={`grade-${index}`} className="gpa-grade-item">
                  <select
                    value={grades[index]}
                    onChange={(e) => handleGradeChange(index, e.target.value)}
                    className="gpa-select input-common"
                    aria-label={`Grade for section ${index + 1}`}
                  >
                    <option value="">Grade</option>
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
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
          <div className="gpa-result card">
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

