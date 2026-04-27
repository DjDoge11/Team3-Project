// Course catalog with credits and categories
// Used for course selection and credit tracking

export const availableCourses = {

  // Freshman English Course
  "English 9": { credits: 10, category: "English", gpa: "Unweighted" },
  "English 9 Honors": { credits: 10, category: "English", gpa: "Unweighted" },

  // Sophmore English Course
  "English 10": { credits: 10, category: "English", gpa: "Unweighted" },
  "English 10 Honors": { credits: 10, category: "English", gpa: "Unweighted" },

  // Junior English Course
  "English 11": { credits: 10, category: "English", gpa: "Unweighted" },
  "AP English Language": { credits: 10, category: "English", gpa: "Weighted" },

  // Senior English Course
  "English 12": { credits: 10, category: "English", gpa: "Unweighted" },
  "AP English Literature": { credits: 10, category: "English", gpa: "Weighted" },

  // Integrated Math
  "Integrated Math 1": { credits: 10, category: "Math", gpa: "Unweighted" },
  "Integrated Math 2": { credits: 10, category: "Math", gpa: "Unweighted" },
  "Integrated Math 3": { credits: 10, category: "Math", gpa: "Unweighted" },

  // Integrated Math Honors Course
  "Integrated Math 1 Honors": { credits: 10, category: "Math", gpa: "Unweighted" },
  "Integrated Math 2 Honors": { credits: 10, category: "Math", gpa: "Unweighted" },
  "Integrated Math 3 Honors": { credits: 10, category: "Math", gpa: "Weighted" },

  // Calculus Course
  "Introduction to Calculus": { credits: 10, category: "Math", gpa: "Unweighted" },
  "AP Calculus AB": { credits: 10, category: "Math", gpa: "Weighted" },
  "AP Calculus BC": { credits: 10, category: "Math", gpa: "Weighted" },

  // Other Math Electives
  "AP Statistics": { credits: 10, category: "Math", gpa: "Weighted" },
  "Advanced Topics": { credits: 10, category: "Math", gpa: "Unweighted" },

  // Required Science Course
  "Biology": { credits: 10, category: "Life Science", gpa: "Unweighted" },
  "Chemistry": { credits: 10, category: "Physical Science", gpa: "Unweighted" },
  "Chemistry Honors": { credits: 10, category: "Physical Science", gpa: "Unweighted" },

  // Physics Course
  "Physics": { credits: 10, category: "Electives", gpa: "Unweighted" },
  "AP Physics 1": { credits: 10, category: "Electives", gpa: "Weighted" },
  "AP Physics 2": { credits: 10, category: "Electives", gpa: "Weighted" },
  "AP Physics C": { credits: 10, category: "Electives", gpa: "Weighted" },

  // AP Science Course
  "AP Environmental Science": { credits: 10, category: "Science", gpa: "Weighted" },
  "AP Biology": { credits: 10, category: "Science", gpa: "Weighted" },
  "AP Chemistry": { credits: 10, category: "Science", gpa: "Weighted" },

  // Other Science Course
  "Anatomy & Physiology": { credits: 10, category: "Science", gpa: "Unweighted" },
  "Organic Chemistry": { credits: 10, category: "Science", gpa: "Unweighted" },

  // Biotechnology courses
  "Biotechnology 1": { credits: 10, category: "Science", gpa: "Unweighted" },
  "Biotechnology 2": { credits: 10, category: "Science", gpa: "Unweighted" },

  // Sophmore History Course
  "World History": { credits: 10, category: "Social Science", gpa: "Unweighted" },
  "AP World History": { credits: 10, category: "Social Science", gpa: "Weighted" },

  // Junior History Course
  "US History": { credits: 10, category: "Social Science", gpa: "Unweighted" },
  "AP US History": { credits: 10, category: "Social Science", gpa: "Weighted" },

  // Senior History Course
  "American Government": { credits: 10, category: "Social Science", gpa: "Unweighted" },
  "AP American Government": { credits: 10, category: "Social Science", gpa: "Weighted" },
  "Economics": { credits: 10, category: "Social Science", gpa: "Unweighted" },
  "AP Macroeconomics": { credits: 10, category: "Social Science", gpa: "Weighted" },

  // Spanish courses
  "Spanish 1": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Spanish 2": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Spanish 3": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Spanish 4": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Spanish 5": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "AP Spanish Language": { credits: 10, category: "World Language", gpa: "Weighted" },

  // French courses
  "French 1": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "French 2": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "French 3": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "French 4": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "French 5": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "AP French Language": { credits: 10, category: "World Language", gpa: "Weighted" },

  // Chinese courses
  "Chinese 1": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Chinese 2": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Chinese 3": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Chinese 4": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Chinese 5": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "AP Chinese": { credits: 10, category: "World Language", gpa: "Weighted" },

  // Japanese courses
  "Japanese 1": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Japanese 2": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Japanese 3": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Japanese 4": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Japanese 5": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "AP Japanese Language/Culture": { credits: 10, category: "World Language", gpa: "Weighted" },

  // American Sign Language courses
  "Am. Sign Lang. 1": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Am. Sign Lang. 2": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Am. Sign Lang. 3": { credits: 10, category: "World Language", gpa: "Unweighted" },
  "Am. Sign Lang. 4 Honors": { credits: 10, category: "World Language", gpa: "Unweighted" },

  // Perorming Arts
  "Acting 1": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Intermediate Acting": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Advance Acting": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Advance Drama Honors": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Music Theory Production": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Advanced Musical Theater Production": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Orchestra": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Symphonic Band": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Chorus": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },

  // Drawing & Design courses
  "Drawing & Design": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Advanced Drawing": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Sculpture": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Advanced Sculpture": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Painting": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Seminar in Art": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },

  //Digital Arts
  "Fine Art Digital Photography": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Digital Art & Design": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },

  //Film Making
  "Video Film": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },
  "Advanced Video Film": { credits: 10, category: "Visual/Performing Arts", gpa: "Unweighted" },

  // AP Art courses
  "AP Drawing": { credits: 10, category: "Visual/Performing Arts", gpa: "Weighted" },
  "AP 2D Art & Design": { credits: 10, category: "Visual/Performing Arts", gpa: "Weighted" },
  "AP 3D Art & Design": { credits: 10, category: "Visual/Performing Arts", gpa: "Weighted" },
  "AP Art History": { credits: 10, category: "Visual/Performing Arts", gpa: "Weighted" },

  // Freshman Fhysical Education Course
  "Year-one PE": { credits: 10, category: "Physical Education", gpa: "Unweighted" },
  "Dance": { credits: 10, category: "Physical Education", gpa: "Unweighted" },

  // Physical Education Electives
  "Physical Education": { credits: 10, category: "Physical Education", gpa: "Unweighted" },
  "Intro to Dance II (Level 2)": { credits: 10, category: "Physical Education", gpa: "Unweighted" },
  "Intermediate Dance (Level 3)": { credits: 10, category: "Physical Education", gpa: "Unweighted" },
  "Fitness Walking": { credits: 10, category: "Physical Education", gpa: "Unweighted" },
  "Sports Performance Training": { credits: 10, category: "Physical Education", gpa: "Unweighted" },
  "Weight Training": { credits: 10, category: "Physical Education", gpa: "Unweighted" },

  // English Electives
  "Speech and Debate": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Journalism": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Yearbook": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Creative Writing": { credits: 10, category: "Elective", gpa: "Unweighted" },

  // Engineering electives
  "Introduction to Engineering Techniques": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Digital Electronics": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Advance Engineering Techniques": { credits: 10, category: "Elective", gpa: "Unweighted" },

  // Computer Science electives
  "Computer Science Foundation": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Computer Game Design": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Human Computer Interaction": { credits: 10, category: "Elective", gpa: "Unweighted" },
  "Machine Learning": { credits: 10, category: "Elective", gpa: "Unweighted" },

  // AP Computer Science courses
  "AP Computer Science A": { credits: 10, category: "Elective", gpa: "Weighted" },
  "AP Computer Science Principles": { credits: 10, category: "Elective", gpa: "Weighted" },

};

// Required credits by category for graduation
export const requiredCredits = {
  "English": 40,
  "Math": 30,
  "Social Science": 30,
  "Physical Science": 10,
  "Life Science": 10,
  "Physical Education": 20,
  "Visual/Performing Arts": 10,
  "Practical Arts/CTE": 10,
  "Elective": 70
};

// Total credits required
export const totalCreditsRequired = Object.values(requiredCredits).reduce((a, b) => a + b, 0);