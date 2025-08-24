export interface UserInfo {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface QueryFilter {
  [key: string]: any;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  emojiId?: string;
  animated?: boolean;
}

export interface ReactionMap {
  [emoji: string]: MessageReaction;
}
