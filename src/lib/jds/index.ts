import type { JDPick } from "@/types/jd";

const JD_HR = `
Company: Expertizo, Karachi
Role: Human Resources Manager (Full-time, on-site)

Responsibilities:
- Manage full recruitment cycle for technical and non-technical roles.
- Hire MERN developers, Upwork bidders and business development staff.
- Plan training and development programs.
- Handle employee relations, grievances and disciplinary actions.
- Oversee admin staff and ensure HR policies are followed.
- Ensure compliance with Pakistani labour laws and company policies.

Requirements:
- Bachelor's in HR or related field.
- 1+ year in HR role at a software house.
- Experience hiring for tech roles (especially MERN).
- Knowledge of HR processes, benefits and labour regulations.
- Strong communication, negotiation and people management skills.
- HR certification (e.g. SHRM) is a plus.
`;

const JD_UPWORK = `
Company: Expertizo
Role: Upwork Bidding Specialist (On-site, night shift)

Responsibilities:
- Search and shortlist suitable web and app development projects on Upwork.
- Write custom, high-quality proposals and manage the full client communication cycle.
- Schedule and attend client calls, negotiate terms and close deals.
- Collaborate with development team to scope projects correctly.
- Track leads and opportunities in CRM tools.
- Meet daily, weekly and monthly bidding and revenue targets.
- Maintain clear records of proposals, conversions and performance.

Requirements:
- 1–2 years proven Upwork or freelance bidding experience.
- Strong written and spoken English.
- Understanding of web / app development services and pricing.
- Comfortable working with targets and using CRM / project tools.
- Night shift availability (Mon–Fri).
`;

const JD_MERN = `
Company: Expertizo
Role: MERN Stack Developer (On-site)

Responsibilities:
- Build and maintain web applications using MongoDB, Express, React and Node.
- Implement new features, fix bugs and participate in code reviews.
- Work with designers to deliver user-friendly interfaces.
- Write clean, well-documented code and follow best practices.
- Stay current with modern JavaScript and web technologies.

Requirements:
- Bachelor’s in Computer Science or related field, or equivalent experience.
- At least 2 years professional experience in web development.
- Strong skills in JavaScript, HTML, CSS and the MERN stack.
- Familiarity with REST APIs, Git and collaborative development.
- Good problem-solving, communication and teamwork skills.
- Extra points for experience with AI tools or additional tech (e.g. React Native, Flutter, Python).
`;

const JD_ADMIN = `
Company: Expertizo
Role: Office Admin / IT Officer (On-site)

Responsibilities:
- Oversee day-to-day office operations and ensure a smooth workflow.
- Manage office cleanliness, maintenance and coordination with external service providers.
- Handle procurement of groceries, furniture and office supplies; compare quotes and manage inventory.
- Maintain records of assets and stock.
- Provide basic IT support: laptop setup, simple troubleshooting, OS and software installation.
- Assist staff with connectivity and basic technical issues.
- Support management in organizing in-house events, celebrations and team activities.

Requirements:
- Minimum education: Intermediate; graduate degree preferred.
- Strong organizational and communication skills.
- Ability to manage multiple tasks independently.
- Basic understanding of laptop hardware and troubleshooting.
- Proficiency with MS Office or Google Workspace.
- Prior admin or office support experience is a plus.
`;




export function decideJD(jobTitleRaw: string): JDPick {
  const t = (jobTitleRaw || "").toLowerCase();

  if (t.includes("upwork") || t.includes("bid") || t.includes("bidding") || t.includes("proposal"))
    return { role: "Upwork Bidding Specialist", jd: JD_UPWORK };

  if (t.includes("hr") || t.includes("human resource") || t.includes("talent"))
    return { role: "Human Resources", jd: JD_HR };

  if (t.includes("mern") || t.includes("react") || t.includes("node") || t.includes("full stack"))
    return { role: "MERN Stack Developer", jd: JD_MERN };

  if (t.includes("admin") || t.includes("it officer") || t.includes("it support"))
    return { role: "Admin / IT", jd: JD_ADMIN };

  return { role: "Upwork Bidding Specialist", jd: JD_UPWORK };
}
