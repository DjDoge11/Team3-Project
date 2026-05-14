import "/src/App.css"
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero bbai-hero">
        <div>
          <span className="home-eyebrow">CCA academic planning toolkit</span>
          <h1 className="bbai-title">Plan classes, calculate grades, and see your progress clearly.</h1>
          <p className="bbai-subtitle">
            A website for GPA planning, course selection, credit tracking, and grade scenarios built with Canyon Crest Academy students in mind.
          </p>
        </div>
      </section>
      <section className="feature-grid" aria-label="Website features">
        <article className="feature-card">
          <span>01</span>
          <h3>GPA Calculator</h3>
          <p>Choose courses and grades to quickly compare weighted and unweighted GPA.</p>
        </article>
        <article className="feature-card">
          <span>02</span>
          <h3>Course Planning</h3>
          <p>Build a course profile with recommendations and easy schedule tracking.</p>
        </article>
        <article className="feature-card">
          <span>03</span>
          <h3>Credit Progress</h3>
          <p>Check class credits, graduation requirements, and weighted course details.</p>
        </article>
        <article className="feature-card">
          <span>04</span>
          <h3>Grade Scenarios</h3>
          <p>Enter assignments and what-if scores to understand your possible grade.</p>
        </article>
      </section>

      <section className="info-card">
        <h2>Get Started</h2>
        <p>
          Use the navigation menu to explore the grade calculation tools and course resources. Logging in is optional, but it lets you save classes, assignments, and grade scenarios so you can return to them later.
        </p>
        <p>
          All functions remain fully usable as a guest. Whether you are planning for a target final grade, checking how an upcoming exam could affect your average, or organizing coursework, the site is designed to stay straightforward and easy to use. All data is private, and will not be connected to you. Thanks for using our website!
        </p>
      </section>

      <section className="team-section">
        <div className="team-heading">
          <span className="home-eyebrow">About our team</span>
          <h2>This website was created by five team members, each with respective roles.</h2>
          <ul className="members">
            <li>
              <strong>Zoey, </strong>
              <span>UX Researcher</span>
              <p>My name is Zoey Zhang. I am the UX researcher for Group 3.
                My job is to send surveys, conduct interviews, and view data spreads to find pain points and general concepts before we make the projects.
                I am a sophomore at CCA, in Exploring Computer Science, Period 3. </p>
            </li>
            <li>
              <strong>Layla, </strong>
              <span>UI Researcher</span>
              <p>My name's Layla, and I'm a freshman at CCA, and I'm the UI/UX designer in Group 3 for the final project. My role is to add wireframe files and Figma links for the project.</p>
            </li>
            <li>
              <strong>Shogo, </strong>
              <span> Back-End Developer</span>
              <p>My name is Shogo. I am the back-end developer for group three. I am a sophomore at CCA.
              </p>
            </li>
            <li>
              <strong>Parker, </strong>
              <span> Project Manager</span>
              <p>I am the Project Manager. I am a sophomore at CCA. My job is to manage the Github, and distribute tasks.
              </p>
            </li>
            <li>
              <strong> Kevin, </strong>
              <span>Front-End Developer</span>
              <p>I am the front-end developer for our team project. I am a Sophomore, and I have some coding experience.
              </p>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

