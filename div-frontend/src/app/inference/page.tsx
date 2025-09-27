import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Brain, Send, Settings, History, Coins } from 'lucide-react';

export default function InferencePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Model Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Models</h2>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium">GPT-4 Clone</span>
                  </div>
                  <p className="text-sm text-gray-500">Balance: 50 tokens</p>
                  <p className="text-sm text-green-600">$0.01 per inference</p>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors opacity-50">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-500">CodeLlama Pro</span>
                  </div>
                  <p className="text-sm text-red-500">No access tokens</p>
                  <p className="text-sm text-gray-400">$0.02 per inference</p>
                </div>
              </div>
              
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
                    <h1 className="text-2xl font-bold text-gray-900">AI Inference</h1>
                    <p className="text-gray-600">Submit requests to your connected AI models</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Chat Interface */}
              <div className="p-6">
                <div className="mb-6 h-96 border border-gray-200 rounded-lg p-4 overflow-y-auto bg-gray-50">
                  {/* Mock conversation */}
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-xs">
                        What are the benefits of decentralized AI?
                      </div>
                    </div>
                    
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-500">GPT-4 Clone</span>
                        </div>
                        <p>Decentralized AI offers several key benefits: 1) Eliminates single points of failure, 2) Reduces costs through competition, 3) Prevents censorship, 4) Enables data sovereignty, and 5) Creates new economic models for AI model owners.</p>
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-500">
                      Cost: $0.01 USDC • Processed in 1.2s
                    </div>
                  </div>
                </div>
                
                {/* Input Interface */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <textarea
                        placeholder="Enter your prompt here..."
                        className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <button className="bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 h-fit">
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                  
                  {/* Advanced Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        defaultValue={100}
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
                        defaultValue={0.7}
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
                        defaultValue={0.9}
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
                <h2 className="text-lg font-semibold text-gray-900">Recent Inferences</h2>
              </div>
              
              <div className="space-y-3">
                {/* Mock history items */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">What are the benefits of decentralized AI?</p>
                    <p className="text-sm text-gray-500">GPT-4 Clone • 2 minutes ago</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">$0.01</p>
                    <p className="text-sm text-gray-500">1.2s</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Explain blockchain consensus mechanisms</p>
                    <p className="text-sm text-gray-500">GPT-4 Clone • 15 minutes ago</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">$0.01</p>
                    <p className="text-sm text-gray-500">0.8s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}