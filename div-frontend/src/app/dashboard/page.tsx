import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Brain,
  Coins,
  Users,
  TrendingUp,
  Settings,
  Eye,
  BarChart3,
} from "lucide-react";

// Mock data for user's models
const userModels = [
  {
    id: "1",
    name: "GPT-4 Clone",
    category: "Language Model",
    status: "Active",
    totalInferences: 125000,
    revenue: 1250.0,
    tokenHolders: 342,
    price: 0.01,
    lastInference: "2 minutes ago",
  },
  {
    id: "2",
    name: "CodeGen Pro",
    category: "Code Generation",
    status: "Active",
    totalInferences: 67000,
    revenue: 1340.0,
    tokenHolders: 189,
    price: 0.02,
    lastInference: "15 minutes ago",
  },
  {
    id: "3",
    name: "ImageAI v2",
    category: "Image Generation",
    status: "Pending",
    totalInferences: 0,
    revenue: 0,
    tokenHolders: 0,
    price: 0.05,
    lastInference: "Never",
  },
];

export default function DashboardPage() {
  const totalRevenue = userModels.reduce(
    (sum, model) => sum + model.revenue,
    0
  );
  const totalInferences = userModels.reduce(
    (sum, model) => sum + model.totalInferences,
    0
  );
  const totalTokenHolders = userModels.reduce(
    (sum, model) => sum + model.tokenHolders,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            My Models Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your AI models, track performance, and monitor revenue
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-green-600">
              +12.5% from last month
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Inferences
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalInferences.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-600">
              +8.2% from last month
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Token Holders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalTokenHolders}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-purple-600">
              +25 new this week
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Models
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {userModels.filter((m) => m.status === "Active").length}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Brain className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              of {userModels.length} total
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Models
              </h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Add New Model
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inferences
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token Holders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Brain className="h-8 w-8 text-indigo-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {model.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {model.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          model.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${model.revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {model.totalInferences.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {model.tokenHolders}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${model.price} USDC
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-indigo-600 hover:text-indigo-900 p-1">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 p-1">
                          <Settings className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900 p-1">
                          <Coins className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue Over Time
            </h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">
                Chart will be implemented with a charting library
              </p>
            </div>
          </div>

          {/* Recent Inferences */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    GPT-4 Clone inference
                  </p>
                  <p className="text-sm text-gray-500">2 minutes ago</p>
                </div>
                <span className="text-sm font-medium text-green-600">
                  +$0.01
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    New token holder joined
                  </p>
                  <p className="text-sm text-gray-500">5 minutes ago</p>
                </div>
                <span className="text-sm text-indigo-600">GPT-4 Clone</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    CodeGen Pro inference
                  </p>
                  <p className="text-sm text-gray-500">15 minutes ago</p>
                </div>
                <span className="text-sm font-medium text-green-600">
                  +$0.02
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
