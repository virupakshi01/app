import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { API_BASE_URL } from "./config";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string>) {
    return this.http.get<T>(`${API_BASE_URL}${path}`, { withCredentials: true, params });
  }

  post<T>(path: string, body: unknown = {}) {
    return this.http.post<T>(`${API_BASE_URL}${path}`, body, { withCredentials: true });
  }

  patch<T>(path: string, body: unknown = {}) {
    return this.http.patch<T>(`${API_BASE_URL}${path}`, body, { withCredentials: true });
  }

  delete<T>(path: string) {
    return this.http.delete<T>(`${API_BASE_URL}${path}`, { withCredentials: true });
  }

  loginUrl(): string {
    return `${API_BASE_URL}/auth/github`;
  }
}
