/**
 * Airtable Bidirectional Service
 * BOSS → Actions table
 *
 * Create/Update/Delete from the frontend → immediately writes to Airtable
 * Pull-sync fetches all records from Airtable → reconciles local PostgreSQL
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import Airtable from "airtable";
import { prisma } from "@/lib/prisma";
import { AIRTABLE_STATUS_MAP, STATUS_TO_AIRTABLE } from "@/lib/constants";
import crypto from "crypto";

const BASE_ID  = "app8QxH2cjt0fueuW";
const TABLE_ID = "tbl5lC48jR9KXG4lV";

// ─── Field IDs ────────────────────────────────────────────────
export const F = {
  CODE:             "fldZC7jJD4mOucCoe",
  ACCRUE:           "fld0vMW0hc4QLFrdh",
  TASK_TITLE:       "fldpYdXBBZuNcV75X",
  TYPE:             "fldiyl75JVc9K4xkg",
  STATUS:           "fldWInQJwHjQXq7xc",
  FOLIO:            "fldqnbxv4BJmjTIfv",
  ASN:              "fld1p5CjF0B7GZx9l",
  QA:               "flda8D5x4munDHuIS",
  POC:              "fldy8LJb1JcbO1KH0",
  BRIEF:            "fld602VDqZGTQdDOI",
  FINALIZED:        "fldfUQXz5donAdCp6",
  NO:               "fld1TDp4F76YDNCbp",
  LINE:             "fldx8udqDaFbfpLGg",
  FORM:             "fldc7KgNfB4zwTfBY",
  UPDATED:          "fldJ1ZCcMpKIBoJUp",
  START:            "fldczExYnHX1emjFk",
  END:              "fld1nVCrdPmzvru6L",
  HRS:              "flddbKMvPgjZ6FkN8",
  WBS:              "fldi70zV66ZtSmUag",
  CREATED:          "fldHxLqznkkbexMLs",
  CATEGORY:         "fldcIFREe8HjWIOMe",
  ATTACHMENT:       "fldbYFUZ7RRd59O1r",
  BUSINESS_TERMS:   "fldtA39f46McDL0MP",
  PLACE_OF_PERFORM: "fldS4yQx5Kqb6ph9v",
  PERIOD_OF_PERFORM:"fldh7mfvnGjh9QSRA",
  OUTCOME:          "fldOCSWTUoDrtfest",
  NUMBER:           "fldx3QQpp3C1Vng7g",
  CREATED_BY:       "fldQ0gsPssDsjssgm",
  STAGE:            "fldDmVJF0asFWDrrk",
  REC_ID:           "fldOmgMLgHrBXKMdu",
  SORT:             "fldmi2RJKYTCrx9U2",
  POSITION:         "fldJcHFaQd90z3HYP",
  CONTEXT:          "fldZAqphRTMG7ohh8",
} as const;

const READ_FIELDS = Object.values(F) as string[];

export interface ActionWritePayload {
  title?:           string;
  actionType?:      string | null;
  status?:          string | null;
  accrueDate?:      Date | string | null;
  brief?:           string | null;
  startAt?:         Date | string | null;
  endAt?:           Date | string | null;
  wbs?:             string | null;
  businessTerms?:   string | null;
  placeOfPerform?:  string | null;
  periodOfPerform?: string | null;
  number?:          number | null;
  stage?:           string | null;
  sort?:            number | null;
  boardPosition?:   Record<string, unknown> | null;
  contextTags?:     string[];
}

export interface SyncResult {
  created:  number;
  updated:  number;
  skipped:  number;
  errors:   number;
  duration: number;
}

// ─── Helpers ──────────────────────────────────────────────────
function getTable() {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY not set");
  return new Airtable({ apiKey: key }).base(BASE_ID)(TABLE_ID);
}

function selectName(v: any): string | null {
  if (v && typeof v === "object" && "name" in v) return (v as any).name;
  if (typeof v === "string") return v;
  return null;
}

function multiSelectNames(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((i: any) => selectName(i)).filter(Boolean) as string[];
}

function hash(data: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16);
}

function payloadToFields(p: ActionWritePayload): Record<string, any> {
  const f: Record<string, any> = {};
  if (p.title         !== undefined) f[F.TASK_TITLE]        = p.title ?? "";
  if (p.actionType    !== undefined) f[F.TYPE]              = p.actionType ?? "";
  if (p.status        !== undefined && p.status)            f[F.STATUS] = STATUS_TO_AIRTABLE[p.status as keyof typeof STATUS_TO_AIRTABLE] ?? p.status;
  if (p.wbs           !== undefined) f[F.WBS]               = p.wbs ?? "";
  if (p.brief         !== undefined) f[F.BRIEF]             = p.brief ?? "";
  if (p.businessTerms !== undefined) f[F.BUSINESS_TERMS]    = p.businessTerms ?? "";
  if (p.placeOfPerform!== undefined) f[F.PLACE_OF_PERFORM]  = p.placeOfPerform ?? "";
  if (p.periodOfPerform!==undefined) f[F.PERIOD_OF_PERFORM] = p.periodOfPerform ?? "";
  if (p.number        !== undefined && p.number !== null) f[F.NUMBER] = p.number;
  if (p.stage         !== undefined) f[F.STAGE]             = p.stage ?? "";
  if (p.sort          !== undefined && p.sort !== null)   f[F.SORT]   = p.sort;
  if (p.contextTags   !== undefined) f[F.CONTEXT]           = p.contextTags;
  if (p.boardPosition !== undefined) f[F.POSITION] = p.boardPosition ? JSON.stringify(p.boardPosition) : "";

  if (p.accrueDate !== undefined) {
    if (p.accrueDate) {
      const d = new Date(p.accrueDate);
      f[F.ACCRUE] = d.toISOString().split("T")[0];
    }
  }
  if (p.startAt !== undefined && p.startAt) f[F.START] = new Date(p.startAt).toISOString();
  if (p.endAt   !== undefined && p.endAt)   f[F.END]   = new Date(p.endAt).toISOString();

  return f;
}

function fieldsToLocal(airtableId: string, fields: any, createdTime: string) {
  const hrsRaw = fields[F.HRS];
  const hrs = typeof hrsRaw === "number" && !isNaN(hrsRaw) ? hrsRaw : null;

  let boardPosition: Record<string, unknown> | null = null;
  if (typeof fields[F.POSITION] === "string" && fields[F.POSITION]) {
    try { boardPosition = JSON.parse(fields[F.POSITION]); } catch { /* noop */ }
  }

  const statusRaw = selectName(fields[F.STATUS]);
  const status = statusRaw ? (AIRTABLE_STATUS_MAP[statusRaw] ?? null) : null;

  return {
    airtableId,
    code:            fields[F.CODE]       ?? null,
    sequenceNo:      typeof fields[F.NO] === "number" ? fields[F.NO] : null,
    title:           fields[F.TASK_TITLE] ?? "(Untitled)",
    brief:           typeof fields[F.BRIEF] === "string" ? fields[F.BRIEF] : null,
    businessTerms:   typeof fields[F.BUSINESS_TERMS] === "string" ? fields[F.BUSINESS_TERMS] : null,
    status,
    actionType:      selectName(fields[F.TYPE]),
    contextTags:     multiSelectNames(fields[F.CONTEXT]),
    accrueDate:      fields[F.ACCRUE]  ? new Date(fields[F.ACCRUE]) : null,
    startAt:         fields[F.START]   ? new Date(fields[F.START])  : null,
    endAt:           fields[F.END]     ? new Date(fields[F.END])    : null,
    durationHours:   hrs,
    wbs:             typeof fields[F.WBS]   === "string" ? fields[F.WBS]   : null,
    stage:           typeof fields[F.STAGE] === "string" ? fields[F.STAGE] : null,
    placeOfPerform:  typeof fields[F.PLACE_OF_PERFORM]  === "string" ? fields[F.PLACE_OF_PERFORM] : null,
    periodOfPerform: typeof fields[F.PERIOD_OF_PERFORM] === "string" ? fields[F.PERIOD_OF_PERFORM] : null,
    sort:            typeof fields[F.SORT]   === "number" ? fields[F.SORT]   : null,
    number:          typeof fields[F.NUMBER] === "number" ? fields[F.NUMBER] : null,
    boardPosition,
    airtableCreatedAt: new Date(createdTime),
    airtableUpdatedAt: typeof fields[F.UPDATED] === "string" ? new Date(fields[F.UPDATED]) : new Date(),
    lastSyncedAt: new Date(),
    syncHash: hash(fields),
  };
}

// ─── CREATE ───────────────────────────────────────────────────
export async function createActionInAirtable(payload: ActionWritePayload) {
  const table = getTable();
  const atFields = payloadToFields(payload);

  const rec: any = await new Promise((resolve, reject) =>
    table.create(atFields, (err: any, r: any) => err ? reject(err) : resolve(r))
  );

  const localData = fieldsToLocal(rec.id, rec.fields, rec._rawJson?.createdTime ?? new Date().toISOString());
  const action = await prisma.action.create({ data: localData });

  await prisma.activityLog.create({
    data: { actionId: action.id, event: "CREATED", entityType: "Action", entityId: action.id },
  }).catch(() => {});

  return action;
}

// ─── UPDATE ───────────────────────────────────────────────────
export async function updateActionInAirtable(localId: string, payload: ActionWritePayload) {
  const existing = await prisma.action.findFirst({
    where: { OR: [{ id: localId }, { airtableId: localId }] },
  });
  if (!existing) throw new Error(`Action not found: ${localId}`);
  if (!existing.airtableId) throw new Error("Action has no Airtable record — cannot sync");

  const table = getTable();
  const atFields = payloadToFields(payload);

  const rec: any = await new Promise((resolve, reject) =>
    table.update(existing.airtableId!, atFields, (err: any, r: any) => err ? reject(err) : resolve(r))
  );

  const localData = fieldsToLocal(
    rec.id,
    rec.fields,
    rec._rawJson?.createdTime ?? existing.airtableCreatedAt?.toISOString() ?? new Date().toISOString()
  );

  const action = await prisma.action.update({
    where: { id: existing.id },
    data: { ...localData, id: undefined, airtableId: undefined },
  });

  await prisma.activityLog.create({
    data: {
      actionId: action.id,
      event: payload.status ? "STATUS_CHANGED" : "UPDATED",
      entityType: "Action",
      entityId: action.id,
      changes: payload as any,
    },
  }).catch(() => {});

  return action;
}

// ─── DELETE ───────────────────────────────────────────────────
export async function deleteActionInAirtable(localId: string) {
  const existing = await prisma.action.findFirst({
    where: { OR: [{ id: localId }, { airtableId: localId }] },
  });
  if (!existing) throw new Error(`Action not found: ${localId}`);

  if (existing.airtableId) {
    const table = getTable();
    await new Promise((resolve, reject) =>
      table.destroy(existing.airtableId!, (err: any, r: any) => err ? reject(err) : resolve(r))
    );
  }

  await prisma.action.update({ where: { id: existing.id }, data: { isArchived: true } });

  await prisma.activityLog.create({
    data: { actionId: existing.id, event: "ARCHIVED", entityType: "Action", entityId: existing.id },
  }).catch(() => {});
}

// ─── PULL SYNC ────────────────────────────────────────────────
export async function syncActionsFromAirtable(options: { limit?: number } = {}): Promise<SyncResult> {
  const t0 = Date.now();
  const result: SyncResult = { created:0, updated:0, skipped:0, errors:0, duration:0 };

  const syncLog = await prisma.syncLog.create({ data: { status: "RUNNING" } });

  try {
    const table = getTable();
    const allRecords: any[] = [];

    await table.select({
      fields: READ_FIELDS,
      ...(options.limit ? { maxRecords: options.limit } : {}),
    }).eachPage((records: any, next: any) => {
      allRecords.push(...records);
      next();
    });

    for (const rec of allRecords) {
      try {
        await upsertLocal(rec, result);
      } catch (err) {
        console.error(`[Sync] record ${rec.id}:`, err);
        result.errors++;
      }
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status:           result.errors > 0 ? "PARTIAL" : "SUCCESS",
        recordsProcessed: allRecords.length,
        recordsCreated:   result.created,
        recordsUpdated:   result.updated,
        recordsSkipped:   result.skipped,
        duration:         Date.now() - t0,
        completedAt:      new Date(),
      },
    });
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status:"FAILED", errorMessage: String(err), completedAt: new Date() },
    });
    throw err;
  }

  result.duration = Date.now() - t0;
  return result;
}

async function upsertLocal(rec: any, result: SyncResult) {
  const h = hash(rec.fields);
  const existing = await prisma.action.findUnique({ where: { airtableId: rec.id } });

  if (existing?.syncHash === h) { result.skipped++; return; }

  const data = fieldsToLocal(rec.id, rec.fields, rec._rawJson?.createdTime ?? rec.createdTime ?? new Date().toISOString());

  if (existing) {
    await prisma.action.update({ where: { id: existing.id }, data: { ...data, id: undefined, airtableId: undefined } });
    result.updated++;
  } else {
    const created = await prisma.action.create({ data });
    result.created++;
  }

  // Sync attachments
  const atts = rec.fields[F.ATTACHMENT];
  if (Array.isArray(atts) && atts.length > 0) {
    const actionId = existing?.id ?? (await prisma.action.findUnique({ where: { airtableId: rec.id }, select: { id: true } }))?.id;
    if (actionId) {
      await prisma.attachment.deleteMany({ where: { actionId } });
      await prisma.attachment.createMany({
        data: atts.map((a: any) => ({
          actionId,
          airtableId:   a.id,
          fileName:     a.filename,
          fileUrl:      a.url,
          fileSize:     a.size ?? null,
          mimeType:     a.type ?? null,
          thumbnailUrl: a.thumbnails?.small?.url ?? a.thumbnails?.large?.url ?? null,
        })),
      });
    }
  }
}

export async function refreshActionFromAirtable(airtableId: string) {
  const table = getTable();
  const rec: any = await new Promise((resolve, reject) =>
    table.find(airtableId, (err: any, r: any) => err ? reject(err) : resolve(r))
  );
  const result: SyncResult = { created:0, updated:0, skipped:0, errors:0, duration:0 };
  await upsertLocal(rec, result);
  return prisma.action.findUnique({ where: { airtableId } });
}
