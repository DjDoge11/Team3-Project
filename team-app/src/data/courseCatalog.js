// Course catalog with credits and categories
// Used for course selection and credit tracking

export const availableCourses = {

  // Freshman English Course
  "English 9": { credits: 10, category: "English", weighted: false },
  "English 9 Honors": { credits: 10, category: "English", weighted: false },

  // Sophmore English Course
  "English 10": { credits: 10, category: "English", weighted: false },
  "English 10 Honors": { credits: 10, category: "English", weighted: false },

  // Junior English Course
  "English 11": { credits: 10, category: "English", weighted: false },
  "AP English Language": { credits: 10, category: "English", weighted: true },

  // Senior English Course
  "English 12": { credits: 10, category: "English", weighted: false },
  "AP English Literature": { credits: 10, category: "English", weighted: true },

  // Integrated Math
  "Integrated Math 1": { credits: 10, category: "Math", weighted: false },
  "Integrated Math 2": { credits: 10, category: "Math", weighted: false },
  "Integrated Math 3": { credits: 10, category: "Math", weighted: false },

  // Integrated Math Honors Course
  "Integrated Math 1 Honors": { credits: 10, category: "Math", weighted: false },
  "Integrated Math 2 Honors": { credits: 10, category: "Math", weighted: false },
  "Integrated Math 3 Honors": { credits: 10, category: "Math", weighted: true },

  // Calculus Course
  "Introduction to Calculus": { credits: 10, category: "Math", weighted: false },
  "AP Calculus AB": { credits: 10, category: "Math", weighted: true },
  "AP Calculus BC": { credits: 10, category: "Math", weighted: true },

  // Other Math Electives
  "AP Statistics": { credits: 10, category: "Math", weighted: true },
  "Advanced Topics": { credits: 10, category: "Math", weighted: false },

  // Required Science Course
  "Biology": { credits: 10, category: "Life Science", weighted: false },
  "Chemistry": { credits: 10, category: "Physical Science", weighted: false },
  "Chemistry Honors": { credits: 10, category: "Physical Science", weighted: false },

  // Physics Course
  "Physics": { credits: 10, category: "Electives", weighted: false },
  "AP Physics 1": { credits: 10, category: "Electives", weighted: true },
  "AP Physics 2": { credits: 10, category: "Electives", weighted: true },
  "AP Physics C": { credits: 10, category: "Electives", weighted: true },

  // AP Science Course
  "AP Environmental Science": { credits: 10, category: "Science", weighted: true },
  "AP Biology": { credits: 10, category: "Science", weighted: true },
  "AP Chemistry": { credits: 10, category: "Science", weighted: true },

  // Other Science Course
  "Anatomy & Physiology": { credits: 10, category: "Science", weighted: false },
  "Organic Chemistry": { credits: 10, category: "Science", weighted: false },

  // Biotechnology courses
  "Biotechnology 1": { credits: 10, category: "Science", weighted: false },
  "Biotechnology 2": { credits: 10, category: "Science", weighted: false },

  // Sophmore History Course
  "World History": { credits: 10, category: "Social Science", weighted: false },
  "AP World History": { credits: 10, category: "Social Science", weighted: true },

  // Junior History Course
  "US History": { credits: 10, category: "Social Science", weighted: false },
  "AP US History": { credits: 10, category: "Social Science", weighted: true },

  // Senior History Course
  "American Government": { credits: 10, category: "Social Science", weighted: false },
  "AP American Government": { credits: 10, category: "Social Science", weighted: true },
  "Economics": { credits: 10, category: "Social Science", weighted: false },
  "AP Macroeconomics": { credits: 10, category: "Social Science", weighted: true },

  // Spanish courses
  "Spanish 1": { credits: 10, category: "World Language", weighted: false },
  "Spanish 2": { credits: 10, category: "World Language", weighted: false },
  "Spanish 3": { credits: 10, category: "World Language", weighted: false },
  "Spanish 4": { credits: 10, category: "World Language", weighted: false },
  "Spanish 5": { credits: 10, category: "World Language", weighted: false },
  "AP Spanish Language": { credits: 10, category: "World Language", weighted: true },

  // French courses
  "French 1": { credits: 10, category: "World Language", weighted: false },
  "French 2": { credits: 10, category: "World Language", weighted: false },
  "French 3": { credits: 10, category: "World Language", weighted: false },
  "French 4": { credits: 10, category: "World Language", weighted: false },
  "French 5": { credits: 10, category: "World Language", weighted: false },
  "AP French Language": { credits: 10, category: "World Language", weighted: true },

  // Chinese courses
  "Chinese 1": { credits: 10, category: "World Language", weighted: false },
  "Chinese 2": { credits: 10, category: "World Language", weighted: false },
  "Chinese 3": { credits: 10, category: "World Language", weighted: false },
  "Chinese 4": { credits: 10, category: "World Language", weighted: false },
  "Chinese 5": { credits: 10, category: "World Language", weighted: false },
  "AP Chinese": { credits: 10, category: "World Language", weighted: true },

  // Japanese courses
  "Japanese 1": { credits: 10, category: "World Language", weighted: false },
  "Japanese 2": { credits: 10, category: "World Language", weighted: false },
  "Japanese 3": { credits: 10, category: "World Language", weighted: false },
  "Japanese 4": { credits: 10, category: "World Language", weighted: false },
  "Japanese 5": { credits: 10, category: "World Language", weighted: false },
  "AP Japanese Language/Culture": { credits: 10, category: "World Language", weighted: true },

  // American Sign Language courses
  "Am. Sign Lang. 1": { credits: 10, category: "World Language", weighted: false },
  "Am. Sign Lang. 2": { credits: 10, category: "World Language", weighted: false },
  "Am. Sign Lang. 3": { credits: 10, category: "World Language", weighted: false },
  "Am. Sign Lang. 4 Honors": { credits: 10, category: "World Language", weighted: false },

  // Perorming Arts
  "Acting 1": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Intermediate Acting": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Advance Acting": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Advance Drama Honors": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Music Theory Production": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Advanced Musical Theater Production": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Orchestra": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Symphonic Band": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Chorus": { credits: 10, category: "Visual/Performing Arts", weighted: false },

  // Drawing & Design courses
  "Drawing & Design": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Advanced Drawing": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Sculpture": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Advanced Sculpture": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Painting": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Seminar in Art": { credits: 10, category: "Visual/Performing Arts", weighted: false },

  //Digital Arts
  "Fine Art Digital Photography": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Digital Art & Design": { credits: 10, category: "Visual/Performing Arts", weighted: false },

  //Film Making
  "Video Film": { credits: 10, category: "Visual/Performing Arts", weighted: false },
  "Advanced Video Film": { credits: 10, category: "Visual/Performing Arts", weighted: false },

  // AP Art courses
  "AP Drawing": { credits: 10, category: "Visual/Performing Arts", weighted: true },
  "AP 2D Art & Design": { credits: 10, category: "Visual/Performing Arts", weighted: true },
  "AP 3D Art & Design": { credits: 10, category: "Visual/Performing Arts", weighted: true },
  "AP Art History": { credits: 10, category: "Visual/Performing Arts", weighted: true },

  // Freshman Physical Education Course
  "Year-one PE": { credits: 10, category: "Physical Education", weighted: false },
  "Dance": { credits: 10, category: "Physical Education", weighted: false },

  // Physical Education Electives
  "Physical Education": { credits: 10, category: "Physical Education", weighted: false },
  "Intro to Dance II (Level 2)": { credits: 10, category: "Physical Education", weighted: false },
  "Intermediate Dance (Level 3)": { credits: 10, category: "Physical Education", weighted: false },
  "Fitness Walking": { credits: 10, category: "Physical Education", weighted: false },
  "Sports Performance Training": { credits: 10, category: "Physical Education", weighted: false },
  "Weight Training": { credits: 10, category: "Physical Education", weighted: false },

  // English Electives
  "Speech and Debate": { credits: 10, category: "Elective", weighted: false },
  "Journalism": { credits: 10, category: "Elective", weighted: false },
  "Yearbook": { credits: 10, category: "Elective", weighted: false },
  "Creative Writing": { credits: 10, category: "Elective", weighted: false },

  // Engineering electives
  "Introduction to Engineering Techniques": { credits: 10, category: "Elective", weighted: false },
  "Digital Electronics": { credits: 10, category: "Elective", weighted: false },
  "Advance Engineering Techniques": { credits: 10, category: "Elective", weighted: false },

  // Computer Science electives
  "Computer Science Foundation": { credits: 10, category: "Elective", weighted: false },
  "Computer Game Design": { credits: 10, category: "Elective", weighted: false },
  "Human Computer Interaction": { credits: 10, category: "Elective", weighted: false },
  "Machine Learning": { credits: 10, category: "Elective", weighted: false },

  // AP Computer Science courses
  "AP Computer Science A": { credits: 10, category: "Elective", weighted: true },
  "AP Computer Science Principles": { credits: 10, category: "Elective", weighted: true },

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