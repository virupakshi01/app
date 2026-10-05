import { Component, OnInit, inject } from "@angular/core";
import { DatePipe, NgFor, NgIf } from "@angular/common";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/api.service";

interface EventRow {
  id: string;
  repositoryFullName: string;
  eventType: string;
  action: string | null;
  status: string;
  receivedAt: string;
}

@Component({
  selector: "app-events",
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink],
  template: `
    <h2>Events</h2>
    <div class="card" *ngIf="stats">
      Received: {{ stats.RECEIVED }} · Processing: {{ stats.PROCESSING }} · Completed:
      {{ stats.COMPLETED }} · Failed: {{ stats.FAILED }}
    </div>
    <table>
      <thead>
        <tr>
          <th>Repository</th>
          <th>Type</th>
          <th>Action</th>
          <th>Status</th>
          <th>Received</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let e of events">
          <td>{{ e.repositoryFullName }}</td>
          <td>{{ e.eventType }}</td>
          <td>{{ e.action }}</td>
          <td>{{ e.status }}</td>
          <td>
            <a [routerLink]="['/dashboard/events', e.id]">{{ e.receivedAt | date: "short" }}</a>
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
export class EventsComponent implements OnInit {
  private api = inject(ApiService);
  events: EventRow[] = [];
  stats: Record<string, number> | null = null;

  async ngOnInit() {
    const [eventsRes, statsRes] = await Promise.all([
      firstValueFrom(this.api.get<{ events: EventRow[] }>("/events")),
      firstValueFrom(this.api.get<{ stats: Record<string, number> }>("/events/stats")),
    ]);
    this.events = eventsRes.events;
    this.stats = statsRes.stats;
  }
}
