export interface ResumeProject {
  title: string;
  tech?: string;
  year?: string;
  bullets: string[];
}

export interface ResumeExperience {
  role: string;
  company: string;
  location?: string;
  dates: string;
  tech?: string;
  bullets: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  location?: string;
  dates: string;
  score?: string; // CGPA, GPA, percentage
}

export interface AtsTemplateProfile {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  atsScore: string;
  layoutType: "image1-academic" | "image2-backend" | "image3-boldtech" | "image4-photo";
  fontFamily: "serif" | "sans";
  hasPhoto?: boolean;
  photoUrl?: string;
  candidate: {
    fullName: string;
    title?: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    github?: string;
    portfolio?: string;
    summaryHeading: string;
    summary: string;
    skillsHeading: string;
    skills: { label: string; items: string }[];
    projects?: ResumeProject[];
    experience: ResumeExperience[];
    education: ResumeEducation[];
    certifications?: string[];
    achievements?: string[];
    languages?: string[];
  };
  plainText: string;
}

export const ATS_TEMPLATES_DATA: AtsTemplateProfile[] = [
  // ── TEMPLATE 1: Based on User Uploaded Image 1 (Academic / Data Analyst Classic LaTeX) ──
  {
    id: "financial-analyst",
    name: "Classic Academic ATS",
    tagline: "LaTeX single-column layout with horizontal section rules, tailored for Data Analytics and CS",
    badge: "LaTeX Standard",
    atsScore: "99/100",
    layoutType: "image1-academic",
    fontFamily: "serif",
    candidate: {
      fullName: "ARAVIND SWAMINATHAN",
      location: "Bengaluru, India",
      phone: "+91 98765 43210",
      email: "aravind.swaminathan@gmail.com",
      linkedin: "linkedin.com/in/aravind-swami",
      github: "github.com/aravindswami",
      summaryHeading: "Professional Summary",
      summary:
        "Detail-oriented Computer Science graduate with strong knowledge of Python, SQL, Data Analytics, and Data Visualization. Skilled in data cleaning, reporting, interactive dashboard creation, and extracting actionable insights from complex datasets. Experienced in leveraging modern analytical tools and developing data-driven solutions through academic and project work. Seeking to apply analytical problem-solving in a Data Analyst role.",
      skillsHeading: "Technical Skills",
      skills: [
        { label: "Programming Languages", items: "Python, SQL, R" },
        { label: "Data Analysis", items: "Pandas, NumPy, Data Cleaning, Data Transformation, Exploratory Analysis" },
        { label: "Visualization", items: "Power BI, Tableau, Matplotlib, Seaborn, Excel Charts" },
        { label: "Reporting Tools", items: "Advanced Excel, Pivot Tables, Power Query, DAX" },
        { label: "Databases", items: "MySQL, PostgreSQL, SQLite" },
        { label: "Core Skills", items: "Data Analytics, Dashboard Development, Statistical Modeling, Business Insights" },
        { label: "Tools", items: "Git, GitHub, VS Code, Jupyter Notebook, Power BI Desktop" },
      ],
      projects: [
        {
          title: "Recruitment Assessment Platform",
          bullets: [
            "Developed a full-featured web-based recruitment assessment platform for managing candidate evaluations.",
            "Built responsive user interfaces using HTML5, CSS3, JavaScript, and React.",
            "Designed normalized SQL database structures for candidate and assessment management.",
            "Implemented CRUD operations and automated data validation features.",
            "Applied 3-tier architecture concepts for seamless frontend, backend, and database integration.",
          ],
        },
        {
          title: "Sales & Business Analytics Dashboard",
          tech: "Python, Power BI, Excel",
          bullets: [
            "Analyzed historical retail business datasets to identify key revenue trends and performance indicators.",
            "Developed interactive executive dashboards using Power BI to monitor sales KPI metrics.",
            "Automated data cleaning and pre-processing workflows using Python and Pandas.",
            "Generated structured visual reports to support executive business decision making.",
          ],
        },
      ],
      experience: [
        {
          role: "Generative AI & Data Analytics Intern",
          company: "CogniSphere Analytics",
          dates: "May 2024 – Aug 2024",
          bullets: [
            "Worked on Generative AI concepts, LLM prompt engineering, and automated data processing pipelines.",
            "Built AI-powered analytical applications using Python and FastAPI.",
            "Explored retrieval-augmented generation (RAG) and model optimization techniques.",
            "Collaborated with cross-functional data teams on AI-driven feature development.",
          ],
        },
      ],
      education: [
        {
          degree: "B.Tech in Computer Science and Engineering",
          school: "National Institute of Technology",
          dates: "2022 – 2026",
          score: "CGPA: 8.42 / 10",
        },
        {
          degree: "Intermediate (MPC)",
          school: "State Junior College",
          dates: "2020 – 2022",
          score: "Score: 92.4%",
        },
        {
          degree: "Secondary School Certificate (SSC)",
          school: "St. Xavier's High School",
          dates: "2019 – 2020",
          score: "GPA: 9.8 / 10",
        },
      ],
      certifications: [
        "Python for Data Science & Machine Learning — IBM Professional Certification",
        "HackerRank SQL & Python Advanced Problem Solving Certification",
        "Microsoft Power BI Data Analyst Associate Certification",
      ],
      languages: ["English (Fluent)", "Hindi (Professional)", "Tamil (Native)"],
    },
    plainText: `ARAVIND SWAMINATHAN
Bengaluru, India — +91 98765 43210 — aravind.swaminathan@gmail.com
LinkedIn — GitHub

Professional Summary
Detail-oriented Computer Science graduate with strong knowledge of Python, SQL, Data Analytics, and Data Visualization. Skilled in data cleaning, reporting, interactive dashboard creation, and extracting actionable insights from complex datasets. Experienced in leveraging modern analytical tools and developing data-driven solutions through academic and project work. Seeking to apply analytical problem-solving in a Data Analyst role.

Technical Skills
Programming Languages: Python, SQL, R
Data Analysis: Pandas, NumPy, Data Cleaning, Data Transformation, Exploratory Analysis
Visualization: Power BI, Tableau, Matplotlib, Seaborn, Excel Charts
Reporting Tools: Advanced Excel, Pivot Tables, Power Query, DAX
Databases: MySQL, PostgreSQL, SQLite
Core Skills: Data Analytics, Dashboard Development, Statistical Modeling, Business Insights
Tools: Git, GitHub, VS Code, Jupyter Notebook, Power BI Desktop

Projects
Recruitment Assessment Platform
• Developed a full-featured web-based recruitment assessment platform for managing candidate evaluations.
• Built responsive user interfaces using HTML5, CSS3, JavaScript, and React.
• Designed normalized SQL database structures for candidate and assessment management.
• Implemented CRUD operations and automated data validation features.
• Applied 3-tier architecture concepts for seamless frontend, backend, and database integration.

Sales & Business Analytics Dashboard — Python, Power BI, Excel
• Analyzed historical retail business datasets to identify key revenue trends and performance indicators.
• Developed interactive executive dashboards using Power BI to monitor sales KPI metrics.
• Automated data cleaning and pre-processing workflows using Python and Pandas.
• Generated structured visual reports to support executive business decision making.

Internship
Generative AI & Data Analytics Intern — CogniSphere Analytics
• Worked on Generative AI concepts, LLM prompt engineering, and automated data processing pipelines.
• Built AI-powered analytical applications using Python and FastAPI.
• Explored retrieval-augmented generation (RAG) and model optimization techniques.
• Collaborated with cross-functional data teams on AI-driven feature development.

Education
B.Tech in Computer Science and Engineering | National Institute of Technology | 2022 – 2026 | CGPA: 8.42 / 10
Intermediate (MPC) | State Junior College | 2020 – 2022 | Score: 92.4%
Secondary School Certificate (SSC) | St. Xavier's High School | 2019 – 2020 | GPA: 9.8 / 10

Certifications
• Python for Data Science & Machine Learning — IBM Professional Certification
• HackerRank SQL & Python Advanced Problem Solving Certification
• Microsoft Power BI Data Analyst Associate Certification

Languages
English (Fluent), Hindi (Professional), Tamil (Native)`,
  },

  // ── TEMPLATE 2: Based on User Uploaded Image 2 (Modern Java Backend Developer ATS) ──
  {
    id: "kickresume-black",
    name: "Modern Backend Developer ATS",
    tagline: "Spacious title serif format with contact badges, ideal for Software & Backend Engineering",
    badge: "Backend & Systems",
    atsScore: "98/100",
    layoutType: "image2-backend",
    fontFamily: "serif",
    candidate: {
      fullName: "ROHAN VERMA",
      title: "Java Backend Developer",
      location: "Pune, India",
      phone: "+91-9876543211",
      email: "rohan.verma@example.com",
      linkedin: "linkedin.com/in/rohanverma-dev",
      github: "github.com/rohanverma",
      portfolio: "rohanverma.dev",
      summaryHeading: "Summary",
      summary:
        "Java Backend Developer with 2+ years of professional experience designing and developing enterprise backend solutions. Experienced in building scalable applications, improving system performance, and delivering reliable software through clean architecture, efficient problem-solving, and continuous learning.",
      skillsHeading: "Skills",
      skills: [
        { label: "Programming Languages", items: "Java (8/11/17), SQL, JavaScript, Go" },
        { label: "Frameworks", items: "Spring Boot, Spring MVC, Hibernate, JPA, Spring Security, Servlets, JSP" },
        { label: "Databases", items: "MySQL, PostgreSQL, DynamoDB, Elasticsearch, Redis" },
        { label: "Developer Tools", items: "Git, GitHub, Maven, Gradle, Postman, Swagger, IntelliJ IDEA, NetBeans, Tomcat" },
        { label: "Core Concepts", items: "REST APIs, Microservices, JDBC, OOP, Collections, Multithreading, JWT Authentication" },
      ],
      experience: [
        {
          role: "Software Engineer — Backend",
          company: "Nexus Enterprise Technologies",
          dates: "Sep 2023 – Present",
          tech: "Java, Spring Boot, MySQL",
          bullets: [
            "Engineered scalable RESTful APIs for enterprise applications, reducing average API response time by nearly 30% through query optimization and efficient service-layer design.",
            "Designed reusable backend components following SOLID principles and layered architecture, improving code maintainability and reducing development effort for new features.",
            "Optimized database interactions using indexing, query tuning, and batch processing techniques, resulting in faster data retrieval for high-volume requests.",
            "Configured CI/CD pipeline automated unit tests with JUnit and Mockito, ensuring 92% code branch coverage before production releases.",
          ],
        },
      ],
      projects: [
        {
          title: "Distributed Task Scheduling Engine",
          tech: "Java, Spring Boot, Redis, MySQL",
          year: "2024",
          bullets: [
            "Designed and developed a distributed scheduler capable of executing thousands of scheduled jobs with retry mechanisms and fault-tolerant execution.",
            "Improved task execution throughput by approximately 40% using asynchronous processing and concurrent worker threads.",
            "Implemented distributed locking with Redis Redlock and job prioritization to prevent duplicate execution across multiple application instances.",
            "Built real-time monitoring dashboards for job execution status, failures, and execution latency.",
          ],
        },
        {
          title: "API Rate Limiter & Authentication Gateway",
          tech: "Java, Spring Boot, Redis",
          year: "2024",
          bullets: [
            "Developed a centralized API gateway supporting JWT authentication, request validation, and role-based authorization.",
            "Implemented token bucket rate-limiting algorithms using Redis to efficiently manage high request volumes and prevent DDoS overload.",
            "Reduced unauthorized requests by enforcing secure authentication and centralized access policies.",
            "Designed reusable middleware components to simplify API security across multiple backend services.",
          ],
        },
      ],
      certifications: [
        "Oracle Certified Professional: Java SE Developer — Oracle (2024): Validated expertise in Java programming and object-oriented application development.",
        "Postman API Fundamentals Student Expert — Postman (2024): Certified in API testing, documentation, and collaborative API development.",
        "AWS Certified Developer – Associate — Amazon Web Services (2024)",
      ],
      education: [
        {
          degree: "Bachelor of Technology (B.Tech) in Computer Science",
          school: "Savitribai Phule Pune University",
          dates: "Graduated: 2023",
          score: "First Class with Distinction",
        },
      ],
    },
    plainText: `ROHAN VERMA
Java Backend Developer
+91-9876543211 | rohan.verma@example.com | linkedin.com/in/rohanverma-dev | github.com/rohanverma | rohanverma.dev

Summary
Java Backend Developer with 2+ years of professional experience designing and developing enterprise backend solutions. Experienced in building scalable applications, improving system performance, and delivering reliable software through clean architecture, efficient problem-solving, and continuous learning.

Skills
Programming Languages: Java (8/11/17), SQL, JavaScript, Go
Frameworks: Spring Boot, Spring MVC, Hibernate, JPA, Spring Security, Servlets, JSP
Databases: MySQL, PostgreSQL, DynamoDB, Elasticsearch, Redis
Developer Tools: Git, GitHub, Maven, Gradle, Postman, Swagger, IntelliJ IDEA, NetBeans, Tomcat
Core Concepts: REST APIs, Microservices, JDBC, OOP, Collections, Multithreading, JWT Authentication

Experience
Software Engineer — Backend | Nexus Enterprise Technologies | Sep 2023 – Present
Java, Spring Boot, MySQL
• Engineered scalable RESTful APIs for enterprise applications, reducing average API response time by nearly 30% through query optimization and efficient service-layer design.
• Designed reusable backend components following SOLID principles and layered architecture, improving code maintainability and reducing development effort for new features.
• Optimized database interactions using indexing, query tuning, and batch processing techniques, resulting in faster data retrieval for high-volume requests.
• Configured CI/CD pipeline automated unit tests with JUnit and Mockito, ensuring 92% code branch coverage before production releases.

Projects
Distributed Task Scheduling Engine — Java, Spring Boot, Redis, MySQL | 2024
• Designed and developed a distributed scheduler capable of executing thousands of scheduled jobs with retry mechanisms and fault-tolerant execution.
• Improved task execution throughput by approximately 40% using asynchronous processing and concurrent worker threads.
• Implemented distributed locking with Redis Redlock and job prioritization to prevent duplicate execution across multiple application instances.
• Built real-time monitoring dashboards for job execution status, failures, and execution latency.

API Rate Limiter & Authentication Gateway — Java, Spring Boot, Redis | 2024
• Developed a centralized API gateway supporting JWT authentication, request validation, and role-based authorization.
• Implemented token bucket rate-limiting algorithms using Redis to efficiently manage high request volumes and prevent DDoS overload.
• Reduced unauthorized requests by enforcing secure authentication and centralized access policies.
• Designed reusable middleware components to simplify API security across multiple backend services.

Awards & Certifications
• Oracle Certified Professional: Java SE Developer — Oracle (2024)
• Postman API Fundamentals Student Expert — Postman (2024)
• AWS Certified Developer – Associate — Amazon Web Services (2024)

Education
Bachelor of Technology (B.Tech) in Computer Science | Savitribai Phule Pune University | Graduated: 2023`,
  },

  // ── TEMPLATE 3: Based on User Uploaded Image 3 (High-Contrast Tech ATS with Achievements) ──
  {
    id: "classic-ats",
    name: "High-Contrast Tech ATS",
    tagline: "Bold single-column format with dark divider rules, achievements section, and high ATS pass rate",
    badge: "High Impact Tech",
    atsScore: "98/100",
    layoutType: "image3-boldtech",
    fontFamily: "serif",
    candidate: {
      fullName: "ANANYA IYER",
      location: "Hyderabad, India",
      phone: "+91 91234 56789",
      email: "ananya.iyer@techmail.com",
      linkedin: "linkedin.com/in/ananya-iyer-dev",
      github: "github.com/ananyaiyer",
      summaryHeading: "Career Objective",
      summary:
        "Motivated Computer Science graduate seeking Software Engineering and Technology Apprenticeship opportunities. Strong foundation in Python, Data Structures, Algorithms, OOP, Full Stack Development, and Cloud-based applications. Passionate about building scalable software solutions and solving real-world problems.",
      skillsHeading: "Technical Skills",
      skills: [
        { label: "Languages", items: "Python, C++, Java, JavaScript" },
        { label: "Frontend", items: "React.js, Next.js, HTML5, CSS3, Tailwind CSS, Bootstrap" },
        { label: "Backend", items: "Django, Django REST Framework, Node.js, Express.js, FastAPI" },
        { label: "Databases", items: "MySQL, MongoDB, PostgreSQL, SQLite" },
        { label: "Core CS", items: "DSA, OOP, DBMS, Operating Systems, Computer Networks" },
        { label: "Tools & Cloud", items: "Git, GitHub, VS Code, Postman, AWS (EC2, S3), Docker, Render" },
      ],
      projects: [
        {
          title: "Cloud Threat Detection System using Hybrid Deep Learning",
          tech: "Python, Django, TensorFlow",
          bullets: [
            "Developed a cloud-based threat detection platform with multi-role authentication and real-time attack classification.",
            "Built responsive admin dashboards using React and Tailwind CSS for real-time security telemetry.",
            "Integrated feature extraction, data pre-processing, and CNN-LSTM model training pipelines achieving 96.4% precision.",
            "Designed secure REST APIs for security evaluation and automated anomaly alert dispatch.",
          ],
        },
        {
          title: "MiniMedi — AI Medical Symptom Checker",
          tech: "Django, React, REST API",
          bullets: [
            "Developed a full-stack digital health application for guided symptom tracking and AI-assisted preliminary triage.",
            "Implemented secure token-based user authentication, REST APIs, and encrypted symptom history storage.",
            "Optimized search query latency across 5,000+ medical terms by 42% through PostgreSQL full-text indexing.",
          ],
        },
      ],
      experience: [
        {
          role: "Full Stack Web Development Intern",
          company: "TalentNova Labs",
          dates: "Jun 2024 – Nov 2024",
          bullets: [
            "Worked on frontend and backend production web development for enterprise client portals.",
            "Built responsive, accessible interfaces and integrated high-throughput REST APIs.",
            "Participated in automated debugging, unit testing with PyTest, and cloud deployment on AWS.",
          ],
        },
      ],
      education: [
        {
          degree: "B.Tech in Computer Science and Engineering",
          school: "Jawaharlal Nehru Technological University",
          dates: "2022 – 2026",
          score: "CGPA: 8.76 / 10",
        },
        {
          degree: "Intermediate (PCM)",
          school: "Narayana Junior College",
          dates: "2020 – 2022",
          score: "Percentage: 91.5%",
        },
        {
          degree: "Secondary School Certificate (SSC)",
          school: "Delhi Public School",
          dates: "2019 – 2020",
          score: "GPA: 9.6 / 10",
        },
      ],
      certifications: [
        "Infosys Springboard Python & Data Structures Foundations Certification",
        "CodeTantra Advanced Python Programming & DSA Certification",
        "HackerRank Problem Solving (Intermediate) Certificate",
      ],
      achievements: [
        "First Prize Winner in National Level Smart India AI Hackathon (500+ competing teams)",
        "Solved 250+ Data Structures & Algorithms problems on LeetCode with 90th percentile ranking",
        "Top 5 Finalist in State Level Inter-University Coding Olympiad",
      ],
      languages: ["English (Fluent)", "Hindi (Professional)", "Telugu (Working Knowledge)"],
    },
    plainText: `ANANYA IYER
Hyderabad, India — +91 91234 56789 — ananya.iyer@techmail.com
LinkedIn — GitHub

Career Objective
Motivated Computer Science graduate seeking Software Engineering and Technology Apprenticeship opportunities. Strong foundation in Python, Data Structures, Algorithms, OOP, Full Stack Development, and Cloud-based applications. Passionate about building scalable software solutions and solving real-world problems.

Technical Skills
Languages: Python, C++, Java, JavaScript
Frontend: React.js, Next.js, HTML5, CSS3, Tailwind CSS, Bootstrap
Backend: Django, Django REST Framework, Node.js, Express.js, FastAPI
Databases: MySQL, MongoDB, PostgreSQL, SQLite
Core CS: DSA, OOP, DBMS, Operating Systems, Computer Networks
Tools & Cloud: Git, GitHub, VS Code, Postman, AWS (EC2, S3), Docker, Render

Projects
Cloud Threat Detection System using Hybrid Deep Learning — Python, Django, TensorFlow
• Developed a cloud-based threat detection platform with multi-role authentication and real-time attack classification.
• Built responsive admin dashboards using React and Tailwind CSS for real-time security telemetry.
• Integrated feature extraction, data pre-processing, and CNN-LSTM model training pipelines achieving 96.4% precision.
• Designed secure REST APIs for security evaluation and automated anomaly alert dispatch.

MiniMedi — AI Medical Symptom Checker — Django, React, REST API
• Developed a full-stack digital health application for guided symptom tracking and AI-assisted preliminary triage.
• Implemented secure token-based user authentication, REST APIs, and encrypted symptom history storage.
• Optimized search query latency across 5,000+ medical terms by 42% through PostgreSQL full-text indexing.

Internship
Full Stack Web Development Intern — TalentNova Labs
• Worked on frontend and backend production web development for enterprise client portals.
• Built responsive, accessible interfaces and integrated high-throughput REST APIs.
• Participated in automated debugging, unit testing with PyTest, and cloud deployment on AWS.

Education
B.Tech in Computer Science and Engineering | Jawaharlal Nehru Technological University | 2022 – 2026 | CGPA: 8.76 / 10
Intermediate (PCM) | Narayana Junior College | 2020 – 2022 | Percentage: 91.5%
Secondary School Certificate (SSC) | Delhi Public School | 2019 – 2020 | GPA: 9.6 / 10

Certifications
• Infosys Springboard Python & Data Structures Foundations Certification
• CodeTantra Advanced Python Programming & DSA Certification
• HackerRank Problem Solving (Intermediate) Certificate

Achievements
• First Prize Winner in National Level Smart India AI Hackathon (500+ competing teams)
• Solved 250+ Data Structures & Algorithms problems on LeetCode with 90th percentile ranking
• Top 5 Finalist in State Level Inter-University Coding Olympiad

Languages
English (Fluent), Hindi (Professional), Telugu (Working Knowledge)`,
  },

  // ── TEMPLATE 4: User Specified: "and 4th template using photo like earlier" ──
  {
    id: "resumedone-clean",
    name: "Modern Executive with Photo",
    tagline: "Executive format featuring a professional headshot avatar, ideal for international and corporate roles",
    badge: "Photo Header ATS",
    atsScore: "97/100",
    layoutType: "image4-photo",
    fontFamily: "sans",
    hasPhoto: true,
    photoUrl: "/avatars/user-1.jpg",
    candidate: {
      fullName: "PRIYA NAIR",
      title: "Senior Product & Operations Lead",
      location: "Mumbai, India",
      phone: "+91 98200 12345",
      email: "priya.nair@corporate.in",
      linkedin: "linkedin.com/in/priyanair-ops",
      portfolio: "priyanair.me",
      summaryHeading: "Executive Profile",
      summary:
        "Energetic, metric-focused Senior Product & Operations Manager with 5+ years driving B2B SaaS growth, cross-functional team coordination, and user lifecycle optimization. Proven ability to translate complex business requirements into high-converting operational workflows, increasing pipeline revenue by 34% and cutting customer onboarding churn.",
      skillsHeading: "Core Competencies",
      skills: [
        { label: "Product & Strategy", items: "Product Roadmap, Go-To-Market (GTM), User Personas, Agile/Scrum, OKR Management" },
        { label: "Operations & Growth", items: "Process Automation, Funnel Optimization, Stakeholder Management, Vendor SLA Governance" },
        { label: "Analytics & Tools", items: "Jira, Confluence, SQL, Amplitude, Mixpanel, Tableau, Salesforce CRM, HubSpot, Figma" },
      ],
      experience: [
        {
          role: "Senior Operations & Product Lead",
          company: "Stratos Global Solutions",
          location: "Mumbai, India",
          dates: "2022 – Present",
          bullets: [
            "Spearheaded enterprise product rollout across 4 international regions, driving 120,000 net new activated accounts in year one.",
            "Partnered with engineering and design squads to streamline digital onboarding, reducing drop-off rates by 28%.",
            "Authored operational standard operating procedures (SOPs) and KPI scorecards adopted by 85+ operations associates.",
            "Conducted quantitative user feedback analysis across 1,200+ enterprise customers, prioritizing 14 high-impact roadmap features.",
          ],
        },
        {
          role: "Operations Program Associate",
          company: "Zenith Business Systems",
          location: "Bengaluru, India",
          dates: "2020 – 2022",
          bullets: [
            "Coordinated logistics and vendor procurement across 6 distribution hubs, capturing $3.4M in annual cost efficiencies.",
            "Automated weekly executive reporting dashboards using Tableau and SQL, cutting reporting turnaround from 3 days to 4 hours.",
            "Managed cross-functional communications during company-wide CRM migration with zero business interruption.",
          ],
        },
      ],
      education: [
        {
          degree: "Master of Business Administration (MBA) in Operations & Strategy",
          school: "SP Jain Institute of Management and Research (SPJIMR)",
          dates: "2018 – 2020",
          score: "Dean's Merit List",
        },
        {
          degree: "Bachelor of Commerce (Honors)",
          school: "St. Xavier's College, Mumbai",
          dates: "2015 – 2018",
          score: "First Class with Distinction",
        },
      ],
      certifications: [
        "Certified Scrum Product Owner (CSPO)® — Scrum Alliance",
        "Project Management Professional (PMP)® — Project Management Institute",
        "Lean Six Sigma Green Belt Certification — ASQ",
      ],
      languages: ["English (Bilingual)", "Hindi (Native)", "Marathi (Fluent)"],
    },
    plainText: `PRIYA NAIR
Senior Product & Operations Lead
Mumbai, India • +91 98200 12345 • priya.nair@corporate.in • linkedin.com/in/priyanair-ops • priyanair.me

Executive Profile
Energetic, metric-focused Senior Product & Operations Manager with 5+ years driving B2B SaaS growth, cross-functional team coordination, and user lifecycle optimization. Proven ability to translate complex business requirements into high-converting operational workflows, increasing pipeline revenue by 34% and cutting customer onboarding churn.

Core Competencies
Product & Strategy: Product Roadmap, Go-To-Market (GTM), User Personas, Agile/Scrum, OKR Management
Operations & Growth: Process Automation, Funnel Optimization, Stakeholder Management, Vendor SLA Governance
Analytics & Tools: Jira, Confluence, SQL, Amplitude, Mixpanel, Tableau, Salesforce CRM, HubSpot, Figma

Professional Experience
Senior Operations & Product Lead | Stratos Global Solutions | 2022 – Present
• Spearheaded enterprise product rollout across 4 international regions, driving 120,000 net new activated accounts in year one.
• Partnered with engineering and design squads to streamline digital onboarding, reducing drop-off rates by 28%.
• Authored operational standard operating procedures (SOPs) and KPI scorecards adopted by 85+ operations associates.
• Conducted quantitative user feedback analysis across 1,200+ enterprise customers, prioritizing 14 high-impact roadmap features.

Operations Program Associate | Zenith Business Systems | 2020 – 2022
• Coordinated logistics and vendor procurement across 6 distribution hubs, capturing $3.4M in annual cost efficiencies.
• Automated weekly executive reporting dashboards using Tableau and SQL, cutting reporting turnaround from 3 days to 4 hours.
• Managed cross-functional communications during company-wide CRM migration with zero business interruption.

Education
Master of Business Administration (MBA) in Operations & Strategy | SPJIMR | 2018 – 2020 | Dean's Merit List
Bachelor of Commerce (Honors) | St. Xavier's College, Mumbai | 2015 – 2018 | First Class with Distinction

Certifications
• Certified Scrum Product Owner (CSPO)® — Scrum Alliance
• Project Management Professional (PMP)® — Project Management Institute
• Lean Six Sigma Green Belt Certification — ASQ

Languages
English (Bilingual), Hindi (Native), Marathi (Fluent)`,
  },
];

export function getTemplateById(id: string): AtsTemplateProfile {
  const found = ATS_TEMPLATES_DATA.find((t) => t.id === id);
  return found || ATS_TEMPLATES_DATA[0];
}
