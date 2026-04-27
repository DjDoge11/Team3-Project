import React, { useState, useEffect, useRef } from 'react';
import { database } from '../firebase';
import { ref, update } from 'firebase/database';
import { availableCourses, requiredCredits } from '../data/courseCatalog';
 
export default function Courses() {
  const [courses, setCourses] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [searchText, setSearchText] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState({});

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
    const newCourses = { ...courses };
    
    // If value is empty, delete the key; otherwise save the value
    if (value && value.trim()) {
      newCourses[key] = value;
    } else {
      delete newCourses[key];
    }
    
    setCourses(newCourses);
    
    // Auto-save to localStorage (like Google Forms)
    localStorage.setItem('courseSelections', JSON.stringify(newCourses));
    setSaveStatus('Auto-saved to browser');
    setTimeout(() => setSaveStatus(''), 1500);
  };
  
  const grades = ["9th", "10th", "11th", "12th"];
  const semesters = ["Fall Semester", "Spring Semester"];
  const classSlots = [1, 2, 3, 4];

  // Get all course names from availableCourses
  const courseList = Object.keys(availableCourses);

  // Filter courses based on search text
  const getFilteredCourses = (search) => {
    if (!search || search.length === 0) return courseList;
    const lowerSearch = search.toLowerCase();
    return courseList.filter(course => 
      course.toLowerCase().includes(lowerSearch)
    );
  };

  // Handle search input change
  const handleSearchChange = (key, value) => {
    setSearchText(prev => ({ ...prev, [key]: value }));
    setDropdownOpen(prev => ({ ...prev, [key]: value.length > 0 }));
    
    // If user deletes all text, also clear the course from courses state
    if (!value || value.trim() === '') {
      const newCourses = { ...courses };
      delete newCourses[key];
      setCourses(newCourses);
      localStorage.setItem('courseSelections', JSON.stringify(newCourses));
    }
  };

  // Handle course selection from dropdown
  const handleCourseSelect = (key, course) => {
    courseInput(key.split('-')[0], key.split('-')[1], key.split('-')[2], course);
    setSearchText(prev => ({ ...prev, [key]: course }));
    setDropdownOpen(prev => ({ ...prev, [key]: false }));
    setHighlightedIndex(prev => ({ ...prev, [key]: 0 }));
  };

  // Handle keyboard navigation
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
          // Select the highlighted course
          const selectedCourse = filteredCourses[currentIndex];
          handleCourseSelect(inputKey, selectedCourse);
        } else if (searchText[inputKey]) {
          // If dropdown is closed but there's text, try to find closest match
          const lowerSearch = searchText[inputKey].toLowerCase();
          const closestMatch = filteredCourses.find(course => 
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.course-dropdown')) {
        setDropdownOpen({});
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const clearSemester = (semester) => {
    if (confirm(`Clear all courses for ${semester}?`)) {
      const semKey = semester.replace(/ /g, '_');
      const newCourses = { ...courses };
      // Remove all courses for this semester (match both formats for compatibility)
      Object.keys(newCourses).forEach((key) => {
        if (key.includes(`-${semKey}-`) || key.includes(`-${semester}-`)) {
          delete newCourses[key];
        }
      });
      setCourses(newCourses);
      // Also clear searchText for these inputs
      const newSearchText = { ...searchText };
      Object.keys(newSearchText).forEach((key) => {
        if (key.includes(`-${semKey}-`) || key.includes(`-${semester}-`)) {
          delete newSearchText[key];
        }
      });
      setSearchText(newSearchText);
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
                  const filteredCourses = getFilteredCourses(searchText[inputKey] || '');
                  const isDropdownOpen = dropdownOpen[inputKey] && filteredCourses.length > 0;
                  return (
                  <div key={slot} style={{ marginBottom: '0.75rem', position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Period {slot}</label>
                    <div className="course-dropdown" style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Enter or select course name"
                        value={searchText[inputKey] || courses[inputKey] || ""}
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
                        style={{ 
                        padding: '0.6rem', 
                        paddingRight: '2rem',
                        width: '100%', 
                        boxSizing: 'border-box',
                        borderRadius: '0.25rem',
                        border: '0.1rem solid #ccc', 
                        outline: 'none',
                        fontSize: '0.9rem',
                        display: 'block'
                      }}
                    />
                    {(searchText[inputKey] || courses[inputKey]) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const newCourses = { ...courses };
                          delete newCourses[inputKey];
                          setCourses(newCourses);
                          const newSearchText = { ...searchText };
                          delete newSearchText[inputKey];
                          setSearchText(newSearchText);
                          localStorage.setItem('courseSelections', JSON.stringify(newCourses));
                          setSaveStatus('Cleared');
                          setTimeout(() => setSaveStatus(''), 1500);
                        }}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          color: '#666',
                          padding: '0.2rem',
                          lineHeight: 1,
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#333'}
                        onMouseLeave={(e) => e.target.style.color = '#666'}
                        title="Clear course"
                      >
                        ×
                      </button>
                    )}
                    {isDropdownOpen && (
                      <ul style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '0.1rem solid #ccc',
                        borderRadius: '0.25rem',
                        backgroundColor: '#fff',
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        zIndex: 1000,
                        boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.1)'
                      }}>
                        {filteredCourses.slice(0, 10).map((course, idx) => (
                          <li
                            key={course}
                            onClick={() => handleCourseSelect(inputKey, course)}
                            style={{
                              padding: '0.5rem 0.6rem',
                              cursor: 'pointer',
                              borderBottom: '0.05rem solid #eee',
                              fontSize: '0.85rem',
                              backgroundColor: idx === highlightedIndex[inputKey] ? '#e3f2fd' : '#fff',
                              fontWeight: idx === highlightedIndex[inputKey] ? '600' : '400'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = idx === highlightedIndex[inputKey] ? '#e3f2fd' : '#fff'}
                          >
                            {course} <span style={{ color: '#888', fontSize: '0.75rem' }}>({availableCourses[course].category})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    </div>
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