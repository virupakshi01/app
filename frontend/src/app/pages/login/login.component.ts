import { Component, inject } from "@angular/core";
import { ApiService } from "../../core/api.service";

@Component({
  selector: "app-login",
  standalone: true,
  template: `
    <div class="container">
      <div class="card" style="text-align:center; margin-top: 80px;">
        <h1>GitHub Automation Bot</h1>
        <p>Connect your GitHub account to manage webhooks, rules and automations.</p>
        <a class="btn" [href]="loginUrl">Sign in with GitHub</a>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private api = inject(ApiService);
  loginUrl = this.api.loginUrl();
}
