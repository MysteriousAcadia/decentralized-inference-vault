"use client";

import React from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useFileUpload, UploadedFile } from "@/hooks/useFileUpload";
import { formatFileSize } from "@/lib/upload-types";

interface FileUploaderProps {
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;
  selectedFile?: File | null;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export function FileUploader({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = ".pkl,.pt,.pth,.onnx,.h5,.hdf5,.pb,.tflite,.bin,.safetensors",
  maxSize = 10 * 1024 * 1024 * 1024, // 10GB
  disabled = false,
}: FileUploaderProps) {
  const validation = React.useMemo(
    () => ({
      maxSize,
      allowedTypes: ["application/octet-stream"] as string[],
      allowedExtensions: accept.split(","),
    }),
    [maxSize, accept]
  );

  const handleFileSelect = React.useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        onFileSelect?.(files[0]);
      }
    },
    [onFileSelect]
  );

  const fileUpload = useFileUpload({
    multiple: false,
    validation,
    onFileSelect: handleFileSelect,
  });

  const dragProps = fileUpload.getDragProps();
  const inputProps = fileUpload.getInputProps();

  const handleRemove = () => {
    fileUpload.clearFiles();
    onFileRemove?.();
  };

  // If a file is selected (either from fileUpload or passed as prop)
  const displayFile =
    selectedFile || (fileUpload.files.length > 0 ? fileUpload.files[0] : null);

  return (
    <div className="w-full">
      {!displayFile ? (
        // File picker area
        <div
          {...dragProps}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer
            ${
              fileUpload.isDragActive
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onClick={disabled ? undefined : fileUpload.openFilePicker}
        >
          <input {...inputProps} disabled={disabled} />

          <Upload
            className={`mx-auto h-12 w-12 ${
              fileUpload.isDragActive ? "text-indigo-500" : "text-gray-400"
            }`}
          />

          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {fileUpload.isDragActive
              ? "Drop your model here"
              : "Upload your AI model"}
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            {fileUpload.isDragActive
              ? "Release to upload your model file"
              : "Drag and drop your model file here, or click to browse"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Supports: {accept} (Max {formatFileSize(maxSize)})
          </p>

          {!fileUpload.isDragActive && (
            <button
              type="button"
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              disabled={disabled}
            >
              Choose File
            </button>
          )}
        </div>
      ) : (
        // Selected file display
        <FilePreview
          file={displayFile}
          onRemove={disabled ? undefined : handleRemove}
          showRemove={!disabled}
        />
      )}

      {/* Error display */}
      {fileUpload.files.length > 0 && fileUpload.files[0].error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">
              {fileUpload.files[0].error}
            </span>
          </div>
        </div>
      )}

      {/* Upload summary */}
      {fileUpload.summary.totalFiles > 0 && !fileUpload.summary.hasErrors && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              File ready for upload (
              {formatFileSize(fileUpload.summary.totalSize)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilePreviewProps {
  file: File | UploadedFile;
  onRemove?: () => void;
  showRemove?: boolean;
  showProgress?: boolean;
}

export function FilePreview({
  file,
  onRemove,
  showRemove = true,
  showProgress = false,
}: FilePreviewProps) {
  const isUploadedFile = (f: File | UploadedFile): f is UploadedFile => {
    return "id" in f;
  };

  const uploadedFile = isUploadedFile(file) ? file : null;
  const actualFile = isUploadedFile(file) ? file.file : file;

  const getStatusIcon = () => {
    if (!uploadedFile) return <FileText className="h-8 w-8 text-blue-600" />;

    switch (uploadedFile.status) {
      case "completed":
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case "error":
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      case "uploading":
        return <Upload className="h-8 w-8 text-indigo-600 animate-pulse" />;
      default:
        return <FileText className="h-8 w-8 text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    if (!uploadedFile) return "border-gray-200 bg-gray-50";

    switch (uploadedFile.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "uploading":
        return "border-indigo-200 bg-indigo-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-medium text-gray-900">{actualFile.name}</h4>
            <p className="text-sm text-gray-600">
              {formatFileSize(actualFile.size)}
              {uploadedFile?.status && (
                <span className="ml-2 capitalize">
                  • {uploadedFile.status.replace("-", " ")}
                </span>
              )}
            </p>
            {uploadedFile?.cid && (
              <p className="text-xs text-gray-500 font-mono">
                CID: {uploadedFile.cid}
              </p>
            )}
          </div>
        </div>

        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && uploadedFile && uploadedFile.status === "uploading" && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadedFile.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadedFile.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {uploadedFile?.error && (
        <div className="mt-2 text-sm text-red-600">{uploadedFile.error}</div>
      )}
    </div>
  );
}
