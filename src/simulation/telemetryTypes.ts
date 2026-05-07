export type FlightPhase =
  | 'TAKEOFF_ROLL_AND_LIFTOFF'
  | 'CLIMB'
  | 'CRUISE'
  | 'DESCENT'
  | 'LANDING';

export type ConnectionStatus = 'online' | 'offline';
export type LinkStatus = 'CONNECTED' | 'DEGRADED' | 'OFFLINE';
export type GearState = 'UP' | 'DOWN' | 'TRANSIT';
export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'TAMPER_DETECTED';

export interface ImuTelemetry {
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  gyroRollRate: number;
  gyroPitchRate: number;
  gyroYawRate: number;
  roll: number;
  pitch: number;
  yaw: number;
  verticalSpeed: number;
}

export interface BarometricAltimeterTelemetry {
  altitudeMeters: number;
  pressureHpa: number;
  temperatureC: number;
  verticalSpeed: number;
}

export interface AirspeedTelemetry {
  indicatedAirspeedKmh: number;
  trueAirspeedKmh: number;
  mach: number;
  dynamicPressurePa: number;
}

export interface GpsTelemetry {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  groundSpeedKmh: number;
  headingDeg: number;
  satellites: number;
  hdop: number;
}

export interface EcuTelemetry {
  engineRpm: number;
  throttlePercent: number;
  fuelFlow: number;
  engineTempC: number;
  oilPressure: number;
  batteryLevelPercent: number;
}

export interface FlightControlTelemetry {
  autopilotEnabled: boolean;
  flapPositionDeg: number;
  elevatorDeg: number;
  aileronDeg: number;
  rudderDeg: number;
  trimDeg: number;
}

export interface LandingGearTelemetry {
  gearState: GearState;
  leftGearLocked: boolean;
  rightGearLocked: boolean;
  noseGearLocked: boolean;
  weightOnWheels: boolean;
}

export interface AircraftSystemsTelemetry {
  cabinDoorClosed: boolean;
  cargoDoorClosed: boolean;
  landingLights: boolean;
  navigationLights: boolean;
  beaconLights: boolean;
  strobeLights: boolean;
  masterWarning: boolean;
  masterCaution: boolean;
  warningMessages: string[];
}

export interface LinkTelemetry {
  signalQualityPercent: number;
  latencyMs: number;
  packetLossPercent: number;
  linkStatus: LinkStatus;
}

export interface BlockchainTelemetry {
  packetId: string;
  sequenceNo: number;
  timestamp: number;
  flightId: string;
  vehicleId: string;
  payloadHash: string;
  previousPacketHash: string;
  blockNo: number;
  txId: string;
  verificationStatus: VerificationStatus;
}

export interface BlockchainRecord {
  packetId: string;
  sequenceNo: number;
  payloadHash: string;
  previousPacketHash: string;
  blockNo: number;
  txId: string;
  committedAt: number;
  verificationStatus: VerificationStatus;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: number;
  message: string;
}

export interface TelemetryPacket {
  id: number;
  timestamp: number;
  elapsedSeconds: number;
  phase: FlightPhase;
  imu: ImuTelemetry;
  barometer: BarometricAltimeterTelemetry;
  airspeed: AirspeedTelemetry;
  gps: GpsTelemetry;
  ecu: EcuTelemetry;
  flightControls: FlightControlTelemetry;
  landingGear: LandingGearTelemetry;
  aircraftSystems: AircraftSystemsTelemetry;
  link: LinkTelemetry;
  blockchain: BlockchainTelemetry;

  // Dashboard summary fields derived from the sensor groups.
  latitude: number;
  longitude: number;
  altitudeM: number;
  airspeedMS: number;
  verticalSpeedMS: number;
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
  accelerationG: number;
  engineTempC: number;
  fuelKg: number;
  batteryV: number;
  connection: ConnectionStatus;
}

export type TelemetryFrame = TelemetryPacket;

export interface HashedTelemetryFrame extends TelemetryPacket {
  previousHash: string;
  hash: string;
}

export interface FlightState {
  frames: HashedTelemetryFrame[];
  latest?: HashedTelemetryFrame;
  blockchainRecords: BlockchainRecord[];
  latestBlockchainRecord?: BlockchainRecord;
  logs: TelemetryLogEntry[];
  integrityScore: number;
  chainHeight: number;
  pendingQueue: number;
}
