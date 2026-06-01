export type ExperimentStatus = 'started' | 'completed';

export interface Experiment {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  is_published: boolean;
  order: number;
  created_at: string;
}

export interface UserExperiment {
  id: string;
  user_id: string;
  experiment_id: string;
  status: ExperimentStatus;
  xp_earned: number;
  started_at: string;
  completed_at: string | null;
}
