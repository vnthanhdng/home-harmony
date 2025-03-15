import apiClient from './api';

// Types
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'inProgress' | 'completed';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  assigneeId: string | null;
  unitId: string;
  creator?: {
    id: string;
    username: string;
  };
  assignee?: {
    id: string;
    username: string;
  } | null;
  completionMedia?: Array<{
    id: string;
    url: string;
    type: 'image' | 'video';
    filename: string;
    createdAt: string;
  }>;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate?: string;
  unitId: string;
  assigneeId?: string;
}

export interface TaskMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  createdAt: string;
  taskId: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  mediaId: string;
  fileUrl: string;
}

// API functions
const taskService = {
  // Get all tasks for a unit
  getUnitTasks: async (unitId: string): Promise<Task[]> => {
    const response = await apiClient.get<{ data: Task[] }>(`/tasks/unit/${unitId}`);
    return response.data || [];
  },

  // Get a specific task
  getTask: async (taskId: string): Promise<Task> => {
    const response = await apiClient.get<{ data: Task }>(`/tasks/${taskId}`);
    return response.data;
  },

  // Create a new task
  createTask: async (taskData: CreateTaskData): Promise<Task> => {
    const response = await apiClient.post<{ data: Task, message: string }>('/tasks', taskData);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (taskId: string, status: string): Promise<Task> => {
    const response = await apiClient.patch<{ data: Task, message: string }>(
      `/tasks/${taskId}/status`, 
      { status }
    );
    return response.data;
  },

  // Assign task to user
  assignTask: async (taskId: string, assigneeId: string): Promise<Task> => {
    const response = await apiClient.patch<{ data: Task, message: string }>(
      `/tasks/${taskId}/assign`, 
      { assigneeId }
    );
    return response.data;
  },

  // Update task details
  updateTask: async (taskId: string, taskData: Partial<CreateTaskData>): Promise<Task> => {
    const response = await apiClient.put<{ data: Task, message: string }>(
      `/tasks/${taskId}`, 
      taskData
    );
    return response.data;
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<void> => {
    await apiClient.delete<{ message: string }>(`/tasks/${taskId}`);
  },

  // Get presigned URL for media upload
  getMediaUploadUrl: async (
    taskId: string, 
    filename: string, 
    contentType: string
  ): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<{ data: UploadUrlResponse, message: string }>(
      `/tasks/${taskId}/media-upload-url`,
      { filename, contentType }
    );
    return response.data;
  },

  // Get task statistics for a unit
  getUnitTaskStats: async (unitId: string): Promise<any> => {
    const response = await apiClient.get<{ data: any }>(`/tasks/unit/${unitId}/stats`);
    return response.data;
  },

  // Get tasks assigned to current user
  getUserTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<{ data: Task[] }>('/tasks/me');
    return response.data || [];
  },

  // Get tasks created by current user
  getCreatedTasks: async (): Promise<Task[]> => {
    const response = await apiClient.get<{ data: Task[] }>('/tasks/created');
    return response.data || [];
  },

  // Get recent activity (completed tasks) for a unit
  getRecentActivity: async (unitId: string, limit = 5): Promise<Task[]> => {
    const response = await apiClient.get<{ data: Task[] }>(
      `/tasks/unit/${unitId}/recent?limit=${limit}`
    );
    return response.data || [];
  }
};

export default taskService;