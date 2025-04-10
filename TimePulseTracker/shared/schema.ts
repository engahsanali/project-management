import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Project status types
export const PROJECT_STATUS = {
  DRAFT: "draft",
  IN_PROGRESS: "in_progress",
  DESIGN_REVIEW: "design_review",
  COMPLETED: "completed",
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS;

// Define the Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  referenceNumber: text("reference_number").notNull().unique(),
  formCodeType: text("form_code_type").notNull(),
  status: text("status").notNull().default(PROJECT_STATUS.DRAFT),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

// Define the Work Orders table
export const WORK_ORDER_TYPE = {
  VALIDATION: "validation",
  INTERNAL_DESIGN: "internal_design",
} as const;

export type WorkOrderType = keyof typeof WORK_ORDER_TYPE;

export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  type: text("type").notNull(),
  identifier: text("identifier").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
});

// Define the Timesheet Entries table
export const timesheetEntries = pgTable("timesheet_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  workOrderId: integer("work_order_id").notNull().references(() => workOrders.id),
  date: timestamp("date").notNull(),
  hours: real("hours").notNull(),
  startTime: text("start_time"),  // Format: HH:MM (24-hour format)
  endTime: text("end_time"),      // Format: HH:MM (24-hour format)
  description: text("description"),
  breakTaken: boolean("break_taken").default(false),
  breakDuration: integer("break_duration"), // in minutes
  isLeave: boolean("is_leave").default(false),
  leaveType: text("leave_type"), // full-day, half-day, hours
  leaveHours: real("leave_hours"), // if leaveType is "hours"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimesheetEntrySchema = createInsertSchema(timesheetEntries).omit({
  id: true,
  createdAt: true,
});

// Define the Project Events table (for timeline)
export const EVENT_TYPE = {
  STATUS_CHANGE: "status_change",
  COMMENT: "comment",
  CREATED: "created",
} as const;

export type EventType = keyof typeof EVENT_TYPE;

export const projectEvents = pgTable("project_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  type: text("type").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProjectEventSchema = createInsertSchema(projectEvents).omit({
  id: true,
  createdAt: true,
});

// Define the Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;

export type TimesheetEntry = typeof timesheetEntries.$inferSelect;
export type InsertTimesheetEntry = z.infer<typeof insertTimesheetEntrySchema>;

export type ProjectEvent = typeof projectEvents.$inferSelect;
export type InsertProjectEvent = z.infer<typeof insertProjectEventSchema>;

// Audit Log Types
export const AUDIT_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RESTORE: 'restore',
} as const;

export const AUDIT_ENTITY = {
  PROJECT: 'project',
  WORK_ORDER: 'work_order',
  TIMESHEET: 'timesheet',
  PROJECT_EVENT: 'project_event',
} as const;

// Add soft delete columns to tables
export const softDeleteColumns = {
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by"),
};

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(),
  actionBy: integer("action_by").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
