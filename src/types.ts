import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export type User = FirebaseUser;

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  password?: string;
  ownerId: string;
  participants: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessage?: Message;
}

export interface AuthError {
  code: string;
  message: string;
  stack?: string;
} 