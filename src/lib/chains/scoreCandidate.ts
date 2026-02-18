import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import type { CandidateProfile } from "@/types/candidate";
import type { ScoreOutput } from "@/types/score";

const ScoreSchema = z.object({
  match_score: z.number().int().min(0).max(100),
  recommendation: z.enum(["Shortlisted", "Not Shortlisted"]),
  highlights: z.array(z.string()).default([]),
  reasoning: z.string().max(800).default(""),
  candidate_name: z.string().default("Not Provided"),
  candidate_email: z.string().default("Not Provided"),
  experience_years: z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  })
  .default(0),
  title: z.string().default(""),
  education: z.string().optional().default("Not Provided"),
  portfolio_link: z.string().optional().default("Not Provided"),
  github_profile_link: z.string().optional().default("Not Provided"),
  freelancing_status: z.string().optional().default("Not Provided"),
  age: z.union([z.string(), z.number()]).transform((v) => String(v)).optional().default("Not Provided"),
  marital_status: z.string().optional().default("Not Provided"),
  extra_skills: z.string().optional().default("Not Provided"),
});

const prompt = new PromptTemplate({
  template: [
 "You are an ATS screening assistant AND a strict JSON generator.",
    "Your output is consumed by a Zod schema. Any type mismatch will break the system.",
    "Return VALID JSON ONLY. No markdown. No explanations. No comments.",
    "",
    "SCHEMA ENFORCEMENT (MANDATORY):",
    "- You MUST return ALL keys listed below.",
    "- Types MUST be exact. Do NOT guess types.",
    "- NEVER return null or undefined.",
    "- If a value is missing or unknown, return \"Not Provided\".",
    "",
    "TYPE RULES:",
    "- match_score: integer between 0 and 100",
    "- recommendation: \"Shortlisted\" ONLY if match_score >= 60, else \"Not Shortlisted\"",
    "- highlights: ALWAYS an array of strings (string[]) — even if only one item",
    "- reasoning: string, max 800 characters",
    "- experience_years: ALWAYS a number (convert from text if needed)",
    "- extra_skills: ALWAYS a single string (comma-separated if multiple skills)",
    "- age: ALWAYS a string",
    "",
    "NEVER:",
    "- Do NOT return a string where an array is required",
    "- Do NOT return an array where a string is required",
    "- Do NOT return objects for any field",
    "- Do NOT invent quiz marks (quiz is handled elsewhere)",
    "",
    "Return JSON keys EXACTLY in this order:",
    "match_score, recommendation, highlights, reasoning,",
    "candidate_name, candidate_email, experience_years,",
    "education, portfolio_link, github_profile_link, freelancing_status,",
    "age, marital_status, extra_skills, title",
    "",
    "Title format:",
    "\"<candidate_name> - <role> - <source>\"",
    "",
    "JD:\n{jd}\n",
    "ROLE:\n{role}\n",
    "SOURCE:\n{source}\n",
    "KNOWN_FIELDS_JSON:\n{known_fields}\n",
    "RESUME_TEXT:\n{resume_text}\n",
  ].join("\n"),
  inputVariables: ["jd", "role", "source", "known_fields", "resume_text"],
});

export async function scoreCandidate(params: {
  jd: string;
  role: string;
  profile: CandidateProfile;
}): Promise<ScoreOutput> {
  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-5-nano"
  });

  const known = {
    candidate_name: params.profile.candidate_name || "",
    candidate_email: params.profile.candidate_email || "",
    availability: params.profile.availability || "",
    interviewAvailability: params.profile.interviewAvailability || "",
    applied_role: params.profile.applied_role || params.role || "",
    source: params.profile.source || "",
  };

  const content = await prompt.format({
    jd: params.jd,
    role: params.role,
    source: params.profile.source || "Not Provided",
    known_fields: JSON.stringify(known),
    resume_text: (params.profile.resumeText || "").slice(0, 120_000),
  });

  const res = await model.invoke(
    [
      { role: "system", content: "Return valid JSON only. No markdown. No extra keys." },
      { role: "user", content },
    ],
    { response_format: { type: "json_object" } as any }
  );

  const raw = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  const parsed = ScoreSchema.parse(JSON.parse(raw));

  parsed.recommendation = parsed.match_score >= 60 ? "Shortlisted" : "Not Shortlisted";

  if (!parsed.title?.trim()) {
    parsed.title = `${parsed.candidate_name || "Not Provided"} - ${params.role} - ${params.profile.source || "Not Provided"}`;
  }

  return parsed as ScoreOutput;
}