import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

import { prefer } from "@/lib/utils/merge";

import {
  readEmailHtmlTool,
  parseIndeedEmailHtmlTool,
  decideJDTool,
  downloadAndExtractResumeTool,
  scoreCandidateTool,
  saveCandidateResultTool,
  createTrelloCardTool,
  markAsReadTool,
} from "@/lib/tools";

const InputSchema = z.object({
  gmailMessageId: z.string().min(1),
  dry: z.boolean().optional().default(false),
  test: z.boolean().optional().default(false),
  markRead: z.boolean().optional().default(false),
});

function normalizeQuizMarks(v: any): string {
  if (v == null) return "Not Provided";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  const s = String(v).trim();
  if (!s) return "Not Provided";
  return s.replace(/%/g, "").trim() || "Not Provided";
}

function buildTrelloDesc(params: { role: string; quizMarks: string; score: any; profile: any }) {
  const { role, quizMarks, score, profile } = params;

  return [
    "Description:",
    `Name: ${score.candidate_name || "Not Provided"};`,
    `Applied For Role: ${role || "Not Provided"};`,
    `Quiz Marks (In %): ${quizMarks};`,
    `AI Score (Match %): ${Number(score.match_score || 0)};`,
    `Education: ${score.education || "Not Provided"};`,
    `Portfolio Link: ${score.portfolio_link || "Not Provided"};`,
    `Github Profile Link: ${score.github_profile_link || "Not Provided"};`,
    `Experience: ${(score.experience_years ?? "Not Provided")} Years;`,
    `Freelancing Status: ${score.freelancing_status || "Not Provided"};`,
    `Age: ${score.age || "Not Provided"};`,
    `Marital Status: ${score.marital_status || "Not Provided"};`,
    `Availability: ${profile.availability || "Not Provided"};`,
    `Reason for Leaving: ${profile.reasonForLeaving || "Not Provided"};`,
    `Commuting Issues: ${profile.commutingIssues || "Not Provided"};`,
    `Interview Availability: ${profile.interviewAvailability || "Not Provided"};`,
    `Extra Skills: ${score.extra_skills || "Not Provided"};`,
    `Source: ${profile.source || "Indeed"};`,
    `Job URL: ${profile.fullApplicationUrl || profile.jobUrl || "Not Provided"};`,
    `CV Link: ${profile.cvLink || "Not Provided"}`,
  ].join("\n");
}

export const processCandidateToolChain = RunnableSequence.from([
  async (input: unknown) => {
    const ctx = InputSchema.parse(input);
    console.log("RUNNING TOOLCHAIN ✅", ctx.gmailMessageId);
    return ctx;
    console.log("✅ TOOLCHAIN STARTED", ctx.gmailMessageId);

  },

  
  async (ctx) => {
    const { html } = await readEmailHtmlTool.invoke({ messageId: ctx.gmailMessageId });
    return { ...ctx, html };
  },


  async (ctx) => {
    const emailData = await parseIndeedEmailHtmlTool.invoke({ html: ctx.html });
    return { ...ctx, emailData };
  },


  async (ctx) => {
    const jobTitle = (ctx.emailData as any).jobTitle || "Upwork Bidding Specialist";
    const resumeUrl = (ctx.emailData as any).resumeUrl || (ctx.emailData as any).saferedirectUrl;

    if (!resumeUrl) {
      return { ...ctx, earlyExit: { skipped: true, reason: "resumeUrl not found" } };
    }

    return { ...ctx, jobTitle, resumeUrl };
  },


  async (ctx) => {
    if (ctx.earlyExit) return ctx;
    const pick = await decideJDTool.invoke({ jobTitleRaw: ctx.jobTitle });
    return { ...ctx, role: pick.role, jd: pick.jd };
  },


  async (ctx) => {
    if (ctx.earlyExit) return ctx;
    const resume = await downloadAndExtractResumeTool.invoke({ resumeUrl: ctx.resumeUrl });
    return { ...ctx, ...resume };
  },


  async (ctx) => {
    if (ctx.earlyExit) return ctx;

    const quizMarks = normalizeQuizMarks((ctx.emailData as any).quizMarks);

    const profile: any = prefer(ctx.emailData as any, {
      applied_role: ctx.jobTitle,
      resumeText: ctx.resumeText || "",
      resumeMime: ctx.resumeMime || "",
      resumeDownloadFailed: !!ctx.resumeDownloadFailed,
      resumeDownloadError: ctx.resumeDownloadError || "",
      quizMarks,
    });

    profile.age = profile.age == null ? "" : String(profile.age);
    profile.resumeText = profile.resumeText ? String(profile.resumeText) : "";

    return { ...ctx, quizMarks, profile };
  },


  async (ctx) => {
    if (ctx.earlyExit) return ctx;

    let score: any = { match_score: 0, candidate_name: "Not Provided", title: "" };
    let shortlisted = false;

    try {
      score = await scoreCandidateTool.invoke({ jd: ctx.jd, role: ctx.role, profile: ctx.profile });
      shortlisted = Number(score?.match_score || 0) >= 60;
    } catch (e: any) {
      console.log("Scoring failed (continuing):", e?.message || e);
      score = { match_score: 0, candidate_name: "Not Provided", title: "", error: e?.message || "score failed" };
      shortlisted = false;
    }

    return { ...ctx, score, shortlisted };
  },


  async (ctx) => {
    if (ctx.earlyExit) return ctx;

    const saved = await saveCandidateResultTool.invoke({
      dry: ctx.dry,
      emailMessageId: ctx.gmailMessageId,
      source: ctx.profile.source || "",
      jobTitle: ctx.jobTitle,
      applied_role: ctx.role,
      profile: ctx.profile,
      score: ctx.score,
      shortlisted: ctx.shortlisted,
    });

    return { ...ctx, mongoId: saved.mongoId };
  },

  async (ctx) => {
    if (ctx.earlyExit) return ctx;

    if (ctx.shortlisted && !ctx.dry && !ctx.resumeDownloadFailed) {
      const trelloName =
        ctx.score.title ||
        `${ctx.score.candidate_name || "Not Provided"} - ${ctx.role} - ${ctx.profile.source || "Indeed"}`;

      const trelloDesc = buildTrelloDesc({
        role: ctx.role,
        quizMarks: ctx.quizMarks,
        score: ctx.score,
        profile: ctx.profile,
      });

      await createTrelloCardTool.invoke({ name: trelloName, desc: trelloDesc });
    }

    return ctx;
  },

  async (ctx) => {
    if (ctx.earlyExit) return ctx;

    if (ctx.markRead) {
      try {
        await markAsReadTool.invoke({ messageId: ctx.gmailMessageId });
      } catch (e: any) {
        console.log("markRead failed (ignored):", e?.message || e);
      }
    }

    return ctx;
  },

  async (ctx) => {
    if (ctx.earlyExit) return { messageId: ctx.gmailMessageId, ...ctx.earlyExit };

    return {
      messageId: ctx.gmailMessageId,
      ok: true,
      shortlisted: ctx.shortlisted,
      mongoId: ctx.mongoId,
      quizMarks: ctx.quizMarks,
      match_score: Number(ctx.score?.match_score || 0),
      resumeDownloadFailed: !!ctx.resumeDownloadFailed,
      resumeDownloadError: ctx.resumeDownloadError || "",
    };
  },
]);
