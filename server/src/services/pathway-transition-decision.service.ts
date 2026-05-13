import prisma from '../config/database';
import { ApiError } from '../utils/error.util';

type SaveDecisionInput = {
  learnerId: string;
  recommendedPathway: string;
  confidenceScore: number;
  learnerInterest?: string | null;
  teacherRecommendation?: string | null;
  parentPreference?: string | null;
  finalApprovedPathway?: string | null;
  mismatchWarning?: string | null;
  analysisPayload?: any;
  updatedBy?: string | null;
};

let tableReady = false;

async function ensureDecisionTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS learner_pathway_recommendations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "learnerId" TEXT NOT NULL,
      "recommendedPathway" TEXT NOT NULL,
      "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "learnerInterest" TEXT NULL,
      "teacherRecommendation" TEXT NULL,
      "parentPreference" TEXT NULL,
      "finalApprovedPathway" TEXT NULL,
      "mismatchWarning" TEXT NULL,
      "analysisPayload" JSONB NULL,
      "updatedBy" TEXT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS lpr_learner_idx
    ON learner_pathway_recommendations ("learnerId", "createdAt" DESC);
  `);
  tableReady = true;
}

export async function saveTransitionDecision(input: SaveDecisionInput) {
  await ensureDecisionTable();
  const learner = await prisma.learner.findUnique({
    where: { id: input.learnerId },
    select: { id: true },
  });
  if (!learner) throw new ApiError(404, 'Learner not found');

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    INSERT INTO learner_pathway_recommendations (
      "learnerId",
      "recommendedPathway",
      "confidenceScore",
      "learnerInterest",
      "teacherRecommendation",
      "parentPreference",
      "finalApprovedPathway",
      "mismatchWarning",
      "analysisPayload",
      "updatedBy",
      "updatedAt"
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
    RETURNING *;
  `, input.learnerId, input.recommendedPathway, input.confidenceScore, input.learnerInterest || null, input.teacherRecommendation || null, input.parentPreference || null, input.finalApprovedPathway || null, input.mismatchWarning || null, input.analysisPayload || null, input.updatedBy || null);

  return rows?.[0] || null;
}

export async function getTransitionDecisionHistory(learnerId: string) {
  await ensureDecisionTable();
  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT *
    FROM learner_pathway_recommendations
    WHERE "learnerId" = $1
    ORDER BY "createdAt" DESC
    LIMIT 30;
  `, learnerId);
  return rows || [];
}

