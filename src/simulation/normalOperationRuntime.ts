import { FlightModel } from './flightModel';
import { packageTelemetryPayload } from './hashService';
import { MockBlockchainService } from './mockBlockchainService';
import { MockDbService } from './mockDbService';
import type { FlightState } from './telemetryTypes';

const MIN_TICK_MS = 2200;
const SERVICE_STEP_DELAY_MS = 430;

export interface NormalOperationSnapshot {
  activeStep: number;
  running: boolean;
  state: FlightState;
}

type Listener = (snapshot: NormalOperationSnapshot) => void;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getSignalDelay(signalQualityPercent: number) {
  if (signalQualityPercent >= 95) return 100 + (100 - signalQualityPercent) * 30;
  if (signalQualityPercent >= 85) return 250 + (95 - signalQualityPercent) * 45;
  if (signalQualityPercent >= 70) return 700 + (85 - signalQualityPercent) * 53;
  return 1500;
}

function getNextTickDelay(signalQualityPercent?: number) {
  if (signalQualityPercent === undefined) return MIN_TICK_MS;
  return MIN_TICK_MS + getSignalDelay(signalQualityPercent);
}

export class NormalOperationRuntime {
  private activeStep = -1;
  private blockchain = new MockBlockchainService();
  private db = new MockDbService();
  private listeners = new Set<Listener>();
  private model = new FlightModel();
  private processing = false;
  private running = false;
  private timerId: number | undefined;
  private version = 0;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.version += 1;
    this.emit();
    this.scheduleNext(0);
  }

  pause() {
    this.running = false;
    this.version += 1;
    if (this.timerId !== undefined) {
      window.clearTimeout(this.timerId);
      this.timerId = undefined;
    }
    this.emit();
  }

  reset() {
    this.pause();
    this.activeStep = -1;
    this.blockchain.reset();
    this.db.reset();
    this.model = new FlightModel();
    this.processing = false;
    this.emit();
  }

  getSnapshot(): NormalOperationSnapshot {
    return {
      activeStep: this.activeStep,
      running: this.running,
      state: this.readState(),
    };
  }

  private scheduleNext(delayMs?: number) {
    if (!this.running) return;
    if (this.timerId !== undefined) window.clearTimeout(this.timerId);
    this.timerId = window.setTimeout(() => {
      this.timerId = undefined;
      void this.processTick(this.version);
    }, delayMs ?? getNextTickDelay(this.db.getLatestPacket()?.link.signalQualityPercent));
  }

  private async processTick(version: number) {
    if (!this.running || this.processing) return;
    this.processing = true;
    const packet = this.model.nextFrame(1);
    const sequenceLabel = packet.blockchain.sequenceNo.toString().padStart(5, '0');

    this.activeStep = 0;
    this.db.addLog(`PKT-${sequenceLabel} üretildi`);
    this.emit();

    await delay(getSignalDelay(packet.link.signalQualityPercent));
    if (!this.isCurrent(version)) return;

    this.activeStep = 1;
    this.emit();
    await delay(SERVICE_STEP_DELAY_MS);
    if (!this.isCurrent(version)) return;

    const previousPacketHash = this.db.getPreviousPayloadHash();
    const packagedPacket = await packageTelemetryPayload(packet, previousPacketHash);
    if (!this.isCurrent(version)) return;

    this.activeStep = 2;
    this.db.addLog('SHA-256 payload hash hesaplandı');
    this.emit();
    await delay(SERVICE_STEP_DELAY_MS);
    if (!this.isCurrent(version)) return;

    this.activeStep = 3;
    this.db.saveTelemetryPacket(packagedPacket);
    this.db.addLog('Off-chain DB yazımı tamamlandı');
    this.emit();
    await delay(SERVICE_STEP_DELAY_MS);
    if (!this.isCurrent(version)) return;

    this.activeStep = 4;
    const committedPacket = await this.blockchain.commitTelemetryHash(packagedPacket);
    this.db.saveTelemetryPacket(committedPacket);
    this.db.addLog('Mock Fabric tx committed');
    this.emit();
    await delay(SERVICE_STEP_DELAY_MS);
    if (!this.isCurrent(version)) return;

    this.activeStep = 5;
    this.db.addLog(`Verification result: ${committedPacket.blockchain.verificationStatus}`);
    this.emit();

    if (packet.elapsedSeconds >= 180) {
      this.pause();
    } else {
      this.processing = false;
      this.scheduleNext(getNextTickDelay(packet.link.signalQualityPercent));
    }
  }

  private isCurrent(version: number) {
    if (this.running && version === this.version) return true;
    this.processing = false;
    return false;
  }

  private readState(): FlightState {
    const dbState = this.db.getState();
    const blockchainRecords = this.blockchain.getRecords();
    return {
      ...dbState,
      blockchainRecords,
      latestBlockchainRecord: this.blockchain.getLatestRecord(),
      chainHeight: blockchainRecords.length,
      integrityScore:
        blockchainRecords.length > 0 && blockchainRecords.every((record) => record.verificationStatus === 'VERIFIED')
          ? 100
          : 0,
    };
  }

  private emit() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const normalOperationRuntime = new NormalOperationRuntime();
