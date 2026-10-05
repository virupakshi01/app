import { Component, OnInit, inject } from "@angular/core";
import { JsonPipe, NgFor, NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/api.service";

interface ConnectedRepo {
  id: string;
  fullName: string;
}

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    eventType?: string;
    action?: string;
    titleKeywords?: string[];
    author?: string;
    labels?: string[];
  };
  actions: {
    addLabel?: string;
    postComment?: string;
    slackNotify?: boolean;
  };
}

@Component({
  selector: "app-rules",
  standalone: true,
  imports: [NgFor, NgIf, JsonPipe, FormsModule],
  template: `
    <h2>Rules</h2>

    <div class="card">
      <label>Repository: </label>
      <select [(ngModel)]="selectedRepoId" (ngModelChange)="loadRules()">
        <option *ngFor="let r of repos" [value]="r.id">{{ r.fullName }}</option>
      </select>
    </div>

    <div class="card" *ngIf="selectedRepoId">
      <h3>New rule</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <input placeholder="Rule name" [(ngModel)]="draft.name" />
        <input placeholder="Event type (issues / pull_request / push)" [(ngModel)]="draft.eventType" />
        <input placeholder="Action (opened, closed, ...)" [(ngModel)]="draft.action" />
        <input placeholder="Title keywords (comma separated)" [(ngModel)]="draft.titleKeywords" />
        <input placeholder="Author" [(ngModel)]="draft.author" />
        <input placeholder="Labels (comma separated)" [(ngModel)]="draft.labels" />
        <input placeholder="Add label (action)" [(ngModel)]="draft.addLabel" />
        <input placeholder="Post comment (action)" [(ngModel)]="draft.postComment" />
        <label><input type="checkbox" [(ngModel)]="draft.slackNotify" /> Notify Slack</label>
      </div>
      <button class="btn" style="margin-top:8px;" (click)="createRule()">Create rule</button>
    </div>

    <div class="card" *ngFor="let rule of rules">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>{{ rule.name }}</strong>
          <span [style.opacity]="rule.enabled ? 1 : 0.5"> ({{ rule.enabled ? "enabled" : "disabled" }})</span>
          <pre style="white-space:pre-wrap; opacity:0.8;">{{ rule.conditions | json }} -> {{ rule.actions | json }}</pre>
        </div>
        <div>
          <button class="btn secondary" (click)="toggle(rule)">{{ rule.enabled ? "Disable" : "Enable" }}</button>
          <button class="btn secondary" (click)="remove(rule)">Delete</button>
        </div>
      </div>
    </div>
  `,
})
export class RulesComponent implements OnInit {
  private api = inject(ApiService);
  repos: ConnectedRepo[] = [];
  rules: Rule[] = [];
  selectedRepoId = "";

  draft = {
    name: "",
    eventType: "",
    action: "",
    titleKeywords: "",
    author: "",
    labels: "",
    addLabel: "",
    postComment: "",
    slackNotify: false,
  };

  async ngOnInit() {
    const res = await firstValueFrom(this.api.get<{ repositories: ConnectedRepo[] }>("/repos"));
    this.repos = res.repositories;
    if (this.repos.length > 0) {
      this.selectedRepoId = this.repos[0].id;
      await this.loadRules();
    }
  }

  async loadRules() {
    if (!this.selectedRepoId) return;
    const res = await firstValueFrom(
      this.api.get<{ rules: Rule[] }>("/rules", { repositoryId: this.selectedRepoId })
    );
    this.rules = res.rules;
  }

  async createRule() {
    const csv = (v: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined);
    await firstValueFrom(
      this.api.post("/rules", {
        repositoryId: this.selectedRepoId,
        name: this.draft.name || "Untitled rule",
        enabled: true,
        conditions: {
          eventType: this.draft.eventType || undefined,
          action: this.draft.action || undefined,
          titleKeywords: csv(this.draft.titleKeywords),
          author: this.draft.author || undefined,
          labels: csv(this.draft.labels),
        },
        actions: {
          addLabel: this.draft.addLabel || undefined,
          postComment: this.draft.postComment || undefined,
          slackNotify: this.draft.slackNotify || undefined,
        },
      })
    );
    await this.loadRules();
  }

  async toggle(rule: Rule) {
    await firstValueFrom(this.api.patch(`/rules/${rule.id}`, { enabled: !rule.enabled }));
    await this.loadRules();
  }

  async remove(rule: Rule) {
    await firstValueFrom(this.api.delete(`/rules/${rule.id}`));
    await this.loadRules();
  }
}
