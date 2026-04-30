import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { availableCourses } from '../data/courseCatalog';

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
  const [loading, setLoading] = useState(true);

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

  const calculateGPA = () => {
    const allCoursesFilled = selectedCourses.every((c) => c !== '');
    const allGradesFilled = grades.every((g) => g !== '');

    if (!allCoursesFilled || !allGradesFilled) {
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

  const clearAll = () => {
    setSelectedCourses(['', '', '', '']);
    setGrades(['', '', '', '']);
    setResult(null);
    setError('');
  };

  const addCourse = () => {
    setSelectedCourses([...selectedCourses, '']);
    setGrades([...grades, '']);
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
                    const isOther = c.name === 'Other';
                    const isSelectedElsewhere = !isOther && selectedCourses.some(
                      (sc, si) => sc === courseValue && si !== index
                    );
                    return (
                      <option
                        key={courseValue}
                        value={courseValue}
                        disabled={isSelectedElsewhere}
                      >
                        {c.name} {c.weighted ? '(Weighted)' : '(Unweighted)'}
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
          <button className="add-course-btn" onClick={addCourse}>Add Course</button>
          <div class="button-group">
          <button className="calculate-btn" onClick={calculateGPA}>Calculate</button>
          <button className="clear-btn" onClick={clearAll}>Clear</button>
          </div>
          {error && <p className="gpa-error">{error}</p>}
        </div>

        {result && (
          <div className="gpa-result">
            <h2>Your GPA</h2>
            <p><strong>Unweighted GPA:</strong> {result.unweighted}</p>
            <p><strong>Weighted GPA:</strong> {result.weighted}</p>
          </div>
        )}
      </div>
    </main>
  );
}

