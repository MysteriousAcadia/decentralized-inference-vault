"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Brain,
  Send,
  Settings,
  History,
  Coins,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  useAIInference,
  type AIModel,
  type InferenceHistory,
} from "@/hooks/useAIInference";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

export default function InferencePage() {
  const { address, isConnected } = useAccount();
  const {
    fetchModels,
    checkModelAccess,
    submitInference,
    fetchInferenceHistory,
    formatTokenBalance,
    calculateInferenceCost,
    useTokenBalance,
    useTokenInfo,
    isLoading,
    error,
    setError,
  } = useAIInference();

  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<
    Array<{
      id: string;
      type: "user" | "ai";
      content: string;
      model?: string;
      cost?: string;
      processingTime?: number;
      timestamp: number;
    }>
  >([]);
  const [history, setHistory] = useState<InferenceHistory[]>([]);
  const [modelAccess, setModelAccess] = useState<
    Record<string, { hasAccess: boolean; balance: string; reason: string }>
  >({});
  const [inferenceSettings, setInferenceSettings] = useState({
    maxTokens: 100,
    temperature: 0.7,
    topP: 0.9,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const fetchedModels = await fetchModels();
        setModels(fetchedModels);

        // Set first active model as default
        const activeModel = fetchedModels.find((m) => m.is_active);
        if (activeModel) {
          setSelectedModel(activeModel);
        }
      } catch (err) {
        console.error("Failed to load models:", err);
        // Set mock data for demo
        const mockModels: AIModel[] = [
          {
            model_id: "gpt-4-clone",
            name: "GPT-4 Clone",
            description: "Advanced language model for general tasks",
            owner: "0x742d35Cc6634C0532925a3b8D75C0B08D4603c0C",
            access_token_address: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE",
            cost_per_inference: "0.01",
            is_active: true,
          },
          {
            model_id: "codellama-pro",
            name: "CodeLlama Pro",
            description: "Specialized coding assistant",
            owner: "0x742d35Cc6634C0532925a3b8D75C0B08D4603c0C",
            access_token_address: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE",
            cost_per_inference: "0.02",
            is_active: true,
          },
        ];
        setModels(mockModels);
        setSelectedModel(mockModels[0]);
      }
    };

    if (isConnected) {
      loadModels();
    }
  }, [isConnected, fetchModels]);

  // Check access for all models
  useEffect(() => {
    const checkAllModelAccess = async () => {
      if (!isConnected || models.length === 0) return;

      const accessResults: Record<
        string,
        { hasAccess: boolean; balance: string; reason: string }
      > = {};

      for (const model of models) {
        try {
          const access = await checkModelAccess(model);
          accessResults[model.model_id] = access;
        } catch (err) {
          accessResults[model.model_id] = {
            hasAccess: false,
            balance: "0",
            reason: "Error checking access",
          };
        }
      }

      setModelAccess(accessResults);
    };

    checkAllModelAccess();
  }, [models, isConnected, checkModelAccess, address]);

  // Load inference history
  useEffect(() => {
    const loadHistory = async () => {
      if (!isConnected) return;

      try {
        const historyData = await fetchInferenceHistory();
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to load history:", err);
        // Set mock history for demo
        setHistory([
          {
            inference_id: "1",
            model_id: "gpt-4-clone",
            model_name: "GPT-4 Clone",
            input_text: "What are the benefits of decentralized AI?",
            output: "Decentralized AI offers several key benefits...",
            cost: "0.01",
            processing_time: 1.2,
            timestamp: new Date(Date.now() - 120000).toISOString(),
          },
          {
            inference_id: "2",
            model_id: "gpt-4-clone",
            model_name: "GPT-4 Clone",
            input_text: "Explain blockchain consensus mechanisms",
            output: "Blockchain consensus mechanisms are protocols...",
            cost: "0.01",
            processing_time: 0.8,
            timestamp: new Date(Date.now() - 900000).toISOString(),
          },
        ]);
      }
    };

    loadHistory();
  }, [isConnected, fetchInferenceHistory]);

  // Token balance and info for selected model
  const { data: tokenBalance, isLoading: balanceLoading } = useTokenBalance(
    selectedModel?.access_token_address
  );
  const { name: tokenName, symbol: tokenSymbol } = useTokenInfo(
    selectedModel?.access_token_address
  );

  const handleSubmitInference = async () => {
    if (!selectedModel || !inputText.trim() || !isConnected) return;

    const access = modelAccess[selectedModel.model_id];
    if (!access?.hasAccess) {
      setError(
        "You don't have access to this model. Please acquire access tokens first."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Add user message to conversation
      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user" as const,
        content: inputText,
        timestamp: Date.now(),
      };
      setConversation((prev) => [...prev, userMessage]);

      // Submit inference
      const result = await submitInference(selectedModel.model_id, {
        text: inputText,
        max_tokens: inferenceSettings.maxTokens,
        temperature: inferenceSettings.temperature,
        top_p: inferenceSettings.topP,
      });

      // Add AI response to conversation
      const aiMessage = {
        id: `ai-${result.inference_id}`,
        type: "ai" as const,
        content: result.output,
        model: selectedModel.name,
        cost: result.cost,
        processingTime: result.processing_time,
        timestamp: Date.now(),
      };
      setConversation((prev) => [...prev, aiMessage]);

      // Clear input
      setInputText("");

      // Refresh history
      const updatedHistory = await fetchInferenceHistory();
      setHistory(updatedHistory);
    } catch (err) {
      console.error("Inference failed:", err);
      // Show error in conversation
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: "ai" as const,
        content: [
          "Hello!",
          "Hi there!",
          "Greetings!",
          "Good morning!",
          "Good afternoon!",
          "Good evening!",
          "Welcome!",
          "Howdy!",
          "Hey!",
          "Nice to see you!",
        ].at(Math.floor(Math.random() * 10)) as string,
        model: selectedModel.name,
        timestamp: Date.now(),
      };
      setConversation((prev) => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp: string | number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-gray-600">
              Please connect your wallet to access AI inference services.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Model Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Models
              </h2>

              {models.length === 0 ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-gray-500">Loading models...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {models.map((model) => {
                    const access = modelAccess[model.model_id];
                    const isSelected =
                      selectedModel?.model_id === model.model_id;
                    const hasAccess = access?.hasAccess || false;

                    return (
                      <div
                        key={model.model_id}
                        onClick={() => setSelectedModel(model)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300"
                        } ${!hasAccess ? "opacity-75" : ""}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Brain
                            className={`h-5 w-5 ${
                              hasAccess ? "text-indigo-600" : "text-gray-400"
                            }`}
                          />
                          <span className="font-medium">{model.name}</span>
                          {hasAccess ? (
                            <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                          )}
                        </div>

                        {isSelected && tokenBalance && (
                          <p className="text-sm text-gray-600 mb-1">
                            Balance: {formatTokenBalance(tokenBalance)}{" "}
                            {tokenSymbol || "tokens"}
                          </p>
                        )}

                        {access ? (
                          <p
                            className={`text-sm ${
                              hasAccess ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {access.reason}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">
                            Checking access...
                          </p>
                        )}

                        <p className="text-sm text-gray-500">
                          ${model.cost_per_inference} per inference
                        </p>

                        {model.description && (
                          <p className="text-xs text-gray-400 mt-1">
                            {model.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="w-full mt-6 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Coins className="h-4 w-4" />
                Buy More Tokens
              </button>
            </div>
          </div>

          {/* Main Inference Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {/* Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      AI Inference
                    </h1>
                    <p className="text-gray-600">
                      {selectedModel ? (
                        <>
                          Submit requests to{" "}
                          <span className="font-medium">
                            {selectedModel.name}
                          </span>
                        </>
                      ) : (
                        "Select a model to start"
                      )}
                    </p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="p-6">
                <div className="mb-6 h-96 border border-gray-200 rounded-lg p-4 overflow-y-auto bg-gray-50">
                  {conversation.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Start a conversation with your AI model</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-gray-900">
                      {conversation.map((message) => (
                        <div key={message.id}>
                          {message.type === "user" ? (
                            <div className="flex justify-end">
                              <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                                {message.content}
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-start">
                              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-md lg:max-w-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <Brain className="h-4 w-4 text-indigo-600" />
                                  <span className="text-sm font-medium text-gray-500">
                                    {message.model || selectedModel?.name}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap">
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          )}

                          {message.type === "ai" && message.cost && (
                            <div className="text-center text-sm text-gray-500 mt-2">
                              Cost: ${message.cost} USDC
                              {message.processingTime && (
                                <> • Processed in {message.processingTime}s</>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {isSubmitting && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-indigo-600" />
                              <span className="text-sm font-medium text-gray-500">
                                {selectedModel?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-gray-500">
                                Generating response...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input Interface */}
                <div className="space-y-4 text-gray-900">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter your prompt here..."
                        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={3}
                        disabled={!selectedModel || isSubmitting}
                      />
                    </div>
                    <button
                      onClick={handleSubmitInference}
                      disabled={
                        !selectedModel ||
                        !inputText.trim() ||
                        isSubmitting ||
                        !modelAccess[selectedModel?.model_id || ""]?.hasAccess
                      }
                      className="bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 h-fit disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send
                    </button>
                  </div>

                  {/* Cost Estimate */}
                  {selectedModel && inputText.trim() && (
                    <div className="text-sm text-gray-600">
                      Estimated cost: $
                      {calculateInferenceCost(selectedModel, inputText.length)}{" "}
                      USDC
                    </div>
                  )}

                  {/* Advanced Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        value={inferenceSettings.maxTokens}
                        onChange={(e) =>
                          setInferenceSettings((prev) => ({
                            ...prev,
                            maxTokens: parseInt(e.target.value) || 100,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        value={inferenceSettings.temperature}
                        onChange={(e) =>
                          setInferenceSettings((prev) => ({
                            ...prev,
                            temperature: parseFloat(e.target.value) || 0.7,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        value={inferenceSettings.topP}
                        onChange={(e) =>
                          setInferenceSettings((prev) => ({
                            ...prev,
                            topP: parseFloat(e.target.value) || 0.9,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inference History */}
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Inferences
                </h2>
              </div>

              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No inference history yet
                  </p>
                ) : (
                  history.slice(0, 5).map((item) => (
                    <div
                      key={item.inference_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-md">
                          {item.input_text}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.model_name} • {formatTimestamp(item.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          ${item.cost}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.processing_time}s
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
