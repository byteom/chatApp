export interface Message {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  replies?: Message[];
  reactions?: Record<string, number>;
}

export type Reaction = '👍' | '❤️' | '😂' | '😮' | '😢' | '🙏';