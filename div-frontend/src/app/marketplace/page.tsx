import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Search, Filter, Brain, Coins, Users, Star } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description: string;
  owner: string;
  price: number;
  category: string;
  rating: number;
  totalInferences: number;
  tokenAddress: string;
  featured: boolean;
}

// Mock data for demonstration
const mockModels = [
  {
    id: "1",
    name: "GPT-4 Clone",
    description: "High-performance language model for general-purpose tasks",
    owner: "0x742d35Cc6836C0532c0C078aE4ce74d54b7CC9a2",
    price: 0.01, // USDC per inference
    category: "Language Model",
    rating: 4.8,
    totalInferences: 125000,
    tokenAddress: "0x...",
    featured: true,
  },
  {
    id: "2",
    name: "DALL-E Alternative",
    description: "Text-to-image generation with stunning quality",
    owner: "0x8ba1f109551bD432803012645Hac136c30243",
    price: 0.05,
    category: "Image Generation",
    rating: 4.6,
    totalInferences: 89000,
    tokenAddress: "0x...",
    featured: false,
  },
  {
    id: "3",
    name: "CodeLlama Pro",
    description: "Specialized model for code generation and debugging",
    owner: "0x9c42D8b4a5a6d8E7F4B5C1A7D6B5F2A8E9C4B6",
    price: 0.02,
    category: "Code Generation",
    rating: 4.9,
    totalInferences: 67000,
    tokenAddress: "0x...",
    featured: true,
  },
];

const categories = [
  "All Models",
  "Language Model",
  "Image Generation",
  "Code Generation",
  "Audio Processing",
  "Video Analysis",
];

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Model Marketplace
          </h1>
          <p className="mt-2 text-gray-600">
            Discover and access premium AI models through token-gated DAOs
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search models..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Featured Models */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Featured Models
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockModels
              .filter((model) => model.featured)
              .map((model) => (
                <ModelCard key={model.id} model={model} featured />
              ))}
          </div>
        </div>

        {/* All Models */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ModelCard({
  model,
  featured = false,
}: {
  model: Model;
  featured?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border ${
        featured
          ? "border-indigo-200 ring-2 ring-indigo-100"
          : "border-gray-200"
      } hover:shadow-xl transition-shadow`}
    >
      {featured && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">Featured</span>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-indigo-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{model.name}</h3>
              <p className="text-sm text-gray-500">{model.category}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">{model.rating}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{model.description}</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Price per inference:</span>
            <span className="font-semibold text-green-600">
              ${model.price} USDC
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Total inferences:</span>
            <span className="font-medium">
              {model.totalInferences.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>
              Owner: {model.owner.slice(0, 6)}...{model.owner.slice(-4)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
            Buy Access Token
          </button>
          <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
