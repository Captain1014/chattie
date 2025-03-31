import { Timestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export type AuthError = FirebaseError; 