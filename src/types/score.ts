export type ScoreOutput = {
  match_score: number;
  recommendation: "Shortlisted" | "Not Shortlisted";
  highlights: string[];
  reasoning: string;
  candidate_name: string;
  candidate_email: string;
  experience_years: number;
  title: string;      
  description: string;
  education?: string;
  portfolio_link?: string;
  github_profile_link?: string;
  freelancing_status?: string;
  age?: string;
  marital_status?: string;
  extra_skills?: string;
};
