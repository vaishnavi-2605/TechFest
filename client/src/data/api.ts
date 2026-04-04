import { BackendEvent, Sponsor } from "@/types";

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem("techfestAuth") || "null");
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers || {});

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if ((options as RequestInit & { useAuth?: boolean }).useAuth) {
    const token = getStoredAuth()?.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Request failed.";
    try {
      const payload = await response.json();
      if (payload?.error) message = payload.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchEvents() {
  return request<{ events: BackendEvent[] }>("/api/events");
}

export function fetchEventStats() {
  return request<{ stats: { eventCount: number; participantCount: number; sponsorCount: number; prizePool: number } }>("/api/events/stats");
}

export function fetchEvent(eventId: string) {
  return request<{ event: BackendEvent }>(`/api/events/${eventId}`);
}

export function fetchPublicCoordinators() {
  return request<{ coordinators: Record<string, unknown>[] }>("/api/events/coordinators/public");
}

export function fetchSponsors() {
  return request<{ sponsors: Sponsor[] }>("/api/sponsors");
}

export function createRegistration(payload: Record<string, unknown>) {
  return request<{ message: string; registration: unknown }>("/api/registrations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitContactMessage(payload: Record<string, unknown>) {
  return request<{ message: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return request<{ token: string; user: Record<string, unknown> }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerCoordinator(payload: FormData) {
  return request<{ token: string; user: Record<string, unknown> }>("/api/auth/register-coordinator", {
    method: "POST",
    body: payload,
  });
}

export function fetchAdminCoordinators() {
  return request<{ coordinators: Record<string, unknown>[] }>("/api/admin/coordinators", {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchAdminCoordinatorDetails(id: string) {
  return request<{ coordinator: Record<string, unknown> }>(`/api/admin/coordinators/${id}`, {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function deleteAdminCoordinator(id: string) {
  return request<{ message: string }>(`/api/admin/coordinators/${id}`, {
    method: "DELETE",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function updateAdminEventStatus(eventId: string, status: "pending" | "active") {
  return request<{ message: string; event: Record<string, unknown> }>(`/api/admin/events/${eventId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function deleteAdminEvent(eventId: string) {
  return request<{ message: string }>(`/api/admin/events/${eventId}`, {
    method: "DELETE",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchAdminUnreadMessageCount() {
  return request<{ unreadCount: number }>("/api/admin/messages/unread-count", {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchAdminMessages() {
  return request<{ messages: Record<string, unknown>[] }>("/api/admin/messages", {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function markAdminMessageRead(id: string) {
  return request<{ message: string }>(`/api/admin/messages/${id}/read`, {
    method: "PATCH",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function deleteAdminMessage(id: string) {
  return request<{ message: string }>(`/api/admin/messages/${id}`, {
    method: "DELETE",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchAdminRegistrations() {
  return request<{ registrations: Record<string, unknown>[] }>("/api/admin/registrations", {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchCoordinatorMe() {
  return request<{ coordinator: Record<string, unknown>; events: BackendEvent[] }>("/api/coordinator/me", {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function markCoordinatorNotificationsRead() {
  return request<{ message: string }>("/api/coordinator/notifications/read", {
    method: "PATCH",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchCoordinatorParticipants() {
  return request<{ participants: Record<string, unknown>[] }>("/api/coordinator/participants", {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchCoordinatorSponsors() {
  return request<{ sponsors: Sponsor[] }>("/api/coordinator/sponsors", {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function addCoordinatorSponsor(payload: { name: string; tier: Sponsor["tier"]; url?: string }) {
  return request<{ message: string; sponsor: Sponsor }>("/api/coordinator/sponsors", {
    method: "POST",
    body: JSON.stringify(payload),
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function deleteCoordinatorSponsor(id: string) {
  return request<{ message: string }>(`/api/coordinator/sponsors/${id}`, {
    method: "DELETE",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function addCoordinatorEvent(payload: FormData) {
  return request<{ message: string; event: BackendEvent }>("/api/coordinator/events", {
    method: "POST",
    body: payload,
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function updateCoordinatorProfile(payload: FormData) {
  return request<{ message: string; coordinator: Record<string, unknown> }>("/api/coordinator/me", {
    method: "PUT",
    body: payload,
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function fetchCoordinatorEvent(id: string) {
  return request<{ event: BackendEvent }>(`/api/coordinator/events/${id}`, {
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function updateCoordinatorEvent(id: string, payload: FormData) {
  return request<{ message: string; event: BackendEvent }>(`/api/coordinator/events/${id}`, {
    method: "PUT",
    body: payload,
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function updateCoordinatorRegistrationStatus(id: string, closed: boolean) {
  return request<{ message: string; event: BackendEvent }>(`/api/coordinator/events/${id}/registration`, {
    method: "PATCH",
    body: JSON.stringify({ closed }),
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function removeDemoParticipants() {
  return request<{ deleted: number }>("/api/coordinator/participants/demo", {
    method: "DELETE",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function deleteParticipant(id: string) {
  return request<{ message: string }>(`/api/coordinator/participants/${id}`, {
    method: "DELETE",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}

export function deleteCoordinatorEvent(id: string) {
  return request<{ message: string }>(`/api/coordinator/events/${id}`, {
    method: "DELETE",
    useAuth: true,
  } as RequestInit & { useAuth: boolean });
}
