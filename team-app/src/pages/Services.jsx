import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, update } from 'firebase/database';
import { availableCourses, requiredCredits } from '../data/courseCatalog';
 
export default function Courses() {
  const [courses, setCourses] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('courseSelections');
    if (savedData) {
      try {
        setCourses(JSON.parse(savedData));
        setSaveStatus('Loaded from browser storage');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []);

  const courseInput = (grade, semester, slot, value) => {
    const key = `${grade}-${semester}-${slot}`;
    const newCourses = { ...courses, [key]: value };
    setCourses(newCourses);
    
    // Auto-save to localStorage (like Google Forms)
    localStorage.setItem('courseSelections', JSON.stringify(newCourses));
    setSaveStatus('Auto-saved to browser');
    setTimeout(() => setSaveStatus(''), 1500);
  };
  
  const grades = ["9th", "10th", "11th", "12th"];
  const semesters = ["Fall Semester", "Spring Semester"];
  const classSlots = [1, 2, 3, 4];

  const clearSemester = (semester) => {
    if (confirm(`Clear all courses for ${semester}?`)) {
      const newCourses = { ...courses };
      // Remove all courses for this semester
      Object.keys(newCourses).forEach((key) => {
        if (key.includes(`-${semester}-`)) {
          delete newCourses[key];
        }
      });
      setCourses(newCourses);
      localStorage.setItem('courseSelections', JSON.stringify(newCourses));
      setSaveStatus(`${semester} cleared`);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const saveCourses = () => {
    console.log('Saving courses:', courses);
    const coursesRef = ref(database, 'courseData/courses');
    
    // Build the update object using nested paths like 'alanisawesome/nickname'
    const updates = {};
    for (const [key, value] of Object.entries(courses)) {
      if (value && value.trim()) {  // Only save non-empty courses
        updates[key] = value;
      }
    }
    
    console.log('Updates to save:', updates);
    
    if (Object.keys(updates).length > 0) {
      update(coursesRef, updates)
        .then(() => {
          console.log('Courses saved successfully!');
          setSaveStatus('Saved to cloud!');
          setTimeout(() => setSaveStatus(''), 2000);
        })
        .catch((error) => {
          console.error('Error saving courses:', error);
          alert('Error saving courses: ' + error.message);
        });
    } else {
      alert('No courses to save! Please enter some courses first.');
    }
  };

  const clearLocalStorage = () => {
    if (confirm('Clear all saved course data from browser?')) {
      localStorage.removeItem('courseSelections');
      setCourses({});
      setSaveStatus('Browser storage cleared');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  return (
    <main style={{ padding: '1rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Course Selection and Credit Requirement</h1>
      

      {grades.map((grade) => (
        <section key={grade} style={{ marginBottom: '2rem', borderBottom: '`1rem` #EEE5E5' }}>
          <h2>{grade} Grade</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {semesters.map((sem) => (
              <div key={sem} style={{ 
                border: '0.15rem solid #333', 
                padding: '1.5rem', 
                borderRadius: '0.5rem',
                minWidth: '320px',
                width: 'fit-content'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0 }}>{sem}</h3>
                  <button
                    onClick={() => clearSemester(sem)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#19647E',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                </div>
                {classSlots.map((slot) => {
                  const semKey = sem.replace(/ /g, '_');
                  const inputKey = `${grade}-${semKey}-${slot}`;
                  return (
                  <div key={slot} style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Period {slot}</label>
                    <input
                      type="text"
                      placeholder="Enter course name here!"
                      value={courses[inputKey] || ""}
                      onChange={(e) => courseInput(grade, sem, slot, e.target.value)}
                      style={{ 
                        padding: '0.6rem', 
                        width: '100%', 
                        boxSizing: 'border-box',
                        borderRadius: '0.25rem',
                        border: '0.1rem solid #ccc', 
                        outline: 'none',
                        fontSize: '0.9rem',
                        display: 'block'
                      }}
                    />
                  </div>
                  );})}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}