import { Component, OnInit, inject } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../core/api.service";

interface AvailableRepo {
  githubRepoId: string;
  fullName: string;
  private: boolean;
  description: string | null;
  connected: boolean;
}

@Component({
  selector: "app-repositories",
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <h2>Repositories</h2>
    <p *ngIf="loading">Loading repositories from GitHub...</p>
    <p *ngIf="error" style="color:#f85149">{{ error }}</p>
    <div class="card" *ngFor="let repo of repos">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>{{ repo.fullName }}</strong>
          <div style="opacity:0.7">{{ repo.description }}</div>
        </div>
        <button class="btn" [disabled]="repo.connected || connecting === repo.githubRepoId" (click)="connect(repo)">
          {{ repo.connected ? "Connected" : "Connect" }}
        </button>
      </div>
    </div>
  `,
})
export class RepositoriesComponent implements OnInit {
  private api = inject(ApiService);
  repos: AvailableRepo[] = [];
  loading = true;
  error: string | null = null;
  connecting: string | null = null;

  async ngOnInit() {
    try {
      const res = await firstValueFrom(this.api.get<{ repositories: AvailableRepo[] }>("/repos/available"));
      this.repos = res.repositories;
    } catch {
      this.error = "Failed to load repositories from GitHub.";
    } finally {
      this.loading = false;
    }
  }

  async connect(repo: AvailableRepo) {
    this.connecting = repo.githubRepoId;
    try {
      await firstValueFrom(
        this.api.post("/repos/connect", { githubRepoId: repo.githubRepoId, fullName: repo.fullName })
      );
      repo.connected = true;
    } catch {
      this.error = `Failed to connect ${repo.fullName}.`;
    } finally {
      this.connecting = null;
    }
  }
}
