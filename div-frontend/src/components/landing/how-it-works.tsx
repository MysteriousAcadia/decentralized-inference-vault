import { ArrowRight, Upload, Lock, Coins, Cpu } from 'lucide-react';

const steps = [
  {
    id: '01',
    name: 'Model Owner Journey',
    description: 'Upload & Encrypt AI Model',
    details: 'Model owners encrypt their trained AI models using Lighthouse Kavach SDK and upload to decentralized storage.',
    icon: Upload,
    color: 'bg-blue-600',
  },
  {
    id: '02',
    name: 'Token Deployment',
    description: 'Deploy DAO Access Token',
    details: 'Create ERC-20 tokens that represent access rights to your model. Set pricing and access conditions.',
    icon: Coins,
    color: 'bg-purple-600',
  },
  {
    id: '03',
    name: 'User Access',
    description: 'Purchase & Access Models',
    details: 'Users buy DAO tokens to gain access to models. Token ownership is verified on-chain for secure access.',
    icon: Lock,
    color: 'bg-green-600',
  },
  {
    id: '04',
    name: 'Inference Processing',
    description: 'Decentralized Compute',
    details: 'Fluence VMs decrypt models using user signatures, process inference requests, and return results.',
    icon: Cpu,
    color: 'bg-orange-600',
  },
];

export function HowItWorks() {
  return (
    <div id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            How It Works
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Four simple steps to decentralized AI
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            From model upload to inference execution, DIV handles the entire workflow 
            through decentralized infrastructure without any platform commissions.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-4">
            {steps.map((step, stepIdx) => (
              <div key={step.name} className="relative">
                <div className="flex items-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${step.color}`}>
                    <step.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      {step.name}
                    </h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-base leading-7 text-gray-600">
                    {step.details}
                  </p>
                </div>

                {/* Arrow connector for desktop */}
                {stepIdx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-8 h-px bg-gray-300">
                    <ArrowRight className="absolute -right-1 -top-2 h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}