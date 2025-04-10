import {
  User,
  InsertUser,
  Project,
  InsertProject,
  WorkOrder,
  InsertWorkOrder,
  TimesheetEntry,
  InsertTimesheetEntry,
  ProjectEvent,
  InsertProjectEvent,
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectByReference(referenceNumber: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Work Order operations
  getWorkOrders(projectId: number): Promise<WorkOrder[]>;
  getWorkOrder(id: number): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  
  // Timesheet operations
  getTimesheetEntries(userId: number, startDate: Date, endDate: Date): Promise<TimesheetEntry[]>;
  getTimesheetEntriesByProject(projectId: number): Promise<TimesheetEntry[]>;
  getTimesheetEntriesByWorkOrder(workOrderId: number): Promise<TimesheetEntry[]>;
  createTimesheetEntry(entry: InsertTimesheetEntry): Promise<TimesheetEntry>;
  updateTimesheetEntry(id: number, entry: Partial<InsertTimesheetEntry>): Promise<TimesheetEntry>;
  deleteTimesheetEntry(id: number): Promise<void>;
  
  // Project Events operations
  getProjectEvents(projectId: number): Promise<ProjectEvent[]>;
  createProjectEvent(event: InsertProjectEvent): Promise<ProjectEvent>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private workOrders: Map<number, WorkOrder>;
  private timesheetEntries: Map<number, TimesheetEntry>;
  private projectEvents: Map<number, ProjectEvent>;
  
  private userId: number;
  private projectId: number;
  private workOrderId: number;
  private timesheetEntryId: number;
  private projectEventId: number;
  private auditLogId: number;
  private deletedItems: Map<string, Map<number, any>>;
  
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.workOrders = new Map();
    this.timesheetEntries = new Map();
    this.projectEvents = new Map();
    
    this.userId = 1;
    this.projectId = 1;
    this.workOrderId = 1;
    this.timesheetEntryId = 1;
    this.projectEventId = 1;
    this.auditLogId = 1;
    
    // Storage for soft deleted items
    this.deletedItems = new Map();
    this.deletedItems.set('projects', new Map());
    this.deletedItems.set('timesheetEntries', new Map());
    this.deletedItems.set('workOrders', new Map());
    
    // Add a default user
    this.createUser({
      name: "Sarah Johnson",
      username: "sarah.johnson",
      password: "password123",
      role: "engineer",
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Project methods
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectByReference(referenceNumber: string): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(
      project => project.referenceNumber === referenceNumber
    );
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const newProject = { 
      ...project, 
      id, 
      createdAt: new Date() 
    };
    this.projects.set(id, newProject);
    
    // Create a project created event
    await this.createProjectEvent({
      projectId: id,
      type: "created",
      content: "Project created",
      createdBy: 1, // Default user
    });
    
    return newProject;
  }
  
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const existingProject = this.projects.get(id);
    if (!existingProject) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    const updatedProject = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    
    // If status is updated, create a status change event
    if (project.status && project.status !== existingProject.status) {
      await this.createProjectEvent({
        projectId: id,
        type: "status_change",
        content: `Status changed to: ${project.status}`,
        createdBy: 1, // Default user
      });
    }
    
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<void> {
    const existingProject = this.projects.get(id);
    if (!existingProject) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    // Get all work orders for this project
    const workOrders = await this.getWorkOrders(id);
    
    // Delete all timesheet entries for each work order
    for (const workOrder of workOrders) {
      // Get all timesheet entries before deleting
      const entries = Array.from(this.timesheetEntries.values())
        .filter(entry => entry.workOrderId === workOrder.id);
      
      // Delete each timesheet entry
      for (const entry of entries) {
        this.timesheetEntries.delete(entry.id);
      }
      
      // Delete the work order
      this.workOrders.delete(workOrder.id);
    }
    
    // Delete all project events
    const events = await this.getProjectEvents(id);
    for (const event of events) {
      this.projectEvents.delete(event.id);
    }
    
    // Finally, delete the project
    this.projects.delete(id);
  }
  
  // Work Order methods
  async getWorkOrders(projectId: number): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values()).filter(
      workOrder => workOrder.projectId === projectId
    );
  }
  
  async getWorkOrder(id: number): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }
  
  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = this.workOrderId++;
    const newWorkOrder = {
      ...workOrder,
      id,
      createdAt: new Date(),
    };
    this.workOrders.set(id, newWorkOrder);
    return newWorkOrder;
  }
  
  // Timesheet methods
  async getTimesheetEntries(userId: number, startDate: Date, endDate: Date): Promise<TimesheetEntry[]> {
    return Array.from(this.timesheetEntries.values()).filter(
      entry => entry.userId === userId && 
               entry.date >= startDate && 
               entry.date <= endDate
    );
  }
  
  async getTimesheetEntriesByProject(projectId: number): Promise<TimesheetEntry[]> {
    // Get work orders for this project
    const workOrders = await this.getWorkOrders(projectId);
    const workOrderIds = workOrders.map(wo => wo.id);
    
    // Get timesheet entries for these work orders
    return Array.from(this.timesheetEntries.values()).filter(
      entry => workOrderIds.includes(entry.workOrderId)
    );
  }
  
  async getTimesheetEntriesByWorkOrder(workOrderId: number): Promise<TimesheetEntry[]> {
    return Array.from(this.timesheetEntries.values()).filter(
      entry => entry.workOrderId === workOrderId
    );
  }
  
  async createTimesheetEntry(entry: InsertTimesheetEntry): Promise<TimesheetEntry> {
    const id = this.timesheetEntryId++;
    const newEntry = {
      ...entry,
      id,
      createdAt: new Date(),
    };
    this.timesheetEntries.set(id, newEntry);
    return newEntry;
  }
  
  async updateTimesheetEntry(id: number, entry: Partial<InsertTimesheetEntry>): Promise<TimesheetEntry> {
    const existingEntry = this.timesheetEntries.get(id);
    if (!existingEntry) {
      throw new Error(`Timesheet entry with id ${id} not found`);
    }
    
    const updatedEntry = { ...existingEntry, ...entry };
    this.timesheetEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  private async createAuditLog(entityType: string, entityId: number, action: string, actionBy: number, details?: string): Promise<void> {
    const id = this.auditLogId++;
    const log = {
      id,
      entityType,
      entityId,
      action,
      actionBy,
      details,
      createdAt: new Date()
    };
    
    // In a real DB this would be a separate table
    // For our in-memory store we'll keep it simple
    if (!this.auditLogs) {
      this.auditLogs = new Map();
    }
    this.auditLogs.set(id, log);
  }

  async getAuditLogs(filters?: { entityType?: string; action?: string; startDate?: Date; endDate?: Date }): Promise<any[]> {
    let logs = Array.from(this.auditLogs.values());
    
    if (filters) {
      if (filters.entityType) {
        logs = logs.filter(log => log.entityType === filters.entityType);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.createdAt >= filters.startDate);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.createdAt <= filters.endDate);
      }
    }
    
    return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteTimesheetEntry(id: number, userId: number): Promise<void> {
    const entry = this.timesheetEntries.get(id);
    if (entry) {
      // Move to deleted items
      this.deletedItems.get('timesheetEntries')!.set(id, {...entry, deletedAt: new Date(), deletedBy: userId});
      this.timesheetEntries.delete(id);
      
      // Create audit log
      await this.createAuditLog('timesheet', id, 'delete', userId);
    }
  }

  async restoreTimesheetEntry(id: number, userId: number): Promise<void> {
    const deletedEntry = this.deletedItems.get('timesheetEntries')!.get(id);
    if (deletedEntry) {
      const {deletedAt, deletedBy, ...entry} = deletedEntry;
      this.timesheetEntries.set(id, entry);
      this.deletedItems.get('timesheetEntries')!.delete(id);
      
      // Create audit log
      await this.createAuditLog('timesheet', id, 'restore', userId);
    }
  }
  
  // Project Events methods
  async getProjectEvents(projectId: number): Promise<ProjectEvent[]> {
    return Array.from(this.projectEvents.values())
      .filter(event => event.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createProjectEvent(event: InsertProjectEvent): Promise<ProjectEvent> {
    const id = this.projectEventId++;
    const newEvent = {
      ...event,
      id,
      createdAt: new Date(),
    };
    this.projectEvents.set(id, newEvent);
    return newEvent;
  }
}

// Create and export the storage instance
export const storage = new MemStorage();
