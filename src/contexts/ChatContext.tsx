// ChatContext.tsx
// 이 파일은 채팅 관련 기능을 관리하는 Context를 정의합니다.
// 주요 기능:
// 1. 채팅방 목록 관리 및 실시간 업데이트
// 2. 현재 선택된 채팅방 상태 관리
// 3. 메시지 목록 관리 및 실시간 업데이트
// 4. 채팅방 생성, 삭제, 참여 기능
// 5. 메시지 전송 및 읽음 표시 기능
//
// 이 Context는 Firebase Firestore를 사용하여 데이터를 저장하고 실시간으로 동기화합니다.
// useAuth 훅을 통해 현재 로그인된 사용자 정보를 가져와 사용합니다.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { ChatRoom, Message } from '../types';

interface ChatContextType {
  chatRooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Message[];
  createChatRoom: (name: string, password?: string) => Promise<string>;
  deleteChatRoom: (roomId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  setCurrentRoom: (room: ChatRoom | null) => void;
  joinChatRoom: (roomId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }): React.ReactElement => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) {
      console.log('사용자가 로그인되지 않았습니다.');
      return;
    }

    console.log('채팅방 목록을 가져오는 중...', user.uid);
    const roomsQuery = query(
      collection(db, 'chatRooms'),
      orderBy('updatedAt', 'desc')  // 최신 채팅방이 먼저 보이도록 정렬
    );

    const unsubscribe = onSnapshot(roomsQuery, 
      (snapshot) => {
        console.log('채팅방 스냅샷 업데이트:', snapshot.docs.length, '개의 채팅방');
        const rooms = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            password: data.password,
            ownerId: data.ownerId,
            participants: data.participants,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastMessage: data.lastMessage
          };
        }) as ChatRoom[];
        console.log('처리된 채팅방:', rooms);
        setChatRooms(rooms);
      },
      (error) => {
        console.error('채팅방 목록 가져오기 에러:', error);
      }
    );

    return () => {
      console.log('채팅방 리스너 정리');
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!currentRoom) {
      console.log('선택된 채팅방이 없습니다.');
      setMessages([]);
      return;
    }

    console.log('메시지 목록을 가져오는 중...', currentRoom.id);
    const messagesQuery = query(
      collection(db, `chatRooms/${currentRoom.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, 
      (snapshot) => {
        console.log('메시지 스냅샷 업데이트:', snapshot.docs.length, '개의 메시지');
        const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content,
            senderId: data.senderId,
            timestamp: data.timestamp as Timestamp,
            read: data.read
          };
        });
        console.log('처리된 메시지:', newMessages);
        setMessages(newMessages);
      },
      (error) => {
        console.error('메시지 목록 가져오기 에러:', error);
      }
    );

    return () => {
      console.log('메시지 리스너 정리');
      unsubscribe();
    };
  }, [currentRoom]);

  const createChatRoom = async (name: string, password?: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('새 채팅방 생성 중...', { userId: user.uid, name, hasPassword: !!password });
    try {
      const newRoom = {
        name,
        password: password || null,
        ownerId: user.uid,
        participants: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Creating room with data:', newRoom);
      const docRef = await addDoc(collection(db, 'chatRooms'), newRoom);
      console.log('채팅방 생성 성공:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('채팅방 생성 에러:', error);
      throw error;
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    try {
      await deleteDoc(doc(db, 'chatRooms', roomId));
      console.log('채팅방이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('채팅방 삭제 에러:', error);
      throw error;
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentRoom) throw new Error('User not authenticated or no room selected');

    console.log('메시지 전송 중...', { roomId: currentRoom.id, content });
    const newMessage = {
      senderId: user.uid,
      content,
      timestamp: serverTimestamp(),
      read: false
    };

    try {
      const messageRef = await addDoc(
        collection(db, `chatRooms/${currentRoom.id}/messages`),
        newMessage
      );
      console.log('메시지 전송 성공:', messageRef.id);

      // Update last message in chat room
      await updateDoc(doc(db, `chatRooms/${currentRoom.id}`), {
        lastMessage: {
          ...newMessage,
          id: messageRef.id
        },
        updatedAt: serverTimestamp()
      });
      console.log('채팅방 마지막 메시지 업데이트 성공');
    } catch (error) {
      console.error('메시지 전송 에러:', error);
      throw error;
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!currentRoom) return;

    try {
      await updateDoc(doc(db, `chatRooms/${currentRoom.id}/messages/${messageId}`), {
        read: true
      });
      console.log('메시지 읽음 처리 성공:', messageId);
    } catch (error) {
      console.error('메시지 읽음 처리 에러:', error);
      throw error;
    }
  };

  const joinChatRoom = async (roomId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const roomRef = doc(db, 'chatRooms', roomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(user.uid)
      });
      console.log('채팅방 참여 성공:', roomId);
    } catch (error) {
      console.error('채팅방 참여 에러:', error);
      throw error;
    }
  };

  const value = {
    chatRooms,
    currentRoom,
    messages,
    createChatRoom,
    deleteChatRoom,
    sendMessage,
    markAsRead,
    setCurrentRoom,
    joinChatRoom
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 