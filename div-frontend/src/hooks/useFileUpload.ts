"use client";

import { useState, useCallback, useRef } from "react";

export interface FileValidationRules {
  maxSize: number; // in bytes
  allowedTypes: string[]; // MIME types or file extensions
  allowedExtensions: string[];
}

export interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string; // for image files
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  cid?: string; // Lighthouse CID after upload
}

export interface FileUploadOptions {
  multiple?: boolean;
  validation?: FileValidationRules;
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  onUploadComplete?: (fileId: string, cid: string) => void;
  onUploadError?: (fileId: string, error: string) => void;
}

// Default validation rules for AI model files
export const DEFAULT_MODEL_VALIDATION: FileValidationRules = {
  maxSize: 10 * 1024 * 1024 * 1024, // 10GB
  allowedTypes: [
    "application/octet-stream",
    "application/x-pickle",
    "application/x-pytorch",
    "application/x-onnx",
    "application/x-hdf",
  ],
  allowedExtensions: [
    ".pkl",
    ".pt",
    ".pth",
    ".onnx",
    ".h5",
    ".hdf5",
    ".pb",
    ".tflite",
    ".bin",
    ".safetensors",
  ],
};

export function useFileUpload(options: FileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validation = options.validation || DEFAULT_MODEL_VALIDATION;

  // Generate unique file ID
  const generateFileId = useCallback(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);

  // Validate a single file
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > validation.maxSize) {
        const maxSizeMB = validation.maxSize / (1024 * 1024);
        return `File size exceeds ${maxSizeMB}MB limit`;
      }

      // Check file extension
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validation.allowedExtensions.some((ext) =>
        fileName.endsWith(ext.toLowerCase())
      );

      if (!hasValidExtension) {
        return `File type not supported. Allowed types: ${validation.allowedExtensions.join(
          ", "
        )}`;
      }

      return null; // Valid file
    },
    [validation]
  );

  // Convert File to UploadedFile
  const processFiles = useCallback(
    async (fileList: FileList | File[]): Promise<UploadedFile[]> => {
      const filesArray = Array.from(fileList);
      const processedFiles: UploadedFile[] = [];

      for (const file of filesArray) {
        const validationError = validateFile(file);
        const fileId = generateFileId();

        let preview: string | undefined;
        // Generate preview for image files (if needed for model thumbnails)
        if (file.type.startsWith("image/")) {
          preview = URL.createObjectURL(file);
        }

        processedFiles.push({
          file,
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          status: validationError ? "error" : "pending",
          progress: 0,
          error: validationError || undefined,
        });
      }

      return processedFiles;
    },
    [validateFile, generateFileId]
  );

  // Add files to the upload queue
  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const processedFiles = await processFiles(newFiles);

      if (options.multiple) {
        setFiles((prev) => [...prev, ...processedFiles]);
      } else {
        // Replace existing files for single file upload
        setFiles(processedFiles);
      }

      const validFiles = processedFiles
        .filter((f) => f.status !== "error")
        .map((f) => f.file);

      options.onFileSelect?.(validFiles);
    },
    [processFiles, options]
  );

  // Remove a file from the queue
  const removeFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => {
        const file = prev.find((f) => f.id === fileId);
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
        return prev.filter((f) => f.id !== fileId);
      });
      options.onFileRemove?.(fileId);
    },
    [options]
  );

  // Update file status and progress
  const updateFileStatus = useCallback(
    (
      fileId: string,
      updates: Partial<
        Pick<UploadedFile, "status" | "progress" | "error" | "cid">
      >
    ) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, ...updates } : file
        )
      );

      if (updates.progress !== undefined) {
        options.onUploadProgress?.(fileId, updates.progress);
      }

      if (updates.status === "completed" && updates.cid) {
        options.onUploadComplete?.(fileId, updates.cid);
      }

      if (updates.status === "error" && updates.error) {
        options.onUploadError?.(fileId, updates.error);
      }
    },
    [options]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      dragCounter.current = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        // Reset input value to allow same file selection again
        e.target.value = "";
      }
    },
    [addFiles]
  );

  // Trigger file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  }, [files]);

  // Get drag and drop props for easy integration
  const getDragProps = useCallback(
    () => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]
  );

  // Get file input props
  const getInputProps = useCallback(
    () => ({
      ref: fileInputRef,
      type: "file" as const,
      onChange: handleFileInputChange,
      multiple: options.multiple || false,
      accept: validation.allowedExtensions.join(","),
      style: { display: "none" },
    }),
    [handleFileInputChange, options.multiple, validation.allowedExtensions]
  );

  // Calculate summary statistics
  const summary = {
    totalFiles: files.length,
    validFiles: files.filter((f) => f.status !== "error").length,
    totalSize: files.reduce((acc, file) => acc + file.size, 0),
    completedFiles: files.filter((f) => f.status === "completed").length,
    uploadingFiles: files.filter((f) => f.status === "uploading").length,
    errorFiles: files.filter((f) => f.status === "error").length,
    allCompleted:
      files.length > 0 && files.every((f) => f.status === "completed"),
    hasErrors: files.some((f) => f.status === "error"),
  };

  return {
    // State
    files,
    isDragActive,
    summary,

    // Actions
    addFiles,
    removeFile,
    updateFileStatus,
    openFilePicker,
    clearFiles,

    // Props for components
    getDragProps,
    getInputProps,

    // Utilities
    validateFile,
    processFiles,
  };
}
