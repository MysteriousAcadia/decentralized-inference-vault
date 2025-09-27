import { Database, Shield, Zap, Coins } from 'lucide-react';

export function Architecture() {
  return (
    <div className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Technical Architecture
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Built on battle-tested Web3 infrastructure
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            DIV leverages the best decentralized technologies to provide secure, 
            scalable, and cost-effective AI inference services.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative">
            {/* Architecture Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Storage Layer */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Database className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Storage Layer
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Lighthouse</h4>
                      <p className="text-sm text-gray-600">Encrypted storage with token-gated access</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Database className="h-5 w-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">IPFS/Filecoin</h4>
                      <p className="text-sm text-gray-600">Decentralized file storage</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compute Layer */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Zap className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Compute Layer
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Zap className="h-5 w-5 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Fluence Network</h4>
                      <p className="text-sm text-gray-600">Cloudless compute infrastructure</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-5 w-5 bg-gray-400 rounded mt-0.5 mr-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">CPU-Optimized VMs</h4>
                      <p className="text-sm text-gray-600">Auto-scaling inference engines</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Layer */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Coins className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment Layer
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Coins className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Synapse Protocol</h4>
                      <p className="text-sm text-gray-600">Cross-chain USDC settlements</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">Smart Contracts</h4>
                      <p className="text-sm text-gray-600">ERC-20 access tokens & payment streams</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technology Partners */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Lighthouse</h4>
                <p className="text-sm text-gray-600">Encryption & Storage</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Fluence</h4>
                <p className="text-sm text-gray-600">Decentralized Compute</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Synapse</h4>
                <p className="text-sm text-gray-600">Cross-chain Bridge</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Polygon</h4>
                <p className="text-sm text-gray-600">Smart Contracts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}