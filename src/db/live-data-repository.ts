import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { OverlayState } from "../types";
import { DEFAULT_STATE_BY_LOCALE } from "../types";
import {
  LECTURE_DEFAULT_SEGMENTS,
  MOBILE_DEFAULT_SEGMENTS,
  WORKBENCH_DEFAULT_SEGMENTS,
  type BottomBarSlot,
} from "../lib/bottomBar";
import type { Locale } from "../lib/i18n";
import type { BarProfileId } from "../lib/overlay-layout";

const BAR_PROFILES = ["workbench", "lecture", "mobile"] as const;

/** Rows → per-profile record. Pre-split rows default to "workbench" (via the
 *  column default); a profile with no rows falls back to its default set. */
function segmentsByProfileFromRows(
  rows: { profile: string; sortOrder: number; kind: string; sectionIndex: number | null; title: string | null; text: string | null; id: string; sessionId: string }[],
): Record<BarProfileId, BottomBarSlot[]> {
  const grouped: Record<BarProfileId, BottomBarSlot[]> = {
    workbench: [],
    lecture: [],
    mobile: [],
  };
  for (const row of rows) {
    const profile = (BAR_PROFILES as readonly string[]).includes(row.profile)
      ? (row.profile as BarProfileId)
      : "workbench";
    grouped[profile].push(segmentFromRow(row as LiveBottomBarSegmentRow));
  }
  if (grouped.workbench.length === 0)
    grouped.workbench = WORKBENCH_DEFAULT_SEGMENTS.map((slot) => ({ ...slot }));
  if (grouped.lecture.length === 0)
    grouped.lecture = LECTURE_DEFAULT_SEGMENTS.map((slot) => ({ ...slot }));
  if (grouped.mobile.length === 0)
    grouped.mobile = MOBILE_DEFAULT_SEGMENTS.map((slot) => ({ ...slot }));
  return grouped;
}
import {
  normalizeLiveDataSnapshot,
  overlayStateToLiveData,
  type LiveDataSnapshot,
  type LiveSessionStatus,
  type LiveSessionSummary,
} from "../lib/live-data";
import { getDb, isDatabaseConfigured, type AppDatabase } from "./client";
import {
  liveBottomBarSegments,
  liveSections,
  liveSessions,
  liveStackItems,
  liveTasks,
} from "./schema";

type LiveSessionRow = typeof liveSessions.$inferSelect;
type LiveSectionRow = typeof liveSections.$inferSelect;
type LiveTaskRow = typeof liveTasks.$inferSelect;
type LiveBottomBarSegmentRow = typeof liveBottomBarSegments.$inferSelect;

export interface LiveDataRepositoryResult {
  databaseConfigured: boolean;
  liveData: LiveDataSnapshot | null;
}

function isoOrEmpty(value: Date | string | null): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isoOrNull(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function dateOrNull(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function statusOrDraft(value: string): LiveSessionStatus {
  return value === "live" || value === "ended" ? value : "draft";
}

function rowToSession(row: LiveSessionRow): LiveSessionSummary {
  return {
    id: row.id,
    dateKey: row.dateKey,
    locale: row.locale === "en" ? "en" : "zh",
    title: row.title,
    status: statusOrDraft(row.status),
    startedAt: isoOrEmpty(row.startedAt),
    endedAt: isoOrNull(row.endedAt),
    createdAt: isoOrEmpty(row.createdAt),
    updatedAt: isoOrEmpty(row.updatedAt),
  };
}

function defaultTitle(defaultState: OverlayState, dateKey: string): string {
  return defaultState.cover.todayTopic || defaultState.cover.title || dateKey;
}

function segmentFromRow(row: LiveBottomBarSegmentRow): BottomBarSlot {
  switch (row.kind) {
    case "live":
      return { kind: "live" };
    case "progress":
      return { kind: "progress", sectionIndex: row.sectionIndex ?? 0 };
    case "stack":
      return { kind: "stack" };
    case "topic":
      return { kind: "topic" };
    case "agenda":
      return { kind: "agenda" };
    case "social":
      // The generic index column doubles as socialIndex for social slots.
      return {
        kind: "social",
        ...(typeof row.sectionIndex === "number" ? { socialIndex: row.sectionIndex } : {}),
      };
    case "text":
      return {
        kind: "text",
        title: row.title ?? "",
        text: row.text ?? "",
      };
    default:
      return { kind: "live" };
  }
}

function segmentToInsert(
  sessionId: string,
  profile: BarProfileId,
  segment: BottomBarSlot,
  sortOrder: number,
): typeof liveBottomBarSegments.$inferInsert {
  switch (segment.kind) {
    case "progress":
      return {
        sessionId,
        profile,
        sortOrder,
        kind: segment.kind,
        sectionIndex: segment.sectionIndex,
      };
    case "text":
      return {
        sessionId,
        profile,
        sortOrder,
        kind: segment.kind,
        title: segment.title,
        text: segment.text,
      };
    case "social":
      return {
        sessionId,
        profile,
        sortOrder,
        kind: segment.kind,
        // Reuse the generic index column so no migration is needed.
        sectionIndex: segment.socialIndex ?? null,
      };
    case "live":
    case "stack":
    case "topic":
    case "agenda":
      return {
        sessionId,
        profile,
        sortOrder,
        kind: segment.kind,
      };
  }
}

async function readLiveDataBySessionId(
  db: AppDatabase,
  sessionId: string,
): Promise<LiveDataSnapshot | null> {
  const [sessionRow] = await db
    .select()
    .from(liveSessions)
    .where(eq(liveSessions.id, sessionId))
    .limit(1);
  if (!sessionRow) return null;

  const sectionRows = await db
    .select()
    .from(liveSections)
    .where(eq(liveSections.sessionId, sessionId))
    .orderBy(asc(liveSections.sortOrder));

  const tasksBySection = new Map<string, LiveTaskRow[]>();
  if (sectionRows.length > 0) {
    const taskRows = await db
      .select()
      .from(liveTasks)
      .where(inArray(liveTasks.sectionId, sectionRows.map((section) => section.id)))
      .orderBy(asc(liveTasks.sortOrder));
    for (const task of taskRows) {
      const current = tasksBySection.get(task.sectionId) ?? [];
      current.push(task);
      tasksBySection.set(task.sectionId, current);
    }
  }

  const [stackRows, segmentRows] = await Promise.all([
    db
      .select()
      .from(liveStackItems)
      .where(eq(liveStackItems.sessionId, sessionId))
      .orderBy(asc(liveStackItems.sortOrder)),
    db
      .select()
      .from(liveBottomBarSegments)
      .where(eq(liveBottomBarSegments.sessionId, sessionId))
      .orderBy(asc(liveBottomBarSegments.sortOrder)),
  ]);

  const sectionsFor = (profile: string) =>
    sectionRows
      .filter((section) => section.profile === profile)
      .map((section) => ({
        title: section.title,
        ...(typeof section.minutes === "number" ? { minutes: section.minutes } : {}),
        ...(section.done ? { done: true } : {}),
        tasks: (tasksBySection.get(section.id) ?? []).map((task) => ({
          text: task.text,
          done: task.done,
        })),
      }));

  return normalizeLiveDataSnapshot({
    session: rowToSession(sessionRow),
    agendas: {
      workbench: { activeSection: sessionRow.activeSection, sections: sectionsFor("workbench") },
      lecture: { activeSection: sessionRow.activeSectionLecture, sections: sectionsFor("lecture") },
      mobile: { activeSection: sessionRow.activeSectionMobile, sections: sectionsFor("mobile") },
    },
    bottomBar: {
      visible: sessionRow.bottomBarVisible,
      segments: segmentsByProfileFromRows(segmentRows),
    },
    stackItems: stackRows.map((item) => item.label),
  });
}

async function replaceLiveDataChildren(
  db: AppDatabase,
  liveData: LiveDataSnapshot,
): Promise<void> {
  const sessionId = liveData.session.id;

  await db.delete(liveSections).where(eq(liveSections.sessionId, sessionId));
  await db.delete(liveStackItems).where(eq(liveStackItems.sessionId, sessionId));
  await db
    .delete(liveBottomBarSegments)
    .where(eq(liveBottomBarSegments.sessionId, sessionId));

  for (const profile of ["workbench", "lecture", "mobile"] as const) {
    for (const [sectionIndex, section] of liveData.agendas[profile].sections.entries()) {
      const [sectionRow] = await db
        .insert(liveSections)
        .values({
          sessionId,
          profile,
          sortOrder: sectionIndex,
          title: section.title,
          minutes: section.minutes ?? null,
          done: section.done === true,
        })
        .returning();
      if (!sectionRow) continue;

      const taskRows = section.tasks.map((task, taskIndex) => ({
        sectionId: sectionRow.id,
        sortOrder: taskIndex,
        text: task.text,
        done: task.done,
        doneAt: task.done ? new Date() : null,
      }));
      if (taskRows.length > 0) {
        await db.insert(liveTasks).values(taskRows);
      }
    }
  }

  if (liveData.stackItems.length > 0) {
    await db.insert(liveStackItems).values(
      liveData.stackItems.map((label, sortOrder) => ({
        sessionId,
        sortOrder,
        label,
      })),
    );
  }

  const segmentValues = BAR_PROFILES.flatMap((profile) =>
    liveData.bottomBar.segments[profile].map((segment, sortOrder) =>
      segmentToInsert(sessionId, profile, segment, sortOrder),
    ),
  );
  if (segmentValues.length > 0) {
    await db.insert(liveBottomBarSegments).values(segmentValues);
  }
}

export async function getCurrentLiveData(
  locale: Locale,
  dateKey: string,
): Promise<LiveDataRepositoryResult> {
  const db = getDb();
  if (!db) return { databaseConfigured: false, liveData: null };

  const [existing] = await db
    .select()
    .from(liveSessions)
    .where(and(eq(liveSessions.dateKey, dateKey), eq(liveSessions.locale, locale)))
    .limit(1);

  if (existing) {
    return {
      databaseConfigured: true,
      liveData: await readLiveDataBySessionId(db, existing.id),
    };
  }

  const defaultState = DEFAULT_STATE_BY_LOCALE[locale];
  const now = new Date();
  const [created] = await db
    .insert(liveSessions)
    .values({
      dateKey,
      locale,
      title: defaultTitle(defaultState, dateKey),
      status: "draft",
      activeSection: defaultState.sidebar.agendas.workbench.activeSection,
      bottomBarVisible: defaultState.bottomBar.visible,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!created) return { databaseConfigured: true, liveData: null };

  const liveData = overlayStateToLiveData(defaultState, rowToSession(created));
  await replaceLiveDataChildren(db, liveData);
  return {
    databaseConfigured: true,
    liveData: await readLiveDataBySessionId(db, created.id),
  };
}

export async function saveCurrentLiveData(
  locale: Locale,
  dateKey: string,
  liveData: LiveDataSnapshot,
): Promise<LiveDataRepositoryResult> {
  const db = getDb();
  if (!db) return { databaseConfigured: false, liveData: null };
  const normalizedLiveData = normalizeLiveDataSnapshot(liveData);

  const current = await getCurrentLiveData(locale, dateKey);
  if (!current.liveData) {
    return { databaseConfigured: true, liveData: null };
  }

  const session = {
    ...current.liveData.session,
    title: normalizedLiveData.session.title || current.liveData.session.title,
    status: normalizedLiveData.session.status,
    startedAt: normalizedLiveData.session.startedAt,
    endedAt: normalizedLiveData.session.endedAt,
  };

  await db
    .update(liveSessions)
    .set({
      title: session.title,
      status: session.status,
      activeSection: normalizedLiveData.agendas.workbench.activeSection,
      activeSectionLecture: normalizedLiveData.agendas.lecture.activeSection,
      activeSectionMobile: normalizedLiveData.agendas.mobile.activeSection,
      bottomBarVisible: normalizedLiveData.bottomBar.visible,
      startedAt: dateOrNull(session.startedAt),
      endedAt: dateOrNull(session.endedAt),
      updatedAt: new Date(),
    })
    .where(eq(liveSessions.id, session.id));

  await replaceLiveDataChildren(db, {
    ...normalizedLiveData,
    session,
  });

  return {
    databaseConfigured: true,
    liveData: await readLiveDataBySessionId(db, session.id),
  };
}

export async function startCurrentLiveSession(
  locale: Locale,
  dateKey: string,
): Promise<LiveDataRepositoryResult> {
  const current = await getCurrentLiveData(locale, dateKey);
  if (!current.liveData || !isDatabaseConfigured()) return current;

  const startedAt = current.liveData.session.startedAt || new Date().toISOString();
  return saveCurrentLiveData(locale, dateKey, {
    ...current.liveData,
    session: {
      ...current.liveData.session,
      status: "live",
      startedAt,
      endedAt: null,
    },
  });
}

export async function endCurrentLiveSession(
  locale: Locale,
  dateKey: string,
): Promise<LiveDataRepositoryResult> {
  const current = await getCurrentLiveData(locale, dateKey);
  if (!current.liveData || !isDatabaseConfigured()) return current;

  return saveCurrentLiveData(locale, dateKey, {
    ...current.liveData,
    session: {
      ...current.liveData.session,
      status: "ended",
      endedAt: new Date().toISOString(),
    },
  });
}

export async function listLiveSessions(limit = 20): Promise<LiveSessionSummary[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(liveSessions)
    .orderBy(desc(liveSessions.dateKey), desc(liveSessions.updatedAt))
    .limit(limit);
  return rows.map(rowToSession);
}
