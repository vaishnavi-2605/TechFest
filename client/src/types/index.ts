export interface Event {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: "Technical" | "Non-Technical" | "Workshops";
  teamSize: string;
  prize: string;
  displayPrize?: string;
  deadline: string;
  eventId?: string;
  department?: string;
  fee?: number;
  shortDescription?: string;
  posterUrl?: string;
  address?: string;
  guide?: string;
  guidePhone?: string;
  venue?: string;
  time?: string;
  day?: 1 | 2;
  isSignatureEvent?: boolean;
  registrationClosed?: boolean;
}

export interface BackendSubEvent {
  subEventId: string;
  title: string;
  description: string;
  isTeamEvent?: boolean;
  teamSize?: number;
  fee?: number;
  address?: string;
  time?: string;
  guide?: string;
  guidePhone?: string;
  rules?: string[];
}

export interface BackendEvent {
  _id?: string;
  eventId: string;
  department: string;
  title: string;
  shortDescription?: string;
  displayCategory?: string;
  displayTeamSize?: string;
  displayPrize?: string;
  displayDeadline?: string;
  eventType?: string;
  description: string;
  fee: number;
  isTeamEvent?: boolean;
  teamSize?: number;
  time?: string;
  address?: string;
  guide?: string;
  guidePhone?: string;
  posterUrl?: string;
  paymentQrUrl?: string;
  whatsappGroupLink?: string;
  rules?: string[];
  subEvents?: BackendSubEvent[];
  status?: string;
  isSignatureEvent?: boolean;
  registrationClosed?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  team: "Core Team" | "Technical" | "Marketing" | "Design";
  avatar: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo?: string;
  tier: "Title" | "Gold" | "Silver";
  url?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface PublicCoordinator {
  id: string;
  name: string;
  username?: string;
  email?: string;
  department?: string;
  phone?: string;
  photoUrl?: string;
  role?: string;
  eventCount?: number;
}
