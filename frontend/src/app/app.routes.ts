import { Routes } from "@angular/router";
import { authGuard } from "./core/auth.guard";
import { LoginComponent } from "./pages/login/login.component";
import { DashboardShellComponent } from "./pages/dashboard-shell/dashboard-shell.component";
import { RepositoriesComponent } from "./pages/repositories/repositories.component";
import { RulesComponent } from "./pages/rules/rules.component";
import { EventsComponent } from "./pages/events/events.component";
import { EventDetailComponent } from "./pages/event-detail/event-detail.component";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "dashboard" },
  { path: "login", component: LoginComponent },
  {
    path: "dashboard",
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "repositories" },
      { path: "repositories", component: RepositoriesComponent },
      { path: "rules", component: RulesComponent },
      { path: "events", component: EventsComponent },
      { path: "events/:id", component: EventDetailComponent },
    ],
  },
  { path: "**", redirectTo: "dashboard" },
];
