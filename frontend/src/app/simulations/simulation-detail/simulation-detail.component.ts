import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HohmannPlotData,
  OrbitPlotPoint,
  SimulationResponse
} from '../models/simulation.model';
import { SimulationService } from '../services/simulation.service';

@Component({
  selector: 'app-simulation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simulation-detail.component.html',
  styleUrl: './simulation-detail.component.css'
})
export class SimulationDetailComponent implements OnInit {

  simulation: SimulationResponse | null = null;

  loading = false;
  errorMessage = '';

  orbitPlotPoints: OrbitPlotPoint[] = [];
  hohmannPlotData: HohmannPlotData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private simulationService: SimulationService
  ) {}

  ngOnInit(): void {
    this.loadSimulation();
  }

  loadSimulation(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.errorMessage = 'Identifiant de simulation invalide.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.simulationService.findById(id).subscribe({
      next: (simulation) => {
        this.simulation = simulation;
        this.loading = false;

        if (simulation.type === 'ORBIT') {
          this.orbitPlotPoints = this.parseOrbitPlotData(simulation.plotDataJson);
          this.hohmannPlotData = null;
        }

        if (simulation.type === 'HOHMANN') {
          this.hohmannPlotData = this.parseHohmannPlotData(simulation.plotDataJson);
          this.orbitPlotPoints = [];
        }
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 403) {
          this.router.navigate(['/forbidden']);
          return;
        }

        if (error.status === 404) {
          this.errorMessage = 'Simulation introuvable.';
          return;
        }

        this.errorMessage = 'Impossible de charger le détail de la simulation.';
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  getSimulationTypeLabel(): string {
    if (!this.simulation) {
      return '-';
    }

    if (this.simulation.type === 'HOHMANN') {
      return 'Transfert de Hohmann';
    }

    if (this.simulation.type === 'ORBIT') {
      return 'Simulation orbitale';
    }

    return this.simulation.type;
  }

  private parseOrbitPlotData(plotDataJson: string): OrbitPlotPoint[] {
    try {
      const parsed = JSON.parse(plotDataJson);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((point) => typeof point.x === 'number' && typeof point.y === 'number')
        .map((point) => ({
          x: point.x,
          y: point.y
        }));
    } catch {
      return [];
    }
  }

  private parseHohmannPlotData(plotDataJson: string): HohmannPlotData | null {
    try {
      const parsed = JSON.parse(plotDataJson) as HohmannPlotData;

      if (
        !Array.isArray(parsed.initialOrbit) ||
        !Array.isArray(parsed.targetOrbit) ||
        !Array.isArray(parsed.transferArc)
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  getOrbitEllipse(): {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  } {
    const eccentricity = this.simulation?.inputEccentricity ?? 0;

    const cx = 160;
    const cy = 160;
    const maxRadius = 115;
    const safeEccentricity = Math.min(Math.max(eccentricity, 0), 0.85);

    return {
      cx,
      cy,
      rx: maxRadius,
      ry: maxRadius * Math.sqrt(1 - safeEccentricity * safeEccentricity)
    };
  }

  getEarthRadius(): number {
    const altitude = this.simulation?.inputAltitudeKm ?? 400;

    const minRadius = 8;
    const maxRadius = 26;
    const referenceAltitude = 400;

    const rawRadius = 20 * (referenceAltitude / altitude);

    return Math.max(minRadius, Math.min(maxRadius, rawRadius));
  }

  getSatelliteMarker(): {
    cx: number;
    cy: number;
  } {
    const ellipse = this.getOrbitEllipse();

    return {
      cx: ellipse.cx + ellipse.rx,
      cy: ellipse.cy
    };
  }

  getHohmannPath(points: OrbitPlotPoint[] | undefined): string {
    if (!points || points.length === 0) {
      return '';
    }

    return points
      .map((point, index) => {
        const normalized = this.normalizeHohmannPoint(point);
        return `${index === 0 ? 'M' : 'L'} ${normalized.x} ${normalized.y}`;
      })
      .join(' ');
  }

  private normalizeHohmannPoint(point: OrbitPlotPoint): { x: number; y: number } {
    const center = 160;
    const scale = 110;

    return {
      x: center + point.x * scale,
      y: center - point.y * scale
    };
  }
}
