import type {
  User,
  UserCredits,
  Generation,
  GenerationType,
  Project,
  ChatMessage,
  Experiment,
  LeaderboardEntry,
  Badge,
  Subscription,
} from '@/types';

export interface ApiClient {
  getProfile(): Promise<User>;
  getCredits(): Promise<UserCredits>;
  getGenerations(): Promise<Generation[]>;
  createGeneration(prompt: string, type: GenerationType): Promise<Generation>;
  getProjects(): Promise<Project[]>;
  getProjectMessages(projectId: string): Promise<ChatMessage[]>;
  getExperiments(): Promise<Experiment[]>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  getBadges(): Promise<Badge[]>;
  getSubscription(): Promise<Subscription | null>;
}
