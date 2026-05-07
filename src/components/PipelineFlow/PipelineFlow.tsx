import { CheckCircle2, Database, Fingerprint, PackageCheck, RadioTower, ShieldCheck } from 'lucide-react';

const steps = [
  { label: 'Sensör Verisi', icon: RadioTower },
  { label: 'Paketleme', icon: PackageCheck },
  { label: 'Hashleme', icon: Fingerprint },
  { label: 'Off-chain DB', icon: Database },
  { label: 'Fabric Kaydı', icon: ShieldCheck },
  { label: 'Verification', icon: CheckCircle2 },
];

interface PipelineFlowProps {
  activeStep: number;
}

export function PipelineFlow({ activeStep }: PipelineFlowProps) {
  return (
    <section className="pipeline">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const state = index < activeStep ? 'done' : index === activeStep ? 'active' : 'idle';
        return (
          <div className={`pipeline__item pipeline__item--${state}`} key={step.label}>
            <div className="pipeline__node">
              <Icon size={20} />
            </div>
            <span>{step.label}</span>
            {index < steps.length - 1 ? <i /> : null}
          </div>
        );
      })}
    </section>
  );
}
