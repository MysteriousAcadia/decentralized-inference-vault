import { DollarSign, Shield, Zap, Globe, Lock, Users } from 'lucide-react';

const features = [
  {
    name: 'Commission-Free',
    description: 'Direct peer-to-peer payments between users and model owners. No platform fees, just gas costs.',
    icon: DollarSign,
  },
  {
    name: 'Token-Gated Access',
    description: 'Access premium AI models through DAO token ownership. Secure, decentralized access control.',
    icon: Lock,
  },
  {
    name: 'Encrypted Storage',
    description: 'Models are encrypted using Lighthouse and stored on IPFS/Filecoin with threshold cryptography.',
    icon: Shield,
  },
  {
    name: 'Fast Inference',
    description: 'Sub-3 second inference times on Fluence decentralized compute infrastructure.',
    icon: Zap,
  },
  {
    name: 'Cross-Chain',
    description: 'Seamless USDC payments across multiple chains using Synapse Protocol bridge.',
    icon: Globe,
  },
  {
    name: 'Data DAOs',
    description: 'Model ownership through decentralized autonomous organizations with governance tokens.',
    icon: Users,
  },
];

export function Features() {
  return (
    <div className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Decentralized Infrastructure
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for decentralized AI
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            DIV combines cutting-edge Web3 technologies to create the first truly 
            decentralized AI inference platform. No middlemen, no commissions, just 
            direct access to premium AI models.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}