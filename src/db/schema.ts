import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const liveSessions = pgTable(
  "live_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dateKey: varchar("date_key", { length: 10 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    title: text("title").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    // Per scene-profile active agenda section. The unqualified column is the
    // workbench profile (legacy rows keep their meaning).
    activeSection: integer("active_section").notNull().default(0),
    activeSectionLecture: integer("active_section_lecture").notNull().default(0),
    activeSectionMobile: integer("active_section_mobile").notNull().default(0),
    bottomBarVisible: boolean("bottom_bar_visible").notNull().default(true),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("live_sessions_date_locale_unique").on(
      table.dateKey,
      table.locale,
    ),
  ],
);

export const liveSections = pgTable("live_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => liveSessions.id, { onDelete: "cascade" }),
  /** Scene profile this section belongs to (workbench / lecture / mobile). */
  profile: varchar("profile", { length: 16 }).notNull().default("workbench"),
  sortOrder: integer("sort_order").notNull(),
  title: text("title").notNull(),
  // Planned duration in minutes (agenda timing); null = not planned.
  minutes: integer("minutes"),
  // Manual per-section completion (checked off by the host).
  done: boolean("done").notNull().default(false),
  // Per-section speaker/guest and their role/affiliation lines.
  speaker: text("speaker"),
  speakerLines: jsonb("speaker_lines").$type<string[]>(),
});

export const liveTasks = pgTable("live_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => liveSections.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull(),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  doneAt: timestamp("done_at", { withTimezone: true }),
});

export const liveStackItems = pgTable("live_stack_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => liveSessions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull(),
  label: text("label").notNull(),
});

export const liveBottomBarSegments = pgTable("live_bottom_bar_segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => liveSessions.id, { onDelete: "cascade" }),
  // Which bar data set the row belongs to; pre-split rows were the workbench's.
  profile: varchar("profile", { length: 16 }).notNull().default("workbench"),
  sortOrder: integer("sort_order").notNull(),
  kind: varchar("kind", { length: 24 }).notNull(),
  sectionIndex: integer("section_index"),
  title: text("title"),
  text: text("text"),
});

export const agentConversations = pgTable(
  "agent_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dateKey: varchar("date_key", { length: 10 }).notNull(),
    locale: varchar("locale", { length: 2 }).notNull(),
    liveSessionId: uuid("live_session_id").references(() => liveSessions.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_conversations_date_locale_idx").on(table.dateKey, table.locale),
    index("agent_conversations_updated_at_idx").on(table.updatedAt),
  ],
);

export const agentMessages = pgTable(
  "agent_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => agentConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(),
    kind: varchar("kind", { length: 16 }),
    status: varchar("status", { length: 16 }),
    content: text("content").notNull(),
    taskId: varchar("task_id", { length: 32 }),
    taskLabel: text("task_label"),
    snapshot: varchar("snapshot", { length: 64 }),
    provider: varchar("provider", { length: 64 }),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const agentProposals = pgTable(
  "agent_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => agentConversations.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => agentMessages.id, { onDelete: "cascade" }),
    configText: text("config_text").notNull(),
    summaryJson: jsonb("summary_json"),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agent_proposals_conversation_idx").on(table.conversationId),
    index("agent_proposals_message_idx").on(table.messageId),
  ],
);
