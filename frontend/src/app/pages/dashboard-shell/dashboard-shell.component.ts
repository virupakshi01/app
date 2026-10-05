import { Component, inject } from "@angular/core";
import { NgIf } from "@angular/common";
import { RouterLink, RouterOutlet } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-dashboard-shell",
  standalone: true,
  imports: [NgIf, RouterLink, RouterOutlet],
  template: `
    <div class="container">
      <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <nav style="display:flex; gap:16px;">
          <a routerLink="/dashboard/repositories">Repositories</a>
          <a routerLink="/dashboard/rules">Rules</a>
          <a routerLink="/dashboard/events">Events</a>
        </nav>
        <div>
          <span *ngIf="auth.user() as u">{{ u.username }}</span>
          <button class="btn secondary" (click)="logout()" style="margin-left:12px;">Logout</button>
        </div>
      </header>
      <router-outlet></router-outlet>
    </div>
  `,
})
export class DashboardShellComponent {
  auth = inject(AuthService);

  async logout() {
    await this.auth.logout();
    location.href = "/login";
  }
}
