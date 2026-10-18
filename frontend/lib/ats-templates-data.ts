export interface ResumeExperience {
  role: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  location: string;
  dates: string;
  honors?: string;
}

export interface AtsTemplateProfile {
  id: string;
  name: string;
  tagline: string;
  category: string;
  badge: string;
  atsScore: string;
  styleVariant: "finance" | "tech" | "executive" | "minimal";
  fontFamily: "serif" | "sans";
  candidate: {
    fullName: string;
    title: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    website?: string;
    summary: string;
    skills: { label: string; items: string }[];
    experience: ResumeExperience[];
    education: ResumeEducation[];
    certifications: string[];
  };
  plainText: string;
}

export const ATS_TEMPLATES_DATA: AtsTemplateProfile[] = [
  {
    id: "financial-analyst",
    name: "Financial Data Analyst",
    tagline: "Executive quantitative single-column ATS layout engineered for finance and data analytics",
    category: "Finance & Banking",
    badge: "Quant & Analytics",
    atsScore: "99/100",
    styleVariant: "finance",
    fontFamily: "serif",
    candidate: {
      fullName: "ALEXANDER VANCE, CFA",
      title: "Senior Financial & Quantitative Analyst",
      location: "New York, NY",
      phone: "+1 (212) 555-0192",
      email: "alex.vance@financialadvisory.com",
      linkedin: "linkedin.com/in/alexandervance-cfa",
      website: "alexvance-finance.io",
      summary:
        "Results-driven Senior Financial Analyst with 6+ years of quantitative modeling, portfolio risk analysis, and corporate valuation experience. Proven track record leading $420M+ transaction models, optimizing forecasting pipelines with Python and SQL, and presenting variance analyses to executive leadership.",
      skills: [
        {
          label: "Financial Modeling",
          items: "DCF, LBO, 3-Statement Modeling, M&A Valuation, Monte Carlo Risk Simulations, CAPEX Forecasting",
        },
        {
          label: "Technical & Data Tools",
          items: "Python (NumPy, Pandas), SQL (PostgreSQL), Advanced Excel (VBA, PowerQuery), Bloomberg Terminal, FactSet, Capital IQ",
        },
        {
          label: "Corporate Finance & Reporting",
          items: "US GAAP, IFRS, Variance Analysis, Budget Allocation, Working Capital Management, SEC 10-K/10-Q Filings",
        },
      ],
      experience: [
        {
          role: "Senior Financial Analyst — Investment Management",
          company: "Morgan & Stanley Capital",
          location: "New York, NY",
          dates: "2021 – Present",
          bullets: [
            "Spearheaded financial modeling and valuation sensitivity matrices for $420M in corporate M&A transactions, presenting directly to investment committees.",
            "Built an automated asset allocation and variance tracking pipeline in Python and SQL, reducing monthly reporting cycle from 14 business days to 3.5 days.",
            "Partnered with portfolio managers to evaluate 48 mid-cap equity assets, delivering a 14.8% annualized net alpha return across 3 consecutive fiscal years.",
            "Automated recurring CAPEX forecasting models across 12 business units, improving cash flow projection accuracy by 22%.",
          ],
        },
        {
          role: "Financial Valuation Analyst — Corporate Finance",
          company: "Deloitte Advisory LLP",
          location: "Boston, MA",
          dates: "2018 – 2021",
          bullets: [
            "Conducted purchase price allocations and goodwill impairment analyses for 24 Fortune 1000 engagements valued between $50M and $300M.",
            "Engineered automated DCF models incorporating multi-variable risk simulations, identifying $3.2M in annual tax-shield savings.",
            "Led due diligence reviews analyzing revenue recognition under ASC 606, drafting 100% compliant technical accounting memorandums.",
            "Trained and mentored an incoming cohort of 6 junior valuation analysts on financial modeling best practices and Bloomberg terminal workflows.",
          ],
        },
      ],
      education: [
        {
          degree: "Bachelor of Science in Finance & Statistics",
          school: "New York University, Stern School of Business",
          location: "New York, NY",
          dates: "2014 – 2018",
          honors: "Summa Cum Laude, GPA: 3.92/4.0",
        },
      ],
      certifications: [
        "Chartered Financial Analyst (CFA) Charterholder — CFA Institute",
        "Financial Modeling & Valuation Analyst (FMVA)® — Corporate Finance Institute",
      ],
    },
    plainText: `ALEXANDER VANCE, CFA
Senior Financial & Quantitative Analyst
New York, NY | +1 (212) 555-0192 | alex.vance@financialadvisory.com | linkedin.com/in/alexandervance-cfa

PROFESSIONAL SUMMARY
Results-driven Senior Financial Analyst with 6+ years of quantitative modeling, portfolio risk analysis, and corporate valuation experience. Proven track record leading $420M+ transaction models, optimizing forecasting pipelines with Python and SQL, and presenting variance analyses to executive leadership.

CORE COMPETENCIES
Financial Modeling: DCF, LBO, 3-Statement Modeling, M&A Valuation, Monte Carlo Risk Simulations, CAPEX Forecasting
Technical & Data Tools: Python (NumPy, Pandas), SQL (PostgreSQL), Advanced Excel (VBA, PowerQuery), Bloomberg Terminal, FactSet, Capital IQ
Corporate Finance & Reporting: US GAAP, IFRS, Variance Analysis, Budget Allocation, Working Capital Management, SEC 10-K/10-Q Filings

PROFESSIONAL EXPERIENCE
Senior Financial Analyst — Investment Management | Morgan & Stanley Capital | 2021 – Present
• Spearheaded financial modeling and valuation sensitivity matrices for $420M in corporate M&A transactions, presenting directly to investment committees.
• Built an automated asset allocation and variance tracking pipeline in Python and SQL, reducing monthly reporting cycle from 14 business days to 3.5 days.
• Partnered with portfolio managers to evaluate 48 mid-cap equity assets, delivering a 14.8% annualized net alpha return across 3 consecutive fiscal years.
• Automated recurring CAPEX forecasting models across 12 business units, improving cash flow projection accuracy by 22%.

Financial Valuation Analyst — Corporate Finance | Deloitte Advisory LLP | 2018 – 2021
• Conducted purchase price allocations and goodwill impairment analyses for 24 Fortune 1000 engagements valued between $50M and $300M.
• Engineered automated DCF models incorporating multi-variable risk simulations, identifying $3.2M in annual tax-shield savings.
• Led due diligence reviews analyzing revenue recognition under ASC 606, drafting 100% compliant technical accounting memorandums.
• Trained and mentored an incoming cohort of 6 junior valuation analysts on financial modeling best practices and Bloomberg terminal workflows.

EDUCATION
Bachelor of Science in Finance & Statistics | New York University, Stern School of Business | 2014 – 2018
Summa Cum Laude, GPA: 3.92/4.0

CERTIFICATIONS
• Chartered Financial Analyst (CFA) Charterholder — CFA Institute
• Financial Modeling & Valuation Analyst (FMVA)® — Corporate Finance Institute`,
  },

  {
    id: "kickresume-black",
    name: "Modern Black ATS",
    tagline: "High-contrast clean tech format engineered for ATS parsers and engineering hiring teams",
    category: "Software & Technology",
    badge: "Tech & Engineering",
    atsScore: "98/100",
    styleVariant: "tech",
    fontFamily: "sans",
    candidate: {
      fullName: "MARCUS CHEN",
      title: "Lead Full Stack Software Architect",
      location: "Seattle, WA",
      phone: "+1 (206) 555-0144",
      email: "marcus.chen@devcloud.io",
      linkedin: "linkedin.com/in/marcuschen-dev",
      website: "github.com/marcuschen",
      summary:
        "High-performance Lead Full Stack Engineer and Systems Architect with 7+ years of experience scaling distributed cloud microservices and event-driven APIs. Expert in TypeScript, React, Next.js, Go, and PostgreSQL. Track record architecting high-throughput platforms supporting 120M+ daily events with 99.99% service availability.",
      skills: [
        {
          label: "Languages & Frameworks",
          items: "TypeScript, JavaScript (ES6+), React 19, Next.js, Node.js, Go (Golang), Python, Tailwind CSS, GraphQL",
        },
        {
          label: "Cloud & Infrastructure",
          items: "AWS (ECS, Lambda, S3, RDS, CloudFront), Docker, Kubernetes, Terraform, GitHub Actions, CI/CD Pipelines",
        },
        {
          label: "Databases & Architecture",
          items: "PostgreSQL, Redis, Apache Kafka, Distributed Systems, Microservices, RESTful APIs, Event-Driven Architecture",
        },
      ],
      experience: [
        {
          role: "Principal Full Stack Architect",
          company: "CloudScale Systems",
          location: "Seattle, WA",
          dates: "2022 – Present",
          bullets: [
            "Architected and deployed an event-driven payment ledger processing 120M+ daily API transactions with zero transaction dropped under peak load.",
            "Migrated legacy monolithic backend into Go and Node.js microservices running on Kubernetes, lowering AWS infrastructure spend by $38,000/month.",
            "Redesigned frontend client architecture with Next.js and Tailwind, achieving a 99/100 Google Lighthouse score and reducing bundle load time by 64%.",
            "Instituted automated CI/CD deployment gates with Jest and Cypress, elevating unit and integration test coverage from 48% to 94%.",
          ],
        },
        {
          role: "Senior Software Engineer — Platform Infrastructure",
          company: "Stripe Inc.",
          location: "San Francisco, CA",
          dates: "2019 – 2022",
          bullets: [
            "Engineered scalable multi-currency checkout API endpoints supporting 42 payment providers across Europe and APAC regions.",
            "Designed asynchronous batch-processing pipelines using Kafka and Redis, slashing p99 database query response latency from 450ms to 58ms.",
            "Mentored 8 junior and mid-level software engineers on asynchronous TypeScript patterns, distributed concurrency, and clean API design principles.",
            "Authored core internal developer documentation and API SDKs adopted across 14 product squads company-wide.",
          ],
        },
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science",
          school: "University of Washington",
          location: "Seattle, WA",
          dates: "2015 – 2019",
          honors: "Dean's Honor List, Cum Laude",
        },
      ],
      certifications: [
        "AWS Certified Solutions Architect – Professional (SAP-C02)",
        "Certified Kubernetes Application Developer (CKAD) — Linux Foundation",
      ],
    },
    plainText: `MARCUS CHEN
Lead Full Stack Software Architect
Seattle, WA | +1 (206) 555-0144 | marcus.chen@devcloud.io | github.com/marcuschen | linkedin.com/in/marcuschen-dev

PROFESSIONAL SUMMARY
High-performance Lead Full Stack Engineer and Systems Architect with 7+ years of experience scaling distributed cloud microservices and event-driven APIs. Expert in TypeScript, React, Next.js, Go, and PostgreSQL. Track record architecting high-throughput platforms supporting 120M+ daily events with 99.99% service availability.

TECHNICAL SKILLS
Languages & Frameworks: TypeScript, JavaScript (ES6+), React 19, Next.js, Node.js, Go (Golang), Python, Tailwind CSS, GraphQL
Cloud & Infrastructure: AWS (ECS, Lambda, S3, RDS, CloudFront), Docker, Kubernetes, Terraform, GitHub Actions, CI/CD Pipelines
Databases & Architecture: PostgreSQL, Redis, Apache Kafka, Distributed Systems, Microservices, RESTful APIs, Event-Driven Architecture

WORK EXPERIENCE
Principal Full Stack Architect | CloudScale Systems | 2022 – Present
• Architected and deployed an event-driven payment ledger processing 120M+ daily API transactions with zero transaction dropped under peak load.
• Migrated legacy monolithic backend into Go and Node.js microservices running on Kubernetes, lowering AWS infrastructure spend by $38,000/month.
• Redesigned frontend client architecture with Next.js and Tailwind, achieving a 99/100 Google Lighthouse score and reducing bundle load time by 64%.
• Instituted automated CI/CD deployment gates with Jest and Cypress, elevating unit and integration test coverage from 48% to 94%.

Senior Software Engineer — Platform Infrastructure | Stripe Inc. | 2019 – 2022
• Engineered scalable multi-currency checkout API endpoints supporting 42 payment providers across Europe and APAC regions.
• Designed asynchronous batch-processing pipelines using Kafka and Redis, slashing p99 database query response latency from 450ms to 58ms.
• Mentored 8 junior and mid-level software engineers on asynchronous TypeScript patterns, distributed concurrency, and clean API design principles.
• Authored core internal developer documentation and API SDKs adopted across 14 product squads company-wide.

EDUCATION
Bachelor of Science in Computer Science | University of Washington | 2015 – 2019
Dean's Honor List, Cum Laude

CERTIFICATIONS
• AWS Certified Solutions Architect – Professional (SAP-C02)
• Certified Kubernetes Application Developer (CKAD) — Linux Foundation`,
  },

  {
    id: "classic-ats",
    name: "Classic Corporate ATS",
    tagline: "Traditional single-column format preferred by Fortune 500 executive search recruiters",
    category: "Management & Operations",
    badge: "Executive Leadership",
    atsScore: "98/100",
    styleVariant: "executive",
    fontFamily: "serif",
    candidate: {
      fullName: "ELEANOR ROOSEVELT BLAKE",
      title: "Senior Director of Global Operations & Strategy",
      location: "Chicago, IL",
      phone: "+1 (312) 555-0188",
      email: "e.blake@corporateleadership.com",
      linkedin: "linkedin.com/in/eleanorblake-operations",
      summary:
        "Strategic, results-driven Director of Operations with 10+ years of leadership optimizing enterprise supply chains, global vendor management, and multi-million dollar P&L administration. Spearheaded operational transformations delivering $18M in cumulative cost reductions while maintaining 99.4% on-time delivery benchmarks across North American distribution networks.",
      skills: [
        {
          label: "Executive Leadership",
          items: "Global Supply Chain Strategy, Enterprise P&L Management ($65M+), Multi-Site Operations, Organizational Change Management",
        },
        {
          label: "Operational Excellence",
          items: "Lean Six Sigma Master Black Belt, Continuous Process Improvement, Root Cause Analysis, Kaizen, Vendor Procurement & SLA Governance",
        },
        {
          label: "Enterprise Systems",
          items: "SAP S/4HANA, Oracle ERP Cloud, Tableau, Power BI, Advanced Workflow Automation, Regulatory Compliance (OSHA, ISO 9001)",
        },
      ],
      experience: [
        {
          role: "Senior Director of Global Operations",
          company: "Honeywell International",
          location: "Chicago, IL",
          dates: "2020 – Present",
          bullets: [
            "Direct operational strategy and budget allocation ($65M annual P&L) across 6 North American supply chain and manufacturing facilities.",
            "Implemented Lean Six Sigma continuous improvement programs, yielding $8.4M in recurring cost efficiencies across 24 consecutive months.",
            "Elevated regional supplier contract compliance to 99.1% by introducing standardized vendor performance scorecards and SLA enforcement.",
            "Commanded organizational change management initiative guiding 450+ team members during company-wide SAP S/4HANA migration with zero operational downtime.",
          ],
        },
        {
          role: "Operations Program Manager",
          company: "General Electric (GE Aerospace)",
          location: "Cincinnati, OH",
          dates: "2015 – 2020",
          bullets: [
            "Supervised procurement workflows for aerospace components, renegotiating 34 master service agreements to capture $4.2M in annual discounts.",
            "Decreased average supply chain lead time from 78 days to 49 days through proactive bottleneck analysis and localized supplier partnerships.",
            "Honored with GE Operational Excellence Leadership Award for orchestrating emergency logistics response with 100% vital delivery success.",
            "Spearheaded safety protocol revision across 3 regional distribution hubs, decreasing recordable workplace safety incidents by 68%.",
          ],
        },
      ],
      education: [
        {
          degree: "Master of Business Administration (MBA) in Strategy & Operations",
          school: "Northwestern University, Kellogg School of Management",
          location: "Evanston, IL",
          dates: "2013 – 2015",
          honors: "Dean's Distinguished Scholar",
        },
        {
          degree: "Bachelor of Arts in Economics",
          school: "University of Michigan",
          location: "Ann Arbor, MI",
          dates: "2009 – 2013",
        },
      ],
      certifications: [
        "Lean Six Sigma Master Black Belt (LSSMBB) — ASQ",
        "Project Management Professional (PMP)® — Project Management Institute",
      ],
    },
    plainText: `ELEANOR ROOSEVELT BLAKE
Senior Director of Global Operations & Strategy
Chicago, IL | +1 (312) 555-0188 | e.blake@corporateleadership.com | linkedin.com/in/eleanorblake-operations

PROFESSIONAL SUMMARY
Strategic, results-driven Director of Operations with 10+ years of leadership optimizing enterprise supply chains, global vendor management, and multi-million dollar P&L administration. Spearheaded operational transformations delivering $18M in cumulative cost reductions while maintaining 99.4% on-time delivery benchmarks across North American distribution networks.

CORE COMPETENCIES
Executive Leadership: Global Supply Chain Strategy, Enterprise P&L Management ($65M+), Multi-Site Operations, Organizational Change Management
Operational Excellence: Lean Six Sigma Master Black Belt, Continuous Process Improvement, Root Cause Analysis, Kaizen, Vendor Procurement & SLA Governance
Enterprise Systems: SAP S/4HANA, Oracle ERP Cloud, Tableau, Power BI, Advanced Workflow Automation, Regulatory Compliance (OSHA, ISO 9001)

PROFESSIONAL EXPERIENCE
Senior Director of Global Operations | Honeywell International | 2020 – Present
• Direct operational strategy and budget allocation ($65M annual P&L) across 6 North American supply chain and manufacturing facilities.
• Implemented Lean Six Sigma continuous improvement programs, yielding $8.4M in recurring cost efficiencies across 24 consecutive months.
• Elevated regional supplier contract compliance to 99.1% by introducing standardized vendor performance scorecards and SLA enforcement.
• Commanded organizational change management initiative guiding 450+ team members during company-wide SAP S/4HANA migration with zero operational downtime.

Operations Program Manager | General Electric (GE Aerospace) | 2015 – 2020
• Supervised procurement workflows for aerospace components, renegotiating 34 master service agreements to capture $4.2M in annual discounts.
• Decreased average supply chain lead time from 78 days to 49 days through proactive bottleneck analysis and localized supplier partnerships.
• Honored with GE Operational Excellence Leadership Award for orchestrating emergency logistics response with 100% vital delivery success.
• Spearheaded safety protocol revision across 3 regional distribution hubs, decreasing recordable workplace safety incidents by 68%.

EDUCATION
Master of Business Administration (MBA) in Strategy & Operations | Northwestern University, Kellogg School of Management | 2013 – 2015
Dean's Distinguished Scholar

Bachelor of Arts in Economics | University of Michigan | 2009 – 2013

CERTIFICATIONS
• Lean Six Sigma Master Black Belt (LSSMBB) — ASQ
• Project Management Professional (PMP)® — Project Management Institute`,
  },

  {
    id: "resumedone-clean",
    name: "Clean Minimalist ATS",
    tagline: "Streamlined modern structure with optimal OCR readability for marketing, product, and growth roles",
    category: "Product & Marketing",
    badge: "Product & Growth",
    atsScore: "97/100",
    styleVariant: "minimal",
    fontFamily: "sans",
    candidate: {
      fullName: "SOPHIA MARTINEZ",
      title: "Senior Product Marketing Manager",
      location: "San Francisco, CA",
      phone: "+1 (415) 555-0177",
      email: "sophia.m@saasgrowth.co",
      linkedin: "linkedin.com/in/sophiamartinez-pmm",
      website: "sophiamartinez.design",
      summary:
        "Energetic, metric-focused Senior Product Marketing Manager with 6+ years driving B2B SaaS go-to-market strategies, product launch execution, and user lifecycle optimization. Proven ability to translate complex technical capabilities into compelling value propositions, generating over $22M in pipeline revenue and boosting onboarding conversion by 34%.",
      skills: [
        {
          label: "Go-To-Market & Strategy",
          items: "GTM Launch Execution, Product Positioning & Messaging, Customer Segmentation, Competitive Intelligence & Battlecards",
        },
        {
          label: "Growth & Lifecycle",
          items: "Self-Serve Funnel Optimization, Onboarding Experimentation, Churn Reduction, Product-Led Growth (PLG), Sales Enablement",
        },
        {
          label: "Analytics & Tools",
          items: "Amplitude, Mixpanel, SQL (Querying), HubSpot, Salesforce CRM, Figma, Google Analytics 4, Notion, Marketo",
        },
      ],
      experience: [
        {
          role: "Senior Product Marketing Manager — Enterprise Collaboration",
          company: "Figma",
          location: "San Francisco, CA",
          dates: "2021 – Present",
          bullets: [
            "Spearheaded enterprise GTM launch strategy for advanced collaboration features, generating 140,000 net new activated team seats in Q1.",
            "Authored positioning frameworks, customer discovery playbooks, and competitive battlecards adopted by 130+ enterprise account executives.",
            "Conducted 80+ qualitative customer interviews and quantitative survey campaigns, uncovering product-market fit insights that reduced enterprise churn by 18%.",
            "Partnered with Product & Design leads to revamp freemium-to-paid upgrade flows, driving an immediate 28% boost in self-serve pipeline conversion.",
          ],
        },
        {
          role: "Product Marketing Specialist — Workflow Automation",
          company: "Asana",
          location: "San Francisco, CA",
          dates: "2018 – 2021",
          bullets: [
            "Co-led global product launch campaign for enterprise workflow automation suite, exceeding initial user adoption targets by 165%.",
            "Produced high-performing product webinars, customer case studies, and feature tour videos generating 2.4M organic impressions.",
            "Collaborated with Growth Engineering to optimize new-user onboarding checklists, improving Day-30 user retention from 31% to 44%.",
            "Conducted competitor pricing audits and customer willingness-to-pay studies that informed updated tiered packaging model.",
          ],
        },
      ],
      education: [
        {
          degree: "Bachelor of Arts in Marketing & Media Studies",
          school: "University of California, Berkeley",
          location: "Berkeley, CA",
          dates: "2014 – 2018",
          honors: "Honors Graduate, GPA: 3.86/4.0",
        },
      ],
      certifications: [
        "Product Marketing Certified (PMMC)® — Product Marketing Alliance",
        "Reforge Growth Series & Retention Certification",
      ],
    },
    plainText: `SOPHIA MARTINEZ
Senior Product Marketing Manager
San Francisco, CA | +1 (415) 555-0177 | sophia.m@saasgrowth.co | linkedin.com/in/sophiamartinez-pmm

PROFESSIONAL SUMMARY
Energetic, metric-focused Senior Product Marketing Manager with 6+ years driving B2B SaaS go-to-market strategies, product launch execution, and user lifecycle optimization. Proven ability to translate complex technical capabilities into compelling value propositions, generating over $22M in pipeline revenue and boosting onboarding conversion by 34%.

CORE SKILLS
Go-To-Market & Strategy: GTM Launch Execution, Product Positioning & Messaging, Customer Segmentation, Competitive Intelligence & Battlecards
Growth & Lifecycle: Self-Serve Funnel Optimization, Onboarding Experimentation, Churn Reduction, Product-Led Growth (PLG), Sales Enablement
Analytics & Tools: Amplitude, Mixpanel, SQL (Querying), HubSpot, Salesforce CRM, Figma, Google Analytics 4, Notion, Marketo

WORK EXPERIENCE
Senior Product Marketing Manager — Enterprise Collaboration | Figma | 2021 – Present
• Spearheaded enterprise GTM launch strategy for advanced collaboration features, generating 140,000 net new activated team seats in Q1.
• Authored positioning frameworks, customer discovery playbooks, and competitive battlecards adopted by 130+ enterprise account executives.
• Conducted 80+ qualitative customer interviews and quantitative survey campaigns, uncovering product-market fit insights that reduced enterprise churn by 18%.
• Partnered with Product & Design leads to revamp freemium-to-paid upgrade flows, driving an immediate 28% boost in self-serve pipeline conversion.

Product Marketing Specialist — Workflow Automation | Asana | 2018 – 2021
• Co-led global product launch campaign for enterprise workflow automation suite, exceeding initial user adoption targets by 165%.
• Produced high-performing product webinars, customer case studies, and feature tour videos generating 2.4M organic impressions.
• Collaborated with Growth Engineering to optimize new-user onboarding checklists, improving Day-30 user retention from 31% to 44%.
• Conducted competitor pricing audits and customer willingness-to-pay studies that informed updated tiered packaging model.

EDUCATION
Bachelor of Arts in Marketing & Media Studies | University of California, Berkeley | 2014 – 2018
Honors Graduate, GPA: 3.86/4.0

CERTIFICATIONS
• Product Marketing Certified (PMMC)® — Product Marketing Alliance
• Reforge Growth Series & Retention Certification`,
  },
];

export function getTemplateById(id: string): AtsTemplateProfile {
  const found = ATS_TEMPLATES_DATA.find((t) => t.id === id);
  return found || ATS_TEMPLATES_DATA[0];
}
