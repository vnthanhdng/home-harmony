import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import crypto from "crypto";
import { z } from "zod";

const prisma = new PrismaClient();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z
    .string()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  unitId: z.string().min(1, "Unit ID is required"),
  assigneeId: z.string().optional(),
});

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Assuming auth middleware sets req.user

    // Validate request body
    const validatedData = createTaskSchema.parse(req.body);

    // Check if user is a member of the unit
    const unitMember = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: userId,
          unitId: validatedData.unitId,
        },
      },
    });

    if (!unitMember) {
      return res
        .status(403)
        .json({ message: "User is not a member of this unit" });
    }

    // If assigneeId is provided, verify they are in the unit
    if (validatedData.assigneeId) {
      const assigneeMember = await prisma.unitMember.findUnique({
        where: {
          userId_unitId: {
            userId: validatedData.assigneeId,
            unitId: validatedData.unitId,
          },
        },
      });

      if (!assigneeMember) {
        return res
          .status(400)
          .json({ message: "Assignee is not a member of this unit" });
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate,
        status: "pending",
        creatorId: userId,
        assigneeId: validatedData.assigneeId,
        unitId: validatedData.unitId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
};

// Get all tasks for a unit
export const getUnitTasks = async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of the unit
    const unitMember = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: userId,
          unitId: unitId,
        },
      },
    });

    if (!unitMember) {
      return res
        .status(403)
        .json({ message: "User is not a member of this unit" });
    }

    // Get all tasks for the unit
    const tasks = await prisma.task.findMany({
      where: {
        unitId: unitId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
        completionMedia: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

// Get a specific task
export const getTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
        unit: true,
        completionMedia: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify user is a member of the unit
    const unitMember = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: userId,
          unitId: task.unitId,
        },
      },
    });

    if (!unitMember) {
      return res
        .status(403)
        .json({ message: "User is not authorized to view this task" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

// Update task status
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!["pending", "inProgress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check user permission (creator, assignee, or admin)
    const unitMember = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: userId,
          unitId: task.unitId,
        },
      },
    });

    if (!unitMember) {
      return res
        .status(403)
        .json({ message: "User is not authorized to update this task" });
    }

    // Only assignee or admin can mark as completed
    if (
      status === "completed" &&
      task.assigneeId !== userId &&
      unitMember.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only the assigned user or admin can mark a task as completed",
      });
    }

    // Update the task status
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: status,
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Failed to update task status" });
  }
};

// Assign a task to a user
export const assignTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { assigneeId } = req.body;
    const userId = req.user.id;

    if (!assigneeId) {
      return res.status(400).json({ message: "Assignee ID is required" });
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user can modify this task (creator or admin)
    const userMember = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: userId,
          unitId: task.unitId,
        },
      },
    });

    if (
      !userMember ||
      (task.creatorId !== userId && userMember.role !== "admin")
    ) {
      return res.status(403).json({
        message: "Only the task creator or admin can assign tasks",
      });
    }

    // Check if assignee is a member of the unit
    const assigneeMember = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: assigneeId,
          unitId: task.unitId,
        },
      },
    });

    if (!assigneeMember) {
      return res.status(400).json({
        message: "Assignee is not a member of this unit",
      });
    }

    // Update the task
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        assigneeId: assigneeId,
        // If the task was previously completed, set it back to inProgress
        status: task.status === "completed" ? "inProgress" : task.status,
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error("Error assigning task:", error);
    res.status(500).json({ message: "Failed to assign task" });
  }
};

// Generate a presigned URL for media upload
export const getMediaUploadUrl = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { filename, contentType } = req.body;
    const userId = req.user.id;

    if (!filename || !contentType) {
      return res
        .status(400)
        .json({ message: "Filename and content type are required" });
    }

    // Check if file type is allowed
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ message: "File type not allowed" });
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Verify user is task assignee
    if (task.assigneeId !== userId) {
      return res.status(403).json({
        message: "Only the assigned user can upload completion media",
      });
    }

    // Generate unique filename
    const fileKey = `tasks/${taskId}/${crypto.randomUUID()}-${filename}`;
    const fileType = contentType.startsWith("image/") ? "image" : "video";

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    // Create media item record (will be completed after upload)
    const mediaItem = await prisma.mediaItem.create({
      data: {
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
        type: fileType,
        filename: filename,
        mimeType: contentType,
        size: 0, // Will be updated after upload
        taskId: taskId,
      },
    });

    // Update task status to completed
    await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: "completed",
      },
    });

    res.json({
      uploadUrl,
      mediaId: mediaItem.id,
      fileUrl: mediaItem.url,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get the task
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        completionMedia: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user can delete this task (creator or admin)
    const userMember = await prisma.unitMember.findUnique({
      where: {
        userId_unitId: {
          userId: userId,
          unitId: task.unitId,
        },
      },
    });

    if (
      !userMember ||
      (task.creatorId !== userId && userMember.role !== "admin")
    ) {
      return res.status(403).json({
        message: "Only the task creator or admin can delete tasks",
      });
    }

    // Delete associated media items first (cascade isn't enough for S3)
    if (task.completionMedia.length > 0) {
      // You would also delete the files from S3 here
      await prisma.mediaItem.deleteMany({
        where: {
          taskId: taskId,
        },
      });
    }

    // Delete the task
    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
};
