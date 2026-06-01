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
import type { ApiClient } from './client';
import {
  currentUser,
  currentUserCredits,
  currentUserSubscription,
  mockGenerations,
  mockProjects,
  mockChatMessages,
  mockExperiments,
  mockUsers,
  mockUserRatings,
  mockBadges,
} from '@/lib/mock';

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));
}

export class MockApiClient implements ApiClient {
  async getProfile(): Promise<User> {
    await delay();
    return currentUser;
  }

  async getCredits(): Promise<UserCredits> {
    await delay();
    return currentUserCredits;
  }

  async getGenerations(): Promise<Generation[]> {
    await delay();
    return mockGenerations;
  }

  async createGeneration(prompt: string, type: GenerationType): Promise<Generation> {
    await delay();
    const newGeneration: Generation = {
      id: `gen-${Date.now()}`,
      user_id: currentUser.id,
      type,
      status: 'pending',
      prompt,
      result_url: null,
      credits_spent: type === 'video' ? 20 : type === 'mascot' ? 15 : type === 'avatar' ? 10 : 5,
      provider: type === 'video' ? 'kling' : 'nanobanana',
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return newGeneration;
  }

  async getProjects(): Promise<Project[]> {
    await delay();
    return mockProjects;
  }

  async getProjectMessages(projectId: string): Promise<ChatMessage[]> {
    await delay();
    return mockChatMessages.filter((msg) => msg.project_id === projectId);
  }

  async getExperiments(): Promise<Experiment[]> {
    await delay();
    return mockExperiments;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    await delay();
    const leaderboard: LeaderboardEntry[] = mockUsers
      .map((user) => {
        const rating = mockUserRatings.find((r) => r.user_id === user.id);
        return {
          user,
          rating: rating ?? {
            user_id: user.id,
            total_xp: 0,
            rank: 999,
            badges_count: 0,
            updated_at: new Date().toISOString(),
          },
        };
      })
      .sort((a, b) => b.rating.total_xp - a.rating.total_xp);
    return leaderboard;
  }

  async getBadges(): Promise<Badge[]> {
    await delay();
    return mockBadges;
  }

  async getSubscription(): Promise<Subscription | null> {
    await delay();
    return currentUserSubscription;
  }
}
