import type { EChartsOption } from 'echarts';
import { AlertTriangle, BatteryCharging, CheckCircle2, RadioTower, Thermometer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ChartCard } from '../components/ChartCard/ChartCard';
import { FlightRouteMap } from '../components/FlightRouteMap/FlightRouteMap';
import { PipelineFlow } from '../components/PipelineFlow/PipelineFlow';
import { SimulationControls } from '../components/SimulationControls/SimulationControls';
import { normalOperationRuntime } from '../simulation/normalOperationRuntime';
import type { FlightState, HashedTelemetryFrame } from '../simulation/telemetryTypes';

const axisStyle = { color: '#9fb2c8' };
const grid = { left: 42, right: 22, top: 28, bottom: 36 };
const M_TO_FT = 3.28084;
const MPS_TO_FPM = 196.8504;
const KMH_TO_KT = 0.539957;
const HPA_TO_INHG = 0.029529983;
const PA_TO_PSF = 0.0208854;

const phaseLabels: Record<string, string> = {
  TAKEOFF_ROLL_AND_LIFTOFF: 'Kalkış',
  CLIMB: 'Tırmanış',
  CRUISE: 'Sabit Seyir',
  DESCENT: 'İnişe Geçiş',
  LANDING: 'İniş',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'AKTIF',
  CHECK: 'Kontrol gerekli',
  CLEAR: 'Temiz',
  CLOSED: 'KAPALI',
  CONNECTED: 'Bağlı',
  DEGRADED: 'Zayıf',
  DISABLED: 'Kapalı',
  DOWN: 'Aşağıda',
  ENABLED: 'Açık',
  FALSE: 'Hayır',
  OFFLINE: 'Çevrimdışı',
  OPEN: 'Açık',
  READY: 'Hazır',
  TRANSIT: 'Geçişte',
  TRUE: 'Evet',
  UP: 'Yukarıda',
  VERIFIED: 'Doğrulandı',
};

function trStatus(value?: string) {
  return value ? (statusLabels[value] ?? value) : '-';
}

function formatHash(hash?: string) {
  return hash ? `${hash.slice(0, 18)}...${hash.slice(-12)}` : 'Bekleniyor';
}

function formatTime(timestamp?: number) {
  return timestamp ? new Date(timestamp).toLocaleTimeString('tr-TR') : '-';
}

function cToF(value: number) {
  return value * 1.8 + 32;
}

function createGaugeOption(value: number, max: number, unit: string, color: string): EChartsOption {
  return {
    series: [
      {
        type: 'gauge',
        min: 0,
        max,
        progress: { show: true, width: 10, itemStyle: { color } },
        axisLine: { lineStyle: { width: 10, color: [[1, '#22354c']] } },
        axisTick: { show: false },
        splitLine: { length: 8, lineStyle: { color: '#60758d' } },
        axisLabel: { color: '#9fb2c8', distance: 14, fontSize: 10 },
        pointer: { width: 4 },
        detail: {
          formatter: `{value} ${unit}`,
          color: '#eef7ff',
          fontSize: 18,
          fontWeight: 800,
          offsetCenter: [0, '62%'],
        },
        data: [{ value: Number(value.toFixed(1)) }],
      },
    ],
  };
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="packet-row">
      <span>{label}</span>
      <b className={strong ? 'packet-row__strong' : ''}>{value}</b>
    </div>
  );
}

function DetailGroup({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <details className="detail-group" open>
      <summary>{title}</summary>
      <div>
        {rows.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </div>
    </details>
  );
}

export function NormalOperationPage() {
  const [snapshot, setSnapshot] = useState(() => normalOperationRuntime.getSnapshot());

  useEffect(() => {
    return normalOperationRuntime.subscribe(setSnapshot);
  }, []);

  const { activeStep, running, state } = snapshot;
  const latest = state.latest;
  const labels = state.frames.map((frame) => `${Math.round(frame.elapsedSeconds)}s`);
  const verified = latest?.blockchain.verificationStatus === 'VERIFIED';

  const lineOptions = useMemo<Record<string, EChartsOption>>(
    () => ({
      altitude: {
        color: ['#28d7e8'],
        tooltip: { trigger: 'axis', backgroundColor: '#0b1728', borderColor: '#263b55', textStyle: { color: '#eef7ff' } },
        grid,
        xAxis: { type: 'category', data: labels, axisLabel: axisStyle, axisLine: { lineStyle: axisStyle } },
        yAxis: { type: 'value', axisLabel: axisStyle, splitLine: { lineStyle: { color: '#22354c' } } },
        series: [{ name: 'İrtifa (ft)', type: 'line', smooth: true, showSymbol: false, areaStyle: { opacity: 0.13 }, data: state.frames.map((frame) => Math.round(frame.altitudeM * M_TO_FT)) }],
      },
      speed: {
        color: ['#ff9f43'],
        tooltip: { trigger: 'axis', backgroundColor: '#0b1728', borderColor: '#263b55', textStyle: { color: '#eef7ff' } },
        grid,
        xAxis: { type: 'category', data: labels, axisLabel: axisStyle, axisLine: { lineStyle: axisStyle } },
        yAxis: { type: 'value', axisLabel: axisStyle, splitLine: { lineStyle: { color: '#22354c' } } },
        series: [{ name: 'Hava Hızı (kt)', type: 'line', smooth: true, showSymbol: false, areaStyle: { opacity: 0.1 }, data: state.frames.map((frame) => Number((frame.airspeed.trueAirspeedKmh * KMH_TO_KT).toFixed(1))) }],
      },
    }),
    [labels, state.frames],
  );

  const detailGroups = latest ? createDetailGroups(latest) : [];

  return (
    <div className="operation-page operation-page--normal">
      <section className="normal-hero">
        <div>
          <span className="eyebrow">Canlı demo operasyonu</span>
          <h2>Problemsiz Operasyon Senaryosu</h2>
          <p>Normal uçuş koşullarında dijital kara kutu veri akışı, hash üretimi, off-chain kayıt ve blokzincir doğrulama süreci.</p>
        </div>
        <div className="phase-indicator">
          <span>Uçuş Fazı</span>
          <strong>{latest ? phaseLabels[latest.phase] : 'Hazır'}</strong>
          <small>{latest ? `${latest.elapsedSeconds} / 180 sn` : 'Simülasyon beklemede'}</small>
        </div>
      </section>

      <section className="section-panel">
        <div className="section-panel__header">
          <div>
            <span className="eyebrow">Dijital kara kutu işlem hattı</span>
            <h3>Sensörden doğrulamaya uçtan uca kayıt</h3>
          </div>
        </div>
        <PipelineFlow activeStep={activeStep} />
      </section>

      <section className="operation-top-grid">
        <section className="control-box">
          <span className="eyebrow">Simülasyon kontrolü</span>
          <h3>Veri akışı manuel başlatılır</h3>
          <SimulationControls
            running={running}
            onPause={() => normalOperationRuntime.pause()}
            onReset={() => normalOperationRuntime.reset()}
            onStart={() => normalOperationRuntime.start()}
          />
          <p>Duraklatınca son paket ve grafikler korunur. Sıfırla; DB, blockchain kayıtları ve logları temizler.</p>
        </section>

        <section className="current-packet-box">
          <div className="section-panel__header">
            <div>
              <span className="eyebrow">Güncel telemetri paketi</span>
              <h3>{latest?.blockchain.packetId ?? 'Paket bekleniyor'}</h3>
            </div>
            <span className={verified ? 'verified-badge verified-badge--large' : 'pending-badge'}>{latest?.blockchain.verificationStatus ?? 'PENDING'}</span>
          </div>
          <div className="packet-grid">
            <InfoRow label="Uçuş ID" value={latest?.blockchain.flightId ?? '-'} />
            <InfoRow label="Araç ID" value={latest?.blockchain.vehicleId ?? '-'} />
            <InfoRow label="Paket ID" value={latest?.blockchain.packetId ?? '-'} />
            <InfoRow label="Sıra No" value={latest ? String(latest.blockchain.sequenceNo) : '-'} />
            <InfoRow label="Zaman" value={formatTime(latest?.timestamp)} />
            <InfoRow label="Faz" value={latest ? phaseLabels[latest.phase] : '-'} strong />
            <InfoRow label="İrtifa" value={latest ? `${(latest.altitudeM * M_TO_FT).toFixed(0)} ft` : '-'} />
            <InfoRow label="Hava Hızı" value={latest ? `${(latest.airspeed.trueAirspeedKmh * KMH_TO_KT).toFixed(1)} kt` : '-'} />
            <InfoRow label="Sinyal Kalitesi" value={latest ? `${latest.link.signalQualityPercent.toFixed(1)} %` : '-'} />
            <InfoRow label="Payload Hash" value={formatHash(latest?.blockchain.payloadHash)} />
            <InfoRow label="Önceki Hash" value={formatHash(latest?.blockchain.previousPacketHash)} />
            <InfoRow label="txId" value={formatHash(latest?.blockchain.txId)} />
            <InfoRow label="Blok No" value={latest ? String(latest.blockchain.blockNo) : '-'} />
          </div>
        </section>
      </section>

      <section className="gauge-grid">
        <ChartCard title="Hava Hızı" subtitle="Gerçek hava hızı" height={230} option={createGaugeOption((latest?.airspeed.trueAirspeedKmh ?? 0) * KMH_TO_KT, 360, 'kt', '#ff9f43')} />
        <EngineTempCard valueF={latest ? cToF(latest.ecu.engineTempC) : 0} />
        <BatteryProgressCard value={latest?.ecu.batteryLevelPercent ?? 0} />
        <ChartCard title="Barometrik Basınç" subtitle="Altimetre ayarı" height={230} option={createGaugeOption((latest?.barometer.pressureHpa ?? 0) * HPA_TO_INHG, 31, 'inHg', '#b6e3ff')} />
        <SignalStatusCard latencyMs={latest?.link.latencyMs ?? 0} linkStatus={latest?.link.linkStatus ?? 'CONNECTED'} quality={latest?.link.signalQualityPercent ?? 0} />
        <WarningChecklistCard packet={latest} />
      </section>

      <section className="dashboard-grid">
        <ChartCard title="Zamana Göre İrtifa" subtitle="Feet cinsinden irtifa takibi" option={lineOptions.altitude} />
        <ChartCard title="Zamana Göre Hava Hızı" subtitle="Knot cinsinden hız takibi" option={lineOptions.speed} />
      </section>

      <FlightRouteMap />

      <section className="event-log-panel">
        <div>
          <span className="eyebrow">Telemetri log kutusu</span>
          <h3>Tüm servis kayıtları</h3>
        </div>
        <div className="event-log-panel__list event-log-panel__list--scroll">
          {state.logs.length > 0 ? (
            state.logs.map((log) => (
              <div key={log.id}>
                <time>[{new Date(log.timestamp).toLocaleTimeString('tr-TR')}]</time>
                <span>{log.message}</span>
              </div>
            ))
          ) : (
            <p>Simülasyon başlatıldığında servis kayıtları burada akacak.</p>
          )}
        </div>
      </section>

      <section className="detail-telemetry-panel">
        <div>
          <span className="eyebrow">Detaylı telemetri kutusu</span>
          <h3>Sensör ve sistem grupları</h3>
        </div>
        <div className="detail-grid">
          {detailGroups.length > 0 ? detailGroups.map((group) => <DetailGroup key={group.title} title={group.title} rows={group.rows} />) : <p>İlk paket doğrulandıktan sonra detaylar burada görünecek.</p>}
        </div>
      </section>
    </div>
  );
}

function EngineTempCard({ valueF }: { valueF: number }) {
  const percent = Math.min(100, Math.max(0, (valueF / 1300) * 100));
  return (
    <section className="instrument-card engine-temp-card">
      <div className="instrument-card__header">
        <Thermometer size={22} />
        <div>
          <span>Motor Sıcaklığı</span>
          <strong>{valueF.toFixed(0)} °F</strong>
        </div>
      </div>
      <div className="thermo-meter" aria-label="Motor sıcaklığı">
        <i style={{ height: `${percent}%` }} />
      </div>
      <p>Dikey termometre ile sıcaklık seviyesi</p>
    </section>
  );
}

function BatteryProgressCard({ value }: { value: number }) {
  return (
    <section className="instrument-card battery-progress-card">
      <div className="instrument-card__header">
        <BatteryCharging size={22} />
        <div>
          <span>Batarya</span>
          <strong>{value.toFixed(1)}%</strong>
        </div>
      </div>
      <div className="battery-shell">
        <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <p>Aviyonik güç rezervi</p>
    </section>
  );
}

function SignalStatusCard({ latencyMs, linkStatus, quality }: { latencyMs: number; linkStatus: string; quality: number }) {
  const activeBars = Math.max(1, Math.ceil((quality / 100) * 5));
  return (
    <section className="instrument-card signal-card">
      <div className="instrument-card__header">
        <RadioTower size={22} />
        <div>
          <span>Sinyal Gücü</span>
          <strong>{quality.toFixed(1)}%</strong>
        </div>
      </div>
      <div className="signal-bars">
        {Array.from({ length: 5 }, (_, index) => (
          <i className={index < activeBars ? 'signal-bars__bar--active' : ''} key={index} />
        ))}
      </div>
      <div className="latency-badge">{latencyMs} ms · {trStatus(linkStatus)}</div>
    </section>
  );
}

function WarningChecklistCard({ packet }: { packet?: HashedTelemetryFrame }) {
  const warning = packet?.aircraftSystems.masterWarning ?? false;
  const caution = packet?.aircraftSystems.masterCaution ?? false;
  const rows = [
    ['Ana Uyarı', warning ? 'Aktif' : 'Temiz'],
    ['Ana İkaz', caution ? 'Aktif' : 'Temiz'],
    ['Kapılar', packet?.aircraftSystems.cabinDoorClosed && packet.aircraftSystems.cargoDoorClosed ? 'Kapalı' : 'Kontrol gerekli'],
    ['İniş Takımı', trStatus(packet?.landingGear.gearState ?? 'READY')],
  ];

  return (
    <section className="instrument-card warning-check-card">
      <div className="instrument-card__header">
        <AlertTriangle size={22} />
        <div>
          <span>İkaz Sistemleri</span>
          <strong>{warning ? 'UYARI' : caution ? 'İKAZ' : 'NORMAL'}</strong>
        </div>
        <b className={warning || caution ? 'pulse-badge pulse-badge--warn' : 'pulse-badge'} />
      </div>
      <div className="warning-check-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <CheckCircle2 size={16} />
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function createDetailGroups(packet: HashedTelemetryFrame): Array<{ title: string; rows: Array<[string, string]> }> {
  return [
    {
      title: 'GPS',
      rows: [
        ['Latitude', `${packet.gps.latitude.toFixed(6)} °`],
        ['Longitude', `${packet.gps.longitude.toFixed(6)} °`],
        ['GPS İrtifası', `${(packet.gps.altitudeMeters * M_TO_FT).toFixed(0)} ft`],
        ['Yer Hızı', `${(packet.gps.groundSpeedKmh * KMH_TO_KT).toFixed(1)} kt`],
        ['Baş Açısı', `${packet.gps.headingDeg.toFixed(2)} derece`],
        ['Uydu Sayısı', `${packet.gps.satellites}`],
        ['HDOP', `${packet.gps.hdop.toFixed(2)}`],
      ],
    },
    {
      title: 'IMU',
      rows: [
        ['X Ekseni İvme', `${packet.imu.accelerationX.toFixed(3)} g`],
        ['Y Ekseni İvme', `${packet.imu.accelerationY.toFixed(3)} g`],
        ['Z Ekseni İvme', `${packet.imu.accelerationZ.toFixed(3)} g`],
        ['Roll Dönüş Hızı', `${packet.imu.gyroRollRate.toFixed(3)} derece/s`],
        ['Pitch Dönüş Hızı', `${packet.imu.gyroPitchRate.toFixed(3)} derece/s`],
        ['Yaw Dönüş Hızı', `${packet.imu.gyroYawRate.toFixed(3)} derece/s`],
        ['Roll', `${packet.imu.roll.toFixed(2)} derece`],
        ['Pitch', `${packet.imu.pitch.toFixed(2)} derece`],
        ['Yaw', `${packet.imu.yaw.toFixed(2)} derece`],
        ['Dikey Hız', `${(packet.imu.verticalSpeed * MPS_TO_FPM).toFixed(0)} ft/min`],
      ],
    },
    {
      title: 'Barometrik Altimetre',
      rows: [
        ['İrtifa', `${(packet.barometer.altitudeMeters * M_TO_FT).toFixed(0)} ft`],
        ['Basınç', `${(packet.barometer.pressureHpa * HPA_TO_INHG).toFixed(2)} inHg`],
        ['Dış Hava Sıcaklığı', `${cToF(packet.barometer.temperatureC).toFixed(1)} °F`],
        ['Dikey Hız', `${(packet.barometer.verticalSpeed * MPS_TO_FPM).toFixed(0)} ft/min`],
      ],
    },
    {
      title: 'Pitot / Hava Hızı',
      rows: [
        ['Gösterilen Hava Hızı', `${(packet.airspeed.indicatedAirspeedKmh * KMH_TO_KT).toFixed(1)} kt`],
        ['Gerçek Hava Hızı', `${(packet.airspeed.trueAirspeedKmh * KMH_TO_KT).toFixed(1)} kt`],
        ['Mach', `${packet.airspeed.mach.toFixed(3)}`],
        ['Dinamik Basınç', `${(packet.airspeed.dynamicPressurePa * PA_TO_PSF).toFixed(1)} psf`],
      ],
    },
    {
      title: 'ECU',
      rows: [
        ['Motor RPM', `${packet.ecu.engineRpm} rpm`],
        ['Gaz Kolu', `${packet.ecu.throttlePercent.toFixed(1)} %`],
        ['Yakıt Akışı', `${(packet.ecu.fuelFlow * 2.20462).toFixed(1)} lb/h`],
        ['Motor Sıcaklığı', `${cToF(packet.ecu.engineTempC).toFixed(1)} °F`],
        ['Yağ Basıncı', `${packet.ecu.oilPressure.toFixed(1)} psi`],
        ['Batarya Seviyesi', `${packet.ecu.batteryLevelPercent.toFixed(2)} %`],
      ],
    },
    {
      title: 'Uçuş Kontrol Sistemleri',
      rows: [
        ['Otopilot', packet.flightControls.autopilotEnabled ? 'ACIK' : 'KAPALI'],
        ['Flap Konumu', `${packet.flightControls.flapPositionDeg.toFixed(1)} derece`],
        ['Elevator', `${packet.flightControls.elevatorDeg.toFixed(2)} derece`],
        ['Aileron', `${packet.flightControls.aileronDeg.toFixed(2)} derece`],
        ['Rudder', `${packet.flightControls.rudderDeg.toFixed(2)} derece`],
        ['Trim', `${packet.flightControls.trimDeg.toFixed(2)} derece`],
      ],
    },
    {
      title: 'İniş Takımı',
      rows: [
        ['İniş Takımı Durumu', trStatus(packet.landingGear.gearState)],
        ['Sol Takım Kilitli', packet.landingGear.leftGearLocked ? 'EVET' : 'HAYIR'],
        ['Sağ Takım Kilitli', packet.landingGear.rightGearLocked ? 'EVET' : 'HAYIR'],
        ['Burun Takımı Kilitli', packet.landingGear.noseGearLocked ? 'EVET' : 'HAYIR'],
        ['Teker Üzerinde Ağırlık', packet.landingGear.weightOnWheels ? 'EVET' : 'HAYIR'],
      ],
    },
    {
      title: 'Kapı / Işık / İkaz Sistemleri',
      rows: [
        ['Kabin Kapısı', packet.aircraftSystems.cabinDoorClosed ? 'KAPALI' : 'ACIK'],
        ['Kargo Kapısı', packet.aircraftSystems.cargoDoorClosed ? 'KAPALI' : 'ACIK'],
        ['İniş Işıkları', packet.aircraftSystems.landingLights ? 'ACIK' : 'KAPALI'],
        ['Seyrüsefer Işıkları', packet.aircraftSystems.navigationLights ? 'ACIK' : 'KAPALI'],
        ['Beacon Işıkları', packet.aircraftSystems.beaconLights ? 'ACIK' : 'KAPALI'],
        ['Strobe Işıkları', packet.aircraftSystems.strobeLights ? 'ACIK' : 'KAPALI'],
        ['Ana Uyarı', packet.aircraftSystems.masterWarning ? 'EVET' : 'HAYIR'],
        ['Ana İkaz', packet.aircraftSystems.masterCaution ? 'EVET' : 'HAYIR'],
      ],
    },
    {
      title: 'Bağlantı Durumu',
      rows: [
        ['Sinyal Kalitesi', `${packet.link.signalQualityPercent.toFixed(1)} %`],
        ['Gecikme', `${packet.link.latencyMs} ms`],
        ['Paket Kaybı', `${packet.link.packetLossPercent.toFixed(2)} %`],
        ['Bağlantı Durumu', trStatus(packet.link.linkStatus)],
      ],
    },
    {
      title: 'Blockchain / Hash Bilgileri',
      rows: [
        ['Payload Hash', packet.blockchain.payloadHash],
        ['Önceki Hash', packet.blockchain.previousPacketHash],
        ['Blok No', `${packet.blockchain.blockNo}`],
        ['txId', packet.blockchain.txId],
        ['Doğrulama Durumu', trStatus(packet.blockchain.verificationStatus)],
      ],
    },
  ];
}
