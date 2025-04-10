import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertWorkOrderSchema, 
  insertTimesheetEntrySchema, 
  insertProjectEventSchema, 
  PROJECT_STATUS,
  WORK_ORDER_TYPE
} from "@shared/schema";
import { format, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";

// Mock authenticated user (since we don't have auth)
const CURRENT_USER_ID = 1;

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Projects
  apiRouter.get("/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      
      // For each project, get the work orders and timesheet entries
      const projectsWithDetails = await Promise.all(
        projects.map(async (project) => {
          const workOrders = await storage.getWorkOrders(project.id);
          const timesheetEntries = await storage.getTimesheetEntriesByProject(project.id);
          
          // Calculate total hours for each work order type
          const validationWorkOrders = workOrders.filter(wo => wo.type === WORK_ORDER_TYPE.VALIDATION);
          const designWorkOrders = workOrders.filter(wo => wo.type === WORK_ORDER_TYPE.INTERNAL_DESIGN);
          
          const validationHours = validationWorkOrders.reduce((total, wo) => {
            const entries = timesheetEntries.filter(entry => entry.workOrderId === wo.id);
            return total + entries.reduce((sum, entry) => sum + entry.hours, 0);
          }, 0);
          
          const designHours = designWorkOrders.reduce((total, wo) => {
            const entries = timesheetEntries.filter(entry => entry.workOrderId === wo.id);
            return total + entries.reduce((sum, entry) => sum + entry.hours, 0);
          }, 0);
          
          return {
            ...project,
            workOrders,
            totalHours: validationHours + designHours,
            validationHours,
            designHours
          };
        })
      );
      
      res.json(projectsWithDetails);
    } catch (error) {
      console.error("Error getting projects:", error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });
  
  apiRouter.get("/projects/:id", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(Number(req.params.id));
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const workOrders = await storage.getWorkOrders(project.id);
      const events = await storage.getProjectEvents(project.id);
      const timesheetEntries = await storage.getTimesheetEntriesByProject(project.id);
      
      // Calculate total hours for each work order
      const workOrdersWithHours = await Promise.all(
        workOrders.map(async (workOrder) => {
          const entries = await storage.getTimesheetEntriesByWorkOrder(workOrder.id);
          const totalHours = entries.reduce((total, entry) => total + entry.hours, 0);
          
          return {
            ...workOrder,
            totalHours
          };
        })
      );
      
      res.json({
        ...project,
        workOrders: workOrdersWithHours,
        events,
        totalHours: timesheetEntries.reduce((sum, entry) => sum + entry.hours, 0)
      });
    } catch (error) {
      console.error("Error getting project:", error);
      res.status(500).json({ message: "Failed to get project" });
    }
  });
  
  apiRouter.post("/projects", async (req: Request, res: Response) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      
      // Create default work orders for the project
      const validationWorkOrder = await storage.createWorkOrder({
        projectId: project.id,
        type: WORK_ORDER_TYPE.VALIDATION,
        identifier: `VALID-${project.referenceNumber}`
      });
      
      const designWorkOrder = await storage.createWorkOrder({
        projectId: project.id,
        type: WORK_ORDER_TYPE.INTERNAL_DESIGN,
        identifier: `DESIGN-${project.referenceNumber}`
      });
      
      // Create project creation event
      await storage.createProjectEvent({
        projectId: project.id,
        type: 'created',
        content: `Project "${project.title}" created`,
        createdBy: CURRENT_USER_ID
      });
      
      res.status(201).json({
        ...project,
        workOrders: [validationWorkOrder, designWorkOrder]
      });
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project", error });
    }
  });
  
  apiRouter.put("/projects/:id", async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const validatedData = insertProjectSchema.partial().parse(req.body);
      
      // If status changed, create status change event
      if (validatedData.status && validatedData.status !== project.status) {
        await storage.createProjectEvent({
          projectId,
          type: 'status_change',
          content: `Status changed from "${project.status}" to "${validatedData.status}"`,
          createdBy: CURRENT_USER_ID
        });
      }
      
      const updatedProject = await storage.updateProject(projectId, validatedData);
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project", error });
    }
  });
  
  apiRouter.delete("/projects/:id", async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      await storage.deleteProject(projectId);
      
      res.status(200).json({ message: "Project successfully deleted" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project", error });
    }
  });
  
  // Bulk delete projects
  apiRouter.post("/projects/bulk-delete", async (req: Request, res: Response) => {
    try {
      const { projectIds } = req.body;
      
      if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
        return res.status(400).json({ message: "Project IDs are required" });
      }
      
      // Delete each project in the array
      for (const id of projectIds) {
        await storage.deleteProject(Number(id));
      }
      
      res.status(200).json({ message: `Successfully deleted ${projectIds.length} projects` });
    } catch (error) {
      console.error("Error deleting projects:", error);
      res.status(500).json({ message: "Failed to delete projects", error });
    }
  });
  
  apiRouter.get("/projects/:projectId/workorders", async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.projectId);
      const workOrders = await storage.getWorkOrders(projectId);
      
      // For each work order, get timesheet entries
      const workOrdersWithHours = await Promise.all(
        workOrders.map(async (workOrder) => {
          const entries = await storage.getTimesheetEntriesByWorkOrder(workOrder.id);
          const totalHours = entries.reduce((total, entry) => total + entry.hours, 0);
          
          return {
            ...workOrder,
            totalHours
          };
        })
      );
      
      res.json(workOrdersWithHours);
    } catch (error) {
      console.error("Error getting work orders:", error);
      res.status(500).json({ message: "Failed to get work orders" });
    }
  });
  
  // Timesheet routes
  apiRouter.get("/timesheet", async (req: Request, res: Response) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      const entries = await storage.getTimesheetEntries(CURRENT_USER_ID, startDate, endDate);
      
      // Enrich entries with work order and project details
      const enrichedEntries = await Promise.all(
        entries.map(async (entry) => {
          const workOrder = await storage.getWorkOrder(entry.workOrderId);
          return {
            ...entry,
            workOrder
          };
        })
      );
      
      res.json(enrichedEntries);
    } catch (error) {
      console.error("Error fetching timesheet entries:", error);
      res.status(500).json({ message: "Failed to fetch timesheet entries", error });
    }
  });
  
  apiRouter.post("/timesheet", async (req: Request, res: Response) => {
    try {
      // Add user ID to entry
      // Convert date string to Date object if needed
      const entryData = {
        ...req.body,
        userId: CURRENT_USER_ID,
        date: req.body.date ? new Date(req.body.date) : new Date(), // Ensure date is a proper Date object
      };
      
      // Validate data
      const validatedData = insertTimesheetEntrySchema.parse(entryData);
      
      // Create entry
      const entry = await storage.createTimesheetEntry(validatedData);
      
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating timesheet entry:", error);
      res.status(400).json({ message: "Failed to create timesheet entry", error });
    }
  });
  
  apiRouter.put("/timesheet/:id", async (req: Request, res: Response) => {
    try {
      const entryId = Number(req.params.id);
      
      // Add user ID to entry
      const entryData = {
        ...req.body,
        userId: CURRENT_USER_ID,
        date: req.body.date ? new Date(req.body.date) : undefined, // Convert date string to Date object if provided
      };
      
      // Update entry
      const entry = await storage.updateTimesheetEntry(entryId, entryData);
      
      res.json(entry);
    } catch (error) {
      console.error("Error updating timesheet entry:", error);
      res.status(400).json({ message: "Failed to update timesheet entry", error });
    }
  });
  
  apiRouter.delete("/timesheet/:id", async (req: Request, res: Response) => {
    try {
      const entryId = Number(req.params.id);
      
      await storage.deleteTimesheetEntry(entryId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting timesheet entry:", error);
      res.status(400).json({ message: "Failed to delete timesheet entry", error });
    }
  });
  
  // Timesheet analysis for smart suggestions
  apiRouter.get("/timesheet/analysis", async (req: Request, res: Response) => {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      // Get timesheet entries in the date range
      const entries = await storage.getTimesheetEntries(CURRENT_USER_ID, startDate, endDate);
      
      // Enrich entries with work order and project details
      const enrichedEntries = await Promise.all(
        entries.map(async (entry) => {
          const workOrder = await storage.getWorkOrder(entry.workOrderId);
          if (workOrder) {
            const project = await storage.getProject(workOrder.projectId);
            return {
              ...entry,
              workOrder: {
                ...workOrder,
                project
              }
            };
          }
          return entry;
        })
      );
      
      res.json(enrichedEntries);
    } catch (error) {
      console.error("Error analyzing timesheet entries:", error);
      res.status(500).json({ message: "Failed to analyze timesheet entries", error });
    }
  });
  
  apiRouter.get("/projects/:projectId/events", async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.projectId);
      const events = await storage.getProjectEvents(projectId);
      
      res.json(events);
    } catch (error) {
      console.error("Error getting project events:", error);
      res.status(500).json({ message: "Failed to get project events" });
    }
  });
  
  apiRouter.post("/projects/:projectId/events", async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.projectId);
      
      const eventData = {
        ...req.body,
        projectId,
        createdBy: CURRENT_USER_ID
      };
      
      const validatedData = insertProjectEventSchema.parse(eventData);
      const event = await storage.createProjectEvent(validatedData);
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating project event:", error);
      res.status(400).json({ message: "Failed to create project event", error });
    }
  });
  
  apiRouter.get("/reports/summary", async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
      
      // Get projects
      const projects = await storage.getProjects();
      const activeProjects = projects.filter(p => p.status === 'in_progress').length;
      
      // Get timesheet entries for the current week
      const weeklyEntries = await storage.getTimesheetEntries(CURRENT_USER_ID, weekStart, weekEnd);
      const weeklyHours = weeklyEntries.reduce((total, entry) => total + entry.hours, 0);
      
      // Calculate validation vs design hours
      let validationHours = 0;
      let designHours = 0;
      
      for (const entry of weeklyEntries) {
        const workOrder = await storage.getWorkOrder(entry.workOrderId);
        if (workOrder && workOrder.type === WORK_ORDER_TYPE.VALIDATION) {
          validationHours += entry.hours;
        } else if (workOrder && workOrder.type === WORK_ORDER_TYPE.INTERNAL_DESIGN) {
          designHours += entry.hours;
        }
      }
      
      res.json({
        weeklyHours,
        activeProjects,
        validationHours,
        designHours,
        totalProjects: projects.length
      });
    } catch (error) {
      console.error("Error generating summary report:", error);
      res.status(500).json({ message: "Failed to generate summary report" });
    }
  });
  
  async function initializeData() {
    // Check if we have existing data
    const existingProjects = await storage.getProjects();
    
    if (existingProjects.length === 0) {
      console.log("Initializing sample data...");
      
      // Create a sample project
      const project = await storage.createProject({
        title: "North Metro Upgrade",
        referenceNumber: "WP-2023-0001",
        formCodeType: "NM-DES-2023",
        status: "in_progress",
        notes: "Distribution network upgrade for the northern metropolitan area."
      });
      
      // Create work orders
      const validationWO = await storage.createWorkOrder({
        projectId: project.id,
        type: WORK_ORDER_TYPE.VALIDATION,
        identifier: `VALID-${project.referenceNumber}`
      });
      
      const designWO = await storage.createWorkOrder({
        projectId: project.id,
        type: WORK_ORDER_TYPE.INTERNAL_DESIGN,
        identifier: `DESIGN-${project.referenceNumber}`
      });
      
      // Create some timesheet entries for this week
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      
      await storage.createTimesheetEntry({
        userId: CURRENT_USER_ID,
        workOrderId: validationWO.id,
        date: addDays(weekStart, 0), // Monday
        hours: 2,
        startTime: "09:00",
        endTime: "11:00",
        description: "Site verification and requirements gathering"
      });
      
      await storage.createTimesheetEntry({
        userId: CURRENT_USER_ID,
        workOrderId: designWO.id,
        date: addDays(weekStart, 0), // Monday
        hours: 3,
        startTime: "13:00",
        endTime: "16:00",
        description: "Initial design sketches and planning"
      });
      
      await storage.createTimesheetEntry({
        userId: CURRENT_USER_ID,
        workOrderId: validationWO.id,
        date: addDays(weekStart, 1), // Tuesday
        hours: 1,
        startTime: "10:00",
        endTime: "11:00",
        description: "Client requirements review meeting"
      });
      
      await storage.createTimesheetEntry({
        userId: CURRENT_USER_ID,
        workOrderId: designWO.id,
        date: addDays(weekStart, 1), // Tuesday
        hours: 2,
        startTime: "13:00",
        endTime: "15:00",
        description: "Network layout design"
      });
      
      // Add events
      await storage.createProjectEvent({
        projectId: project.id,
        type: "created",
        content: "Project created",
        createdBy: CURRENT_USER_ID
      });
      
      await storage.createProjectEvent({
        projectId: project.id,
        type: "status_change",
        content: "Status changed from 'draft' to 'in_progress'",
        createdBy: CURRENT_USER_ID
      });
      
      await storage.createProjectEvent({
        projectId: project.id,
        type: "comment",
        content: "Client requested expedited timeline for northern section",
        createdBy: CURRENT_USER_ID
      });
      
      console.log("Sample data initialization complete");
    }
  }
  
  // Mount API routes
  app.use("/api", apiRouter);
  
  // Create and configure HTTP server
  const server = createServer(app);
  
  // Initialize sample data
  await initializeData();
  
  // Restore deleted items
  apiRouter.post("/restore/:type/:id", async (req: Request, res: Response) => {
    try {
      const { type, id } = req.params;
      const numericId = Number(id);
      
      switch(type) {
        case 'timesheet':
          await storage.restoreTimesheetEntry(numericId, CURRENT_USER_ID);
          break;
        case 'project':
          await storage.restoreProject(numericId, CURRENT_USER_ID);
          break;
        default:
          return res.status(400).json({ message: "Invalid type" });
      }
      
      res.json({ message: "Item restored successfully" });
    } catch (error) {
      console.error("Error restoring item:", error);
      res.status(500).json({ message: "Failed to restore item" });
    }
  });

  // Get audit logs with filtering
  apiRouter.get("/audit-logs", async (req: Request, res: Response) => {
    try {
      const { entityType, action, startDate, endDate } = req.query;
      const filters = {
        entityType: entityType as string,
        action: action as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };
      
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  return server;
}
