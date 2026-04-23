import React, { useState } from 'react';


export default function Courses() {
  const [courses, setCourses] = useState({});

  const courseInput = (grade, semester, slot, value) => {
    const key = `${grade}-${semester}-${slot}`;
    setCourses((prev) => ({ ...prev, [key]: value }));
  };

  const grades = ["9th", "10th", "11th", "12th"];
  const semesters = ["Semester 1", "Semester 2"];
  const classSlots = [1, 2, 3, 4];

  return (
    <main style={{ padding: '1rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>Course Selection and Credit Requirement</h1>

      {grades.map((grade) => (
        <section key={grade} style={{ marginBottom: '2ren', borderBottom: '`1rem` #EEE5E5' }}>
          <h2>{grade} Grade</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {semesters.map((sem) => (
              <div key={sem}>
                <h3>{sem}</h3>
                {classSlots.map((slot) => (
                  <div key={slot} style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem' }}>Class {slot}</label>
                    <input
                      type="text"
                      placeholder="Enter course name here!"
                      value={courses[`${grade}-${sem}-${slot}`] || ""}
                      onChange={(e) => courseInput(grade, sem, slot, e.target.value)}
                      style={{ padding: '1rem', width: '10rem' }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}