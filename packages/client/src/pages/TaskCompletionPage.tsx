import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import taskService from '../services/taskService';

const TaskCompletionPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch task details
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId as string),
    enabled: !!taskId
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: () => taskService.updateTaskStatus(taskId as string, 'completed'),
    onSuccess: () => {
      navigate(`/tasks/${taskId}`);
    }
  });

  // Get upload URL mutation
  const getUploadUrlMutation = useMutation({
    mutationFn: async ({ filename, contentType }: { filename: string, contentType: string }) => {
      const response = await taskService.getMediaUploadUrl(
        taskId as string, 
        filename, 
        contentType
      );
      return response;
    }
  });

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const isImageOrVideo = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!isImageOrVideo) {
      setError('Please select an image or video file');
      return;
    }
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 50MB');
      return;
    }
    
    setSelectedFile(file);
    setIsVideo(file.type.startsWith('video/'));
    setError(null);
    
    // Create object URL for preview
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !taskId) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Step 1: Get presigned URL
      const { uploadUrl } = await getUploadUrlMutation.mutateAsync({
        filename: selectedFile.name,
        contentType: selectedFile.type
      });
      
      // Step 2: Upload file to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      });
      
      // Step 3: Mark task as completed
      await updateStatusMutation.mutateAsync();
      
      // Redirect to task details
      navigate(`/tasks/${taskId}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  };

  // Reset selected file
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          Task not found or you don't have permission to view it.
        </div>
        <div className="mt-4">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Complete Task</h1>
          <p className="mt-2 text-gray-600">
            Upload a photo or video as evidence that you've completed the task:
            <span className="font-medium ml-1">{task.title}</span>
          </p>
        </div>
        
        <div className="p-6">
          {/* Media preview */}
          {previewUrl && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Preview</h2>
              <div className="bg-gray-100 rounded-lg p-2 flex justify-center">
                {isVideo ? (
                  <video
                    src={previewUrl}
                    controls
                    className="max-h-96 rounded"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-96 rounded object-contain"
                  />
                )}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleReset}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
          
          {/* Upload controls */}
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mb-4 text-gray-700 text-center">
                Drag & drop your photo/video here, or click the buttons below
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Take Photo/Video
                </button>
                <label className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer">
                  Choose File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    capture="environment"
                  />
                </label>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Accepted formats: JPEG, PNG, GIF, MP4, MOV. Max size: 50MB.
              </p>
            </div>
          ) : (
            <div>
              {isUploading ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Please don't close this page while your evidence is being uploaded.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                  disabled={getUploadUrlMutation.isLoading || updateStatusMutation.isLoading}
                >
                  {getUploadUrlMutation.isLoading || updateStatusMutation.isLoading
                    ? 'Processing...'
                    : 'Complete Task & Upload Evidence'}
                </button>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <Link
              to={`/tasks/${taskId}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            
            <p className="text-sm text-gray-500 max-w-md">
              By uploading evidence, you confirm that you have completed this task as assigned.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionPage;