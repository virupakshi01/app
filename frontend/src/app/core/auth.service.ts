import { Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";

export interface CurrentUser {
  id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  readonly user = signal<CurrentUser | null>(null);
  readonly checked = signal(false);

  constructor(private api: ApiService) {}

  async loadCurrentUser(): Promise<CurrentUser | null> {
    try {
      const user = await firstValueFrom(this.api.get<CurrentUser>("/auth/me"));
      this.user.set(user);
      return user;
    } catch {
      this.user.set(null);
      return null;
    } finally {
      this.checked.set(true);
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.api.post("/auth/logout"));
    this.user.set(null);
  }
}
