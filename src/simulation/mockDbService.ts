import type { FlightState, HashedTelemetryFrame, TelemetryLogEntry } from './telemetryTypes';

export class MockDbService {
  private frames: HashedTelemetryFrame[] = [];
  private logs: TelemetryLogEntry[] = [];
  private pendingQueue = 0;

  saveTelemetryPacket(packet: HashedTelemetryFrame): HashedTelemetryFrame {
    const existingIndex = this.frames.findIndex((frame) => frame.blockchain.sequenceNo === packet.blockchain.sequenceNo);
    if (existingIndex >= 0) {
      this.frames = this.frames.map((frame, index) => (index === existingIndex ? packet : frame));
    } else {
      this.frames = [...this.frames, packet].slice(-180);
    }
    this.pendingQueue = packet.link.linkStatus === 'OFFLINE' ? this.pendingQueue + 1 : 0;
    return packet;
  }

  addLog(message: string): TelemetryLogEntry {
    const entry: TelemetryLogEntry = {
      id: `LOG-${Date.now()}-${this.logs.length + 1}`,
      timestamp: Date.now(),
      message,
    };
    this.logs = [entry, ...this.logs];
    return entry;
  }

  getLatestPacket(): HashedTelemetryFrame | undefined {
    return this.frames[this.frames.length - 1];
  }

  getPreviousPayloadHash(): string {
    return this.getLatestPacket()?.blockchain.payloadHash ?? '0'.repeat(64);
  }

  getPackets(): HashedTelemetryFrame[] {
    return this.frames;
  }

  getLogs(): TelemetryLogEntry[] {
    return this.logs;
  }

  reset() {
    this.frames = [];
    this.logs = [];
    this.pendingQueue = 0;
  }

  getState(): FlightState {
    return {
      frames: this.frames,
      latest: this.getLatestPacket(),
      blockchainRecords: [],
      logs: this.logs,
      integrityScore: this.frames.length > 0 ? 99.98 : 100,
      chainHeight: this.frames.length,
      pendingQueue: this.pendingQueue,
    };
  }
}
