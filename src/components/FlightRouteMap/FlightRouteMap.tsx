import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import am5geodata_turkeyLow from '@amcharts/amcharts5-geodata/turkeyLow';
import { useLayoutEffect, useRef, useState } from 'react';
import { normalOperationRuntime } from '../../simulation/normalOperationRuntime';

type ProjectionMode = 'globe' | 'map';

interface RoutePoint {
  title: string;
  latitude: number;
  longitude: number;
  kind: 'origin' | 'waypoint' | 'destination';
}

interface DemoRoute {
  id: string;
  name: string;
  description: string;
  zoom: number;
  center: { latitude: number; longitude: number };
  points: RoutePoint[];
}

const routes: DemoRoute[] = [
  {
    id: 'istanbul-eskisehir',
    name: 'İstanbul → Eskişehir',
    description: 'Kısa menzilli Marmara-İç Anadolu demo rotası',
    zoom: 4.9,
    center: { latitude: 40.2, longitude: 30.2 },
    points: [
      { title: 'İstanbul / Sabiha Gökçen', latitude: 40.8986, longitude: 29.3092, kind: 'origin' },
      { title: 'Bilecik geçiş noktası', latitude: 40.1426, longitude: 29.9793, kind: 'waypoint' },
      { title: 'Eskişehir', latitude: 39.7667, longitude: 30.5256, kind: 'destination' },
    ],
  },
  {
    id: 'ankara-konya',
    name: 'Ankara → Konya',
    description: 'Kısa ve kontrollü İç Anadolu bağlantı rotası',
    zoom: 4.7,
    center: { latitude: 39.0, longitude: 32.5 },
    points: [
      { title: 'Ankara / Esenboğa', latitude: 40.1281, longitude: 32.9951, kind: 'origin' },
      { title: 'Tuz Gölü geçiş noktası', latitude: 38.76, longitude: 33.36, kind: 'waypoint' },
      { title: 'Konya', latitude: 37.8746, longitude: 32.4932, kind: 'destination' },
    ],
  },
];

function routeToLineData(route: DemoRoute) {
  return [
    {
      geometry: {
        type: 'LineString',
        coordinates: route.points.map((point) => [point.longitude, point.latitude]),
      },
    },
  ];
}

function routeToPointData(route: DemoRoute) {
  return route.points.map((point) => ({
    ...point,
    geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
  }));
}

export function FlightRouteMap() {
  const chartRef = useRef<am5map.MapChart | null>(null);
  const aircraftSeriesRef = useRef<am5map.MapPointSeries | null>(null);
  const lineSeriesRef = useRef<am5map.MapLineSeries | null>(null);
  const pointSeriesRef = useRef<am5map.MapPointSeries | null>(null);
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('map');
  const [routeIndex, setRouteIndex] = useState(0);
  const activeRoute = routes[routeIndex];

  useLayoutEffect(() => {
    const root = am5.Root.new('flight-route-map');
    root.setThemes([am5themes_Animated.new(root), am5themes_Dark.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        homeGeoPoint: routes[0].center,
        homeZoomLevel: routes[0].zoom,
        panX: 'rotateX',
        panY: 'translateY',
        projection: am5map.geoMercator(),
        wheelY: 'zoom',
      }),
    );

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_turkeyLow,
      }),
    );

    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0x102840),
      fillOpacity: 0.95,
      interactive: true,
      stroke: am5.color(0x2a4c68),
      strokeOpacity: 0.7,
      tooltipText: '{name}',
    });

    const graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      stroke: am5.color(0x6e879d),
      strokeOpacity: 0.16,
    });

    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
    lineSeries.mapLines.template.setAll({
      stroke: am5.color(0xffc857),
      strokeOpacity: 0.45,
      strokeWidth: 2,
    });

    const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push((rootRef, _series, dataItem) => {
      const data = dataItem.dataContext as RoutePoint;
      const isOrigin = data.kind === 'origin';
      const circle = am5.Circle.new(rootRef, {
        radius: isOrigin ? 9 : 6,
        fill: am5.color(0xffc857),
        stroke: am5.color(0xffffff),
        strokeWidth: 2,
        tooltipText: data.title,
      });

      return am5.Bullet.new(rootRef, { sprite: circle });
    });

    const aircraftSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    aircraftSeries.bullets.push((rootRef) => {
      const label = am5.Label.new(rootRef, {
        centerX: am5.percent(50),
        centerY: am5.percent(50),
        fontSize: 24,
        populateText: true,
        text: '✈',
        tooltipText: 'Simüle edilen uçak',
      });
      return am5.Bullet.new(rootRef, { sprite: label });
    });

    chartRef.current = chart;
    aircraftSeriesRef.current = aircraftSeries;
    lineSeriesRef.current = lineSeries;
    pointSeriesRef.current = pointSeries;

    polygonSeries.events.once('datavalidated', () => {
      chart.goHome(0);
      chart.appear(900, 120);
    });

    return () => {
      root.dispose();
      aircraftSeriesRef.current = null;
      chartRef.current = null;
      lineSeriesRef.current = null;
      pointSeriesRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    return normalOperationRuntime.subscribe((snapshot) => {
      const latest = snapshot.state.latest;
      const aircraftSeries = aircraftSeriesRef.current;
      if (!latest || !aircraftSeries) return;

      const aircraftData = [
        {
          geometry: {
            type: 'Point',
            coordinates: [latest.gps.longitude, latest.gps.latitude],
          },
        },
      ];

      if (aircraftSeries.data.length > 0) {
        aircraftSeries.data.setIndex(0, aircraftData[0]);
      } else {
        aircraftSeries.data.setAll(aircraftData);
      }
    });
  }, []);

  useLayoutEffect(() => {
    const chart = chartRef.current;
    const lineSeries = lineSeriesRef.current;
    const pointSeries = pointSeriesRef.current;
    if (!chart || !lineSeries || !pointSeries) return;

    chart.setAll({
      homeGeoPoint: activeRoute.center,
      homeZoomLevel: projectionMode === 'map' ? activeRoute.zoom : 3.1,
      projection: projectionMode === 'map' ? am5map.geoMercator() : am5map.geoOrthographic(),
    });
    lineSeries.data.setAll(routeToLineData(activeRoute));
    pointSeries.data.setAll(routeToPointData(activeRoute));
    chart.goHome(650);
  }, [activeRoute, projectionMode]);

  return (
    <section className="route-map-panel">
      <div className="route-map-panel__header">
        <div>
          <span className="eyebrow">Türkiye içi demo rota</span>
          <h3>Uçağın izlediği kısa uçuş hattı</h3>
          <p>{activeRoute.name} · {activeRoute.description}</p>
        </div>
        <div className="route-map-panel__actions">
          <button className="button button--ghost" onClick={() => setProjectionMode((value) => (value === 'map' ? 'globe' : 'map'))} type="button">
            {projectionMode === 'map' ? 'Globe' : 'Harita'}
          </button>
        </div>
      </div>
      <div className="route-map-panel__map" id="flight-route-map" />
    </section>
  );
}
