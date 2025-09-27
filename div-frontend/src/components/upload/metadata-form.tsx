"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import {
  ModelMetadata,
  MODEL_CATEGORIES,
  MODEL_FRAMEWORKS,
} from "@/lib/upload-types";

interface ModelMetadataFormProps {
  metadata: ModelMetadata;
  onChange: (metadata: Partial<ModelMetadata>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function ModelMetadataForm({
  metadata,
  onChange,
  errors,
  disabled = false,
}: ModelMetadataFormProps) {
  const handleChange = React.useCallback(
    (field: keyof ModelMetadata) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        onChange({ [field]: e.target.value });
      },
    [onChange]
  );

  const handleTagsChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const tags = e.target.value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      onChange({ tags });
    },
    [onChange]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Model Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name *
            </label>
            <input
              type="text"
              value={metadata.name}
              onChange={handleChange("name")}
              placeholder="e.g., GPT-4 Alternative"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={metadata.category}
              onChange={handleChange("category")}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {MODEL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version
            </label>
            <input
              type="text"
              value={metadata.version}
              onChange={handleChange("version")}
              placeholder="e.g., 1.0.0"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author *
            </label>
            <input
              type="text"
              value={metadata.author}
              onChange={handleChange("author")}
              placeholder="Your name or organization"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.author ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.author && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.author}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={metadata.description}
          onChange={handleChange("description")}
          placeholder="Describe your model's capabilities, training data, and use cases..."
          rows={4}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Technical Details */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Technical Specifications
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Type
            </label>
            <select
              value={metadata.modelType}
              onChange={handleChange("modelType")}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="language">Language Model</option>
              <option value="image">Image Model</option>
              <option value="code">Code Model</option>
              <option value="audio">Audio Model</option>
              <option value="video">Video Model</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Framework */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Framework
            </label>
            <select
              value={metadata.framework}
              onChange={handleChange("framework")}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {MODEL_FRAMEWORKS.map((framework) => (
                <option key={framework} value={framework}>
                  {framework.charAt(0).toUpperCase() + framework.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Input Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Format
            </label>
            <input
              type="text"
              value={metadata.inputFormat}
              onChange={handleChange("inputFormat")}
              placeholder="e.g., text, image, json"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Output Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Output Format
            </label>
            <input
              type="text"
              value={metadata.outputFormat}
              onChange={handleChange("outputFormat")}
              placeholder="e.g., text, image, json"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Model Parameters (for language models) */}
      {metadata.modelType === "language" && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">
            Model Parameters
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Input Length
              </label>
              <input
                type="number"
                value={metadata.maxInputLength || ""}
                onChange={handleChange("maxInputLength")}
                placeholder="e.g., 4096"
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={metadata.temperature || ""}
                onChange={handleChange("temperature")}
                placeholder="e.g., 0.7"
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Top P
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={metadata.topP || ""}
                onChange={handleChange("topP")}
                placeholder="e.g., 0.9"
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tags and License */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <input
            type="text"
            value={metadata.tags.join(", ")}
            onChange={handleTagsChange}
            placeholder="e.g., nlp, transformer, gpt"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate tags with commas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            License
          </label>
          <select
            value={metadata.license}
            onChange={handleChange("license")}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="MIT">MIT</option>
            <option value="Apache-2.0">Apache 2.0</option>
            <option value="GPL-3.0">GPL 3.0</option>
            <option value="BSD-3-Clause">BSD 3-Clause</option>
            <option value="Creative Commons">Creative Commons</option>
            <option value="Proprietary">Proprietary</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
}
