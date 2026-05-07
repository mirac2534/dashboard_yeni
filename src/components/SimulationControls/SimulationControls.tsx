import { Pause, Play, RotateCcw } from 'lucide-react';

interface SimulationControlsProps {
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function SimulationControls({ running, onStart, onPause, onReset }: SimulationControlsProps) {
  return (
    <div className="simulation-controls">
      <button className="button button--primary" disabled={running} onClick={onStart} type="button">
        <Play size={18} />
        Simülasyon Başlat
      </button>
      <button className="button button--ghost" disabled={!running} onClick={onPause} type="button">
        <Pause size={18} />
        Duraklat
      </button>
      <button className="button button--ghost" onClick={onReset} type="button">
        <RotateCcw size={18} />
        Sıfırla
      </button>
    </div>
  );
}
