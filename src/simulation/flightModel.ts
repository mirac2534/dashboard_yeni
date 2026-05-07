import type { FlightPhase, TelemetryPacket } from './telemetryTypes';

const START_LATITUDE = 40.8986;
const START_LONGITUDE = 29.3092;
const FLIGHT_ID = 'SYN-DEMO-2026-001';
const VEHICLE_ID = 'SYN-UAV-BBX-01';
const GENESIS_HASH = '0'.repeat(64);
const SEA_LEVEL_AIR_DENSITY = 1.225;
const KMH_TO_METERS_PER_SECOND = 1 / 3.6;

const DEMO_ROUTE = [
  { latitude: START_LATITUDE, longitude: START_LONGITUDE },
  { latitude: 40.1426, longitude: 29.9793 },
  { latitude: 39.7667, longitude: 30.5256 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function smoothstep(x: number) {
  const n = clamp(x, 0, 1);
  return n * n * (3 - 2 * n);
}

function lerp(start: number, end: number, ratio: number) {
  return start + (end - start) * ratio;
}

function wave(t: number, period: number, amplitude: number, phase = 0) {
  return Math.sin(t / period + phase) * amplitude;
}

function interpolateRoute(t: number) {
  const progress = smoothstep(clamp(t, 0, 180) / 180);
  const segmentCount = DEMO_ROUTE.length - 1;
  const scaledProgress = progress * segmentCount;
  const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaledProgress));
  const segmentProgress = scaledProgress - segmentIndex;
  const start = DEMO_ROUTE[segmentIndex];
  const end = DEMO_ROUTE[segmentIndex + 1];

  return {
    latitude: lerp(start.latitude, end.latitude, segmentProgress),
    longitude: lerp(start.longitude, end.longitude, segmentProgress),
  };
}

function bearingBetween(start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) {
  const startLat = (start.latitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const deltaLon = ((end.longitude - start.longitude) * Math.PI) / 180;
  const y = Math.sin(deltaLon) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function hash64(input: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const block = `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
  return `${block}${block.split('').reverse().join('')}${block}`.slice(0, 64);
}

export function getFlightPhase(t: number): FlightPhase {
  if (t < 25) return 'TAKEOFF_ROLL_AND_LIFTOFF';
  if (t < 70) return 'CLIMB';
  if (t < 120) return 'CRUISE';
  if (t < 160) return 'DESCENT';
  return 'LANDING';
}

function altitudeAt(t: number) {
  const second = clamp(t, 0, 180);

  if (second < 18) return 0;
  if (second < 25) return lerp(0, 120, smoothstep((second - 18) / 7));
  if (second < 70) return lerp(120, 9_500, smoothstep((second - 25) / 45));
  if (second < 120) return 9_500 + wave(second, 8, 14);
  if (second < 160) return lerp(9_500, 620, smoothstep((second - 120) / 40));
  if (second < 174) return lerp(620, 0, smoothstep((second - 160) / 14));
  return 0;
}

function speedAt(t: number) {
  const second = clamp(t, 0, 180);

  if (second < 25) return lerp(0, 285, smoothstep(second / 25));
  if (second < 70) return lerp(285, 520, smoothstep((second - 25) / 45));
  if (second < 120) return 535 + wave(second, 9, 7) + wave(second, 17, 3);
  if (second < 160) return lerp(520, 265, smoothstep((second - 120) / 40));
  if (second < 174) return lerp(265, 115, smoothstep((second - 160) / 14));
  return lerp(95, 0, smoothstep((second - 174) / 6));
}

function throttleAt(t: number, phase: FlightPhase) {
  if (phase === 'TAKEOFF_ROLL_AND_LIFTOFF') return t < 3 ? lerp(35, 96, t / 3) : 96 + wave(t, 8, 1.2);
  if (phase === 'CLIMB') return 88 + wave(t, 13, 2.2);
  if (phase === 'CRUISE') return 63 + wave(t, 16, 2.4);
  if (phase === 'DESCENT') return 34 + wave(t, 14, 2);
  return t < 174 ? 42 + wave(t, 8, 1.6) : lerp(28, 8, (t - 174) / 6);
}

function pitchAt(t: number, phase: FlightPhase, verticalSpeed: number, speedMps: number) {
  const flightPathDeg = speedMps > 1 ? Math.atan2(verticalSpeed, speedMps) * (180 / Math.PI) : 0;
  if (phase === 'TAKEOFF_ROLL_AND_LIFTOFF') return t < 18 ? lerp(0, 4, t / 18) : 10 + wave(t, 5, 0.7);
  if (phase === 'CLIMB') return clamp(flightPathDeg + 4.5 + wave(t, 11, 0.6), 5.5, 12);
  if (phase === 'CRUISE') return 1.2 + wave(t, 18, 0.35);
  if (phase === 'DESCENT') return clamp(flightPathDeg + 1.4 + wave(t, 12, 0.45), -6.5, 1.2);
  return t < 174 ? clamp(flightPathDeg + 3.2 + wave(t, 9, 0.4), -2.5, 5) : lerp(2, 0, (t - 174) / 6);
}

function gearStateAt(t: number, phase: FlightPhase) {
  if (phase === 'TAKEOFF_ROLL_AND_LIFTOFF') return 'DOWN' as const;
  if (phase === 'CLIMB' && t < 34) return 'TRANSIT' as const;
  if (phase === 'DESCENT' && t > 148) return 'TRANSIT' as const;
  if (phase === 'LANDING') return 'DOWN' as const;
  return 'UP' as const;
}

function flapAt(t: number, phase: FlightPhase) {
  if (phase === 'TAKEOFF_ROLL_AND_LIFTOFF') return t < 22 ? 12 : 8;
  if (phase === 'CLIMB') return t < 42 ? lerp(8, 0, (t - 25) / 17) : 0;
  if (phase === 'CRUISE') return 0;
  if (phase === 'DESCENT') return t > 144 ? lerp(0, 18, (t - 144) / 16) : 0;
  return t < 174 ? 28 : 18;
}

export function generateTelemetryAtSecond(t: number, previous?: TelemetryPacket): TelemetryPacket {
  const second = clamp(Math.round(t), 0, 180);
  const phase = getFlightPhase(second);
  const previousAltitude = second > 0 ? altitudeAt(second - 1) : altitudeAt(second);
  const altitude = altitudeAt(second);
  const verticalSpeed = altitude - previousAltitude;
  const trueAirspeedKmh = speedAt(second);
  const speedMps = trueAirspeedKmh * KMH_TO_METERS_PER_SECOND;
  const accelerationMps2 = second > 0 ? (speedAt(second) - speedAt(second - 1)) * KMH_TO_METERS_PER_SECOND : 0;
  const position = interpolateRoute(second);
  const nextPosition = interpolateRoute(Math.min(180, second + 1));
  const headingDeg = (bearingBetween(position, nextPosition) + wave(second, 45, 0.8) + wave(second, 19, 0.3) + 360) % 360;
  const gpsAltitude = clamp(altitude + wave(second, 7, 1.8) + wave(second, 3, 0.5), 0, 10_000);
  const pressureHpa = 1013.25 * Math.pow(1 - (0.0065 * altitude) / 288.15, 5.255);
  const temperatureC = 15 - altitude * 0.0065 + wave(second, 23, 0.6);
  const airDensity = SEA_LEVEL_AIR_DENSITY * Math.pow(Math.max(0.2, 1 - (0.0065 * altitude) / 288.15), 4.256);
  const dynamicPressurePa = 0.5 * airDensity * speedMps ** 2;
  const indicatedAirspeedKmh = trueAirspeedKmh * Math.sqrt(airDensity / SEA_LEVEL_AIR_DENSITY);
  const throttlePercent = clamp(throttleAt(second, phase), 0, 100);
  const targetEngineTempC = 145 + throttlePercent * 5.2 + speedMps * 0.18 + wave(second, 21, 3);
  const engineTempC = previous ? previous.ecu.engineTempC * 0.9 + targetEngineTempC * 0.1 : targetEngineTempC;
  const roll = clamp(wave(second, 10, 2.4) + wave(second, 4.7, 1.2), -5, 5);
  const pitch = pitchAt(second, phase, verticalSpeed, speedMps);
  const previousRoll = previous?.imu.roll ?? roll;
  const previousPitch = previous?.imu.pitch ?? pitch;
  const previousYaw = previous?.imu.yaw ?? headingDeg;
  const gearState = gearStateAt(second, phase);
  const gearLocked = gearState !== 'TRANSIT';
  const weightOnWheels = altitude === 0 && (phase === 'TAKEOFF_ROLL_AND_LIFTOFF' || phase === 'LANDING');
  const signalQualityPercent = clamp(94 + wave(second, 12, 4) + wave(second, 5, 1.5), 85, 100);
  const latencyMs = 18 + (100 - signalQualityPercent) * 1.6 + Math.abs(wave(second, 8, 2));
  const packetLossPercent = clamp((100 - signalQualityPercent) * 0.018 + Math.abs(wave(second, 6, 0.03)), 0.01, 0.45);
  const sequenceNo = second + 1;
  const timestamp = Date.UTC(2026, 4, 7, 9, 0, 0) + second * 1000;
  const previousPacketHash = previous?.blockchain.payloadHash ?? GENESIS_HASH;
  const payloadHash = hash64(
    JSON.stringify({
      sequenceNo,
      timestamp,
      phase,
      altitude: round(altitude, 2),
      speed: round(trueAirspeedKmh, 2),
      verticalSpeed: round(verticalSpeed, 2),
      latitude: round(position.latitude, 6),
      longitude: round(position.longitude, 6),
      previousPacketHash,
    }),
  );

  return {
    id: sequenceNo,
    timestamp,
    elapsedSeconds: second,
    phase,
    imu: {
      accelerationX: round(accelerationMps2 / 9.80665, 3),
      accelerationY: round(roll / 90 + wave(second, 5, 0.015), 3),
      accelerationZ: round(1 + Math.abs(verticalSpeed) / 90 + Math.abs(roll) / 240, 3),
      gyroRollRate: round(roll - previousRoll, 3),
      gyroPitchRate: round(pitch - previousPitch, 3),
      gyroYawRate: round((((headingDeg - previousYaw + 540) % 360) - 180), 3),
      roll: round(roll, 2),
      pitch: round(pitch, 2),
      yaw: round(headingDeg, 2),
      verticalSpeed: round(verticalSpeed, 2),
    },
    barometer: {
      altitudeMeters: round(altitude, 2),
      pressureHpa: round(pressureHpa, 2),
      temperatureC: round(temperatureC, 2),
      verticalSpeed: round(verticalSpeed, 2),
    },
    airspeed: {
      indicatedAirspeedKmh: round(indicatedAirspeedKmh, 1),
      trueAirspeedKmh: round(trueAirspeedKmh, 1),
      mach: round(speedMps / 340.29, 3),
      dynamicPressurePa: round(dynamicPressurePa, 1),
    },
    gps: {
      latitude: round(position.latitude, 6),
      longitude: round(position.longitude, 6),
      altitudeMeters: round(gpsAltitude, 2),
      groundSpeedKmh: round(trueAirspeedKmh * (weightOnWheels ? 0.98 : 1), 1),
      headingDeg: round(headingDeg, 2),
      satellites: Math.round(clamp(12 + wave(second, 18, 2), 9, 14)),
      hdop: round(clamp(1.05 - (signalQualityPercent - 85) / 80 + Math.abs(wave(second, 10, 0.08)), 0.7, 1.5), 2),
    },
    ecu: {
      engineRpm: Math.round(720 + throttlePercent * 23 + wave(second, 8, 32)),
      throttlePercent: round(throttlePercent, 1),
      fuelFlow: round(18 + throttlePercent * 0.82 + speedMps * 0.08, 2),
      engineTempC: round(clamp(engineTempC, 120, 690), 1),
      oilPressure: round(clamp(28 + throttlePercent * 0.42 + wave(second, 11, 1.4), 24, 72), 1),
      batteryLevelPercent: round(clamp(100 - second * 0.018, 0, 100), 2),
    },
    flightControls: {
      autopilotEnabled: phase === 'CRUISE' || phase === 'DESCENT',
      flapPositionDeg: round(clamp(flapAt(second, phase), 0, 30), 1),
      elevatorDeg: round(clamp(pitch * 0.42 + wave(second, 6, 0.4), -8, 8), 2),
      aileronDeg: round(clamp(-roll * 0.38 + wave(second, 5, 0.25), -4, 4), 2),
      rudderDeg: round(clamp(wave(second, 9, 0.9), -3, 3), 2),
      trimDeg: round(clamp(pitch * 0.12, -2, 2), 2),
    },
    landingGear: {
      gearState,
      leftGearLocked: gearLocked,
      rightGearLocked: gearLocked,
      noseGearLocked: gearLocked,
      weightOnWheels,
    },
    aircraftSystems: {
      cabinDoorClosed: true,
      cargoDoorClosed: true,
      landingLights: phase === 'TAKEOFF_ROLL_AND_LIFTOFF' || phase === 'LANDING',
      navigationLights: true,
      beaconLights: true,
      strobeLights: !weightOnWheels || second > 8,
      masterWarning: false,
      masterCaution: gearState === 'TRANSIT',
      warningMessages: gearState === 'TRANSIT' ? ['Landing gear in transit'] : [],
    },
    link: {
      signalQualityPercent: round(signalQualityPercent, 1),
      latencyMs: Math.round(latencyMs),
      packetLossPercent: round(packetLossPercent, 2),
      linkStatus: signalQualityPercent < 88 ? 'DEGRADED' : 'CONNECTED',
    },
    blockchain: {
      packetId: `PKT-${FLIGHT_ID}-${sequenceNo.toString().padStart(5, '0')}`,
      sequenceNo,
      timestamp,
      flightId: FLIGHT_ID,
      vehicleId: VEHICLE_ID,
      payloadHash,
      previousPacketHash,
      blockNo: 54_000 + Math.floor(second / 3),
      txId: `0x${hash64(`${payloadHash}:${sequenceNo}:tx`).slice(0, 48)}`,
      verificationStatus: 'VERIFIED',
    },
    latitude: round(position.latitude, 6),
    longitude: round(position.longitude, 6),
    altitudeM: round(altitude, 2),
    airspeedMS: round(speedMps, 2),
    verticalSpeedMS: round(verticalSpeed, 2),
    pitchDeg: round(pitch, 2),
    rollDeg: round(roll, 2),
    yawDeg: round(headingDeg, 2),
    accelerationG: round(1 + Math.abs(accelerationMps2) / 9.80665 + Math.abs(verticalSpeed) / 120, 3),
    engineTempC: round(clamp(engineTempC, 120, 690), 1),
    fuelKg: round(clamp(8_600 - second * (0.55 + throttlePercent * 0.012), 0, 8_600), 1),
    batteryV: round(24 + (100 - second * 0.018) * 0.036, 2),
    connection: 'online',
  };
}

export interface FlightModelOptions {
  startSecond?: number;
}

export class FlightModel {
  private elapsedSeconds: number;
  private previous?: TelemetryPacket;

  constructor(options: FlightModelOptions = {}) {
    this.elapsedSeconds = options.startSecond ?? -1;
  }

  nextFrame(deltaSeconds = 1): TelemetryPacket {
    this.elapsedSeconds = clamp(this.elapsedSeconds + deltaSeconds, 0, 180);
    this.previous = generateTelemetryAtSecond(this.elapsedSeconds, this.previous);
    return this.previous;
  }
}

export function createInitialTelemetry(count = 0): TelemetryPacket[] {
  const model = new FlightModel();
  return Array.from({ length: count }, () => model.nextFrame(1));
}
