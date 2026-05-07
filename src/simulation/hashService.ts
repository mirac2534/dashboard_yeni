import type { HashedTelemetryFrame, TelemetryFrame, TelemetryPacket } from './telemetryTypes';

const encoder = new TextEncoder();

export async function sha256Hex(input: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const buffer = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(input));
    return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
}

export function createCanonicalTelemetryPayload(frame: TelemetryFrame, previousPacketHash: string): string {
  return JSON.stringify({
    packetId: frame.blockchain.packetId,
    sequenceNo: frame.blockchain.sequenceNo,
    timestamp: frame.timestamp,
    flightId: frame.blockchain.flightId,
    vehicleId: frame.blockchain.vehicleId,
    phase: frame.phase,
    imu: frame.imu,
    barometer: frame.barometer,
    airspeed: frame.airspeed,
    gps: frame.gps,
    ecu: frame.ecu,
    flightControls: frame.flightControls,
    landingGear: frame.landingGear,
    aircraftSystems: frame.aircraftSystems,
    link: frame.link,
    previousPacketHash,
  });
}

export async function hashTelemetryFrame(frame: TelemetryFrame, previousHash: string): Promise<string> {
  return sha256Hex(createCanonicalTelemetryPayload(frame, previousHash));
}

export async function packageTelemetryPayload(
  packet: TelemetryPacket,
  previousPacketHash: string,
): Promise<HashedTelemetryFrame> {
  const payloadHash = await hashTelemetryFrame(packet, previousPacketHash);
  const packagedPacket: HashedTelemetryFrame = {
    ...packet,
    blockchain: {
      ...packet.blockchain,
      payloadHash,
      previousPacketHash,
      verificationStatus: 'PENDING',
    },
    previousHash: previousPacketHash,
    hash: payloadHash,
  };

  return packagedPacket;
}

export async function legacyHashTelemetryFrame(frame: TelemetryFrame, previousHash: string): Promise<string> {
  const canonicalPayload = JSON.stringify({
    id: frame.id,
    timestamp: frame.timestamp,
    phase: frame.phase,
    imu: frame.imu,
    barometer: frame.barometer,
    airspeed: frame.airspeed,
    gps: frame.gps,
    ecu: frame.ecu,
    flightControls: frame.flightControls,
    landingGear: frame.landingGear,
    aircraftSystems: frame.aircraftSystems,
    link: frame.link,
    blockchainPayloadHash: frame.blockchain.payloadHash,
    previousHash,
  });

  return sha256Hex(canonicalPayload);
}
