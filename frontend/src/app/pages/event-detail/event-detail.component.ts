import { Component, OnInit, inject } from "@angular/core";
import { JsonPipe, NgFor, NgIf } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/api.service";

interface ActionLog {
  id: string;
  ruleName: string | null;
  type: string;
  status: string;
  detail: unknown;
  createdAt: string;
}

interface EventDetail {
  id: string;
  repositoryFullName: string;
  eventType: string;
  action: string | null;
  status: string;
  receivedAt: string;
  processedAt: string | null;
  job: { status: string; attempts: number; lastError: string | null } | null;
  actionLogs: ActionLog[];
}

@Component({
  selector: "app-event-detail",
  standalone: true,
  imports: [NgFor, NgIf, JsonPipe],
  template: `
    <h2 *ngIf="event">{{ event.repositoryFullName }} — {{ event.eventType }}.{{ event.action }}</h2>
    <div class="card" *ngIf="event">
      <div>Status: {{ event.status }}</div>
      <div>Received: {{ event.receivedAt }}</div>
      <div *ngIf="event.processedAt">Processed: {{ event.processedAt }}</div>
      <div *ngIf="event.job">
        Job: {{ event.job.status }} (attempts: {{ event.job.attempts }})
        <span *ngIf="event.job.lastError" style="color:#f85149"> — {{ event.job.lastError }}</span>
      </div>
    </div>

    <h3>Actions</h3>
    <div class="card" *ngFor="let log of event?.actionLogs">
      <strong>{{ log.type }}</strong> — {{ log.status }}
      <span *ngIf="log.ruleName"> (rule: {{ log.ruleName }})</span>
      <pre style="white-space:pre-wrap; opacity:0.8;">{{ log.detail | json }}</pre>
    </div>
    <p *ngIf="event && event.actionLogs.length === 0">No actions were taken for this event.</p>
  `,
})
export class EventDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  event: EventDetail | null = null;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    const res = await firstValueFrom(this.api.get<{ event: EventDetail }>(`/events/${id}`));
    this.event = res.event;
  }
}
