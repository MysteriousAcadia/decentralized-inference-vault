"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useModelUpload } from "@/hooks/useModelUpload";
import { ModelMetadataForm } from "@/components/upload/metadata-form";
import { AccessConfigForm } from "@/components/upload/access-config-form";
import { DeploymentConfigForm } from "@/components/upload/deployment-config-form";
import { UploadProgress } from "@/components/upload/upload-progress";

export default function UploadPage() {
  const { isConnected } = useAccount();
  const upload = useModelUpload();

  // Auto-update metadata name when file is selected
  useEffect(() => {
    if (upload.selectedFile && !upload.metadata.name) {
      const nameWithoutExtension = upload.selectedFile.name.replace(
        /\.[^/.]+$/,
        ""
      );
      upload.updateMetadata({ name: nameWithoutExtension });
    }
  }, [upload.selectedFile, upload.metadata.name, upload.updateMetadata]); // eslint-disable-line react-hooks/exhaustive-deps
  console.log(upload.selectedFile);
  const handleNext = useCallback(() => {
    if (upload.validateCurrentStep()) {
      upload.nextStep();
    }
  }, [upload.validateCurrentStep, upload.nextStep]);

  const handleStartUpload = useCallback(async () => {
    try {
      await upload.startUpload();
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }, [upload.startUpload]);

  const handleRetry = useCallback(() => {
    upload.resetUpload();
    upload.goToStep(1);
  }, [upload.resetUpload, upload.goToStep]);

  // Wallet connection check
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 mb-8">
              You need to connect your wallet to upload and deploy AI models to
              the marketplace.
            </p>
            <ConnectButton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 text-gray-900 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload AI Model</h1>
          <p className="mt-2 text-gray-600">
            Deploy your AI model to the decentralized marketplace and monetize
            through DAO tokens
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? "flex-1" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    upload.currentStep === step
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : upload.getStepProgress(step) === 100
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-300 bg-white text-gray-800"
                  }`}
                >
                  {upload.getStepProgress(step) === 100 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-semibold">{step}</span>
                  )}
                </div>

                {step < 3 && (
                  <div
                    className={`flex-1 ml-4 mr-4 h-0.5 ${
                      upload.getStepProgress(step) === 100
                        ? "bg-green-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between text-sm text-gray-600">
            <span>Model Upload</span>
            <span>Access Control</span>
            <span>Deploy</span>
          </div>
        </div>

        {/* Step Content */}
        {upload.currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-semibold text-white">1</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Model File & Metadata
              </h2>
            </div>

            <div className="space-y-8">
              {/* File Upload Area */}
              <div
                {...upload.fileUpload.getDragProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  upload.fileUpload.isDragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${
                  upload.isUploading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {upload.selectedFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="h-8 w-8 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {upload.selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(upload.selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        upload.fileUpload.clearFiles();
                      }}
                      disabled={upload.isUploading}
                      className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="mt-4">
                      <input
                        {...upload.fileUpload.getInputProps()}
                        className="sr-only"
                        disabled={upload.isUploading}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {upload.fileUpload.isDragActive
                            ? "Drop your model file here"
                            : "Drag & drop your model file here, or click to browse"}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          Supports Python files (.py), Jupyter notebooks
                          (.ipynb), and archives (.zip, .tar.gz)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <ModelMetadataForm
                metadata={upload.metadata}
                onChange={upload.updateMetadata}
                errors={upload.errors}
                disabled={upload.isUploading}
              />
            </div>
          </div>
        )}

        {upload.currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-semibold text-white">2</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Configure Access Control
              </h2>
            </div>

            <AccessConfigForm
              config={upload.accessConfig}
              onChange={upload.updateAccessConfig}
              errors={upload.errors}
              disabled={upload.isUploading}
            />
          </div>
        )}

        {upload.currentStep === 3 && !upload.isUploading && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-semibold text-white">3</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Deploy to Marketplace
              </h2>
            </div>

            <DeploymentConfigForm
              config={upload.deploymentConfig}
              onChange={upload.updateDeploymentConfig}
              errors={upload.errors}
              fileSize={upload.selectedFile?.size}
              disabled={upload.isUploading}
            />
          </div>
        )}

        {/* Upload Progress */}
        {(upload.isUploading ||
          upload.status === "completed" ||
          upload.status === "error") && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <UploadProgress state={upload} onRetry={handleRetry} />
          </div>
        )}

        {/* Navigation */}
        {!upload.isUploading && upload.status !== "completed" && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={upload.prevStep}
              disabled={upload.currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex gap-3">
              {upload.currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleStartUpload}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deploy Model
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
