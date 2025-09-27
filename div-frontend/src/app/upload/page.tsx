import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Upload, Lock, Coins, FileText, Shield, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload AI Model</h1>
          <p className="mt-2 text-gray-600">
            Deploy your AI model to the decentralized marketplace and monetize through DAO tokens
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Step 1: Model Upload */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-semibold text-white">1</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Upload Model File</h2>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Upload your model</h3>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your model file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports: .pkl, .pt, .onnx, .h5 (Max 10GB)
              </p>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Choose File
              </button>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., GPT-4 Alternative"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option>Language Model</option>
                  <option>Image Generation</option>
                  <option>Code Generation</option>
                  <option>Audio Processing</option>
                  <option>Video Analysis</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Describe your model's capabilities, training data, and use cases..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={4}
              />
            </div>
          </div>

          {/* Step 2: Access Configuration */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-semibold text-white">2</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Configure Access Control</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DAO Token Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., GPT4Alt Access Token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token Symbol
                </label>
                <input
                  type="text"
                  placeholder="e.g., GPT4A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Inference (USDC)
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Tokens for Access
                </label>
                <input
                  type="number"
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Token Supply
                </label>
                <input
                  type="number"
                  placeholder="1000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Encryption Notice</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your model will be encrypted using Lighthouse's Kavach SDK before upload. 
                    Only users with the required DAO tokens will be able to decrypt and access your model.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Deployment */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-semibold text-white">3</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Deploy to Marketplace</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-gray-900">Encrypt & Upload Model</span>
                </div>
                <span className="text-sm text-gray-500">~2-5 minutes</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Deploy DAO Token Contract</span>
                </div>
                <span className="text-sm text-gray-500">~1-2 minutes</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Register in Model Vault</span>
                </div>
                <span className="text-sm text-gray-500">~30 seconds</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Estimated Costs</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span>Token Contract Deployment:</span>
                  <span>~$5 MATIC</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Vault Registration:</span>
                  <span>~$1 MATIC</span>
                </div>
                <div className="flex justify-between">
                  <span>Lighthouse Storage:</span>
                  <span>~$2-10 (based on size)</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-200 pt-1 mt-2">
                  <span>Total Estimated Cost:</span>
                  <span>~$8-16</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Deploy Model
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Save as Draft
              </button>
            </div>
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
}