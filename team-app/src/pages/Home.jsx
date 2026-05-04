import "/src/App.css"

export default function Home() {
  return (
    <main>
      <div className="homepagePadding">       
      <h1>Welcome To Our Website!</h1>
      <h3>This is a website for calculating grades, made for primarily Canyon Crest Academy Students.</h3>
           
      <h4>Our features include:</h4>
      <ul className="features">
        <li>A grade point average calculator</li>
        <li>Course selection profile, including recommendations</li>
        <li>Credits for different classes, including weighted or unweighted classes</li>
        <li>An area to input your own grades, allowing faster GPA calculation, and credit information!</li>
      </ul>
    <p>To get started, use the navigation menu at the top of the page to explore our grade calculation tools and resources. For the best experience, we recommend creating an account or logging in so you can securely save your classes, assignments, and grade scenarios for future visits. This allows you to track your progress over time, experiment with “what-if” grades, and quickly return to your saved calculations from any device.</p>
    <p>Logging in is optional—our calculators remain fully functional without an account, and you are welcome to use all core features as a guest. We do not collect personally identifiable academic information, and any data you choose to save is handled securely and kept confidential.</p>
    <p>Whether you are planning your path to a target final grade, checking how an upcoming exam could impact your average, or simply staying on top of your coursework, this tool is designed to be straightforward, reliable, and easy to use.</p>
    <p>Thanks for using our website!</p>
    </div>

      <div className="card aboutUs" style={{ marginBottom: '2rem' }}>
        <h3>About Our Team</h3>
        <p>This website was created by five team members, each with respective roles.</p>
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
            <p>Shogo Muranaka, Back End Developer
</p>
            </li>
          <li>
            <strong>Parker, </strong>
            <span> Project Manager</span>
            <p>Parker Bio, I am the Project Manager
</p>
          </li>
          <li>
            <strong> Kevin, </strong>
            <span>Front-End Developer</span>
            <p>Frontend developer for team project, Sophomore, has some coding experience
</p>
          </li>
        </ul>
      </div>
    </main>
  );
}

