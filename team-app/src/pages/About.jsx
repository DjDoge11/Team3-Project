import React, { useState } from 'react';

const courses = [
  { name: 'English 9', weighted: false },
  { name: 'English 9 Honors', weighted: false },
  { name: 'English 10', weighted: false },
  { name: 'English 10 Honors', weighted: false },
  { name: 'English 11', weighted: false },
  { name: 'AP English Language & Composition', weighted: true },
  { name: 'English 12', weighted: false },
  { name: 'AP English Literature & Composition', weighted: true },
  { name: 'Integrated Math 1', weighted: false },
  { name: 'Integrated Math 1 Honors', weighted: false },
  { name: 'Integrated Math 2', weighted: false },
  { name: 'Integrated Math 2 Honors', weighted: false },
  { name: 'Integrated Math 3', weighted: false },
  { name: 'Integrated Math 3 Honors', weighted: true },
  { name: 'Precalculus', weighted: false },
  { name: 'Precalculus Honors', weighted: false },
  { name: 'AP Calculus AB', weighted: true },
  { name: 'AP Calculus BC', weighted: true },
  { name: 'AP Statistics', weighted: true },
  { name: 'Advanced Math / Post-Calculus', weighted: false },
  { name: 'Multivariable Calculus', weighted: false },
  { name: 'Linear Algebra', weighted: false },
  { name: 'Biology / Life Science', weighted: false },
  { name: 'Biology', weighted: false },
  { name: 'Biology Honors', weighted: false },
  { name: 'AP Biology', weighted: true },
  { name: 'Chemistry', weighted: false },
  { name: 'Chemistry Honors', weighted: false },
  { name: 'AP Chemistry', weighted: true },
  { name: 'Physics', weighted: false },
  { name: 'Physics Honors', weighted: false },
  { name: 'AP Physics 1', weighted: true },
  { name: 'AP Physics C', weighted: true },
  { name: 'Environmental Science', weighted: false },
  { name: 'AP Environmental Science', weighted: true },
  { name: 'Anatomy & Physiology', weighted: false },
  { name: 'Biotechnology', weighted: false },
  { name: 'World History', weighted: false },
  { name: 'AP World History', weighted: true },
  { name: 'U.S. History', weighted: false },
  { name: 'AP U.S. History', weighted: true },
  { name: 'American Government', weighted: false },
  { name: 'Economics', weighted: false },
  { name: 'AP Government & Politics', weighted: true },
  { name: 'AP Macroeconomics', weighted: true },
  { name: 'AP Microeconomics', weighted: true },
  { name: 'AP Psychology', weighted: true },
  { name: 'Spanish 1', weighted: false },
  { name: 'Spanish 2', weighted: false },
  { name: 'Spanish 3', weighted: false },
  { name: 'Spanish 4', weighted: false },
  { name: 'Spanish Honors', weighted: false },
  { name: 'AP Spanish Language', weighted: true },
  { name: 'French 1', weighted: false },
  { name: 'French 2', weighted: false },
  { name: 'French 3', weighted: false },
  { name: 'French 4', weighted: false },
  { name: 'French Honors', weighted: false },
  { name: 'AP French', weighted: true },
  { name: 'Mandarin Chinese 1', weighted: false },
  { name: 'Mandarin Chinese 2', weighted: false },
  { name: 'Mandarin Chinese 3', weighted: false },
  { name: 'Mandarin Chinese 4', weighted: false },
  { name: 'AP Chinese Language', weighted: true },
  { name: 'Japanese 1', weighted: false },
  { name: 'Japanese 2', weighted: false },
  { name: 'Japanese 3', weighted: false },
  { name: 'Japanese 4', weighted: false },
  { name: 'AP Japanese Language', weighted: true },
  { name: 'American Sign Language (ASL)', weighted: false },
  { name: 'PE Year 1', weighted: false },
  { name: 'Dance 1', weighted: false },
  { name: 'Dance 2 / Advanced Dance', weighted: false },
  { name: 'Athletic PE', weighted: false },
  { name: 'Visual Art 1', weighted: false },
  { name: 'Visual Art 2', weighted: false },
  { name: 'Advanced Visual Art', weighted: false },
  { name: 'AP Studio Art', weighted: true },
  { name: 'Digital Art', weighted: false },
  { name: 'Graphic Design', weighted: false },
  { name: 'Film 1', weighted: false },
  { name: 'Film 2', weighted: false },
  { name: 'Advanced Film', weighted: false },
  { name: 'Screenwriting', weighted: false },
  { name: 'Cinematography', weighted: false },
  { name: 'Video Production', weighted: false },
  { name: 'Theatre Arts 1', weighted: false },
  { name: 'Theatre Arts 2', weighted: false },
  { name: 'Advanced Theatre', weighted: false },
  { name: 'Musical Theatre', weighted: false },
  { name: 'Concert Band', weighted: false },
  { name: 'Symphonic Band', weighted: false },
  { name: 'Orchestra', weighted: false },
  { name: 'Advanced Orchestra', weighted: false },
  { name: 'Jazz Band', weighted: false },
  { name: 'Choir', weighted: false },
  { name: 'Advanced Choir', weighted: false },
  { name: 'Vocal Ensemble', weighted: false },
  { name: 'Dance 1', weighted: false },
  { name: 'Dance 2', weighted: false },
  { name: 'Advanced Dance', weighted: false },
  { name: 'Envision Dance', weighted: false },
  { name: 'Computer Science Principles', weighted: false },
  { name: 'AP Computer Science A', weighted: true },
  { name: 'Programming / Software Development', weighted: false },
  { name: 'Engineering Design', weighted: false },
  { name: 'Robotics', weighted: false },
  { name: 'Advanced Engineering', weighted: false },
  { name: 'Business Management', weighted: false },
  { name: 'Entrepreneurship', weighted: false },
  { name: 'Marketing', weighted: false },
  { name: 'Digital Media', weighted: false },
  { name: 'Web Design', weighted: false },
  { name: 'Envision Cinema', weighted: false },
  { name: 'Envision Dance', weighted: false },
  { name: 'Envision Theatre', weighted: false },
  { name: 'Envision Instrumental Music', weighted: false },
  { name: 'Envision Vocal Music', weighted: false },
  { name: 'Envision Visual Arts', weighted: false },
  { name: 'Envision Humanities', weighted: false },
  { name: 'Academic Support', weighted: false },
  { name: 'Study Skills', weighted: false },
  { name: 'Teacher Assistant (TA)', weighted: false },
  { name: 'Other', value: 'other-weighted', weighted: true },
  { name: 'Other', value: 'other-unweighted', weighted: false },
];

const gradePoints = {
  'A': 4.0,
  'B': 3.0,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};

const gradeOptions = ['A', 'B', 'C', 'D', 'F'];

export default function GPA() {
  const [selectedCourses, setSelectedCourses] = useState(['', '', '', '']);
  const [grades, setGrades] = useState(['', '', '', '']);
  const [showPopup, setShowPopup] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCourseChange = (index, value) => {
    const newCourses = [...selectedCourses];
    newCourses[index] = value;
    setSelectedCourses(newCourses);
    setError('');
  };

  const handleGradeChange = (index, value) => {
    const newGrades = [...grades];
    newGrades[index] = value;
    setGrades(newGrades);
    setError('');
  };

  const calculateGPA = () => {
    const allCoursesFilled = selectedCourses.every((c) => c !== '');
    const allGradesFilled = grades.every((g) => g !== '');

    if (!allCoursesFilled || !allGradesFilled) {
      const msg = 'Please select a course and grade for all 8 dropdowns before calculating.';
      setError(msg);
      setResult(null);
      return;
    }

    let totalUnweighted = 0;
    let totalWeighted = 0;
    let count = 0;

    for (let i = 0; i < 4; i++) {
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
            <p>Select up to 4 courses and their grades, then click <strong>Calculate</strong>.</p>
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
          <button className="calculate-btn" onClick={calculateGPA}>Calculate</button>
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

