import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../contexts/ChatContext';
import { Timestamp } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../styles/ChatRoom.css';
import { motion, AnimatePresence } from 'framer-motion';

const ChatRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { currentRoom, messages, sendMessage, markAsRead } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: { displayName: string; photoURL: string | null }}>({});

  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const senderIds = [...new Set(messages.map(m => m.senderId))];
      const profiles: {[key: string]: { displayName: string; photoURL: string | null }} = {};
      
      for (const senderId of senderIds) {
        if (!userProfiles[senderId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', senderId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              profiles[senderId] = {
                displayName: userData.displayName || userData.email || '알 수 없는 사용자',
                photoURL: userData.photoURL
              };
            }
          } catch (error) {
            console.error('사용자 프로필 가져오기 에러:', error);
          }
        }
      }
      
      setUserProfiles(prev => ({ ...prev, ...profiles }));
    };

    fetchUserProfiles();
  }, [messages]);

  // 채팅방이 없으면 목록으로 이동
  useEffect(() => {
    if (!currentRoom || currentRoom.id !== params.id) {
      navigate('/');
    }
  }, [currentRoom, navigate, params.id]);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 읽지 않은 메시지 처리
  useEffect(() => {
    if (!currentRoom || !user) return;

    messages.forEach((message) => {
      if (!message.read && message.senderId !== user.uid) {
        markAsRead(message.id);
      }
    });
  }, [messages, currentRoom, user, markAsRead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    try {
      setIsLoading(true);
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 에러:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const formatTime = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp.toDate());
  };

  if (!currentRoom || !user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a' }}
    >
      {/* 헤더 */}
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        style={{ backgroundColor: '#2d2d2d', borderBottom: '1px solid #383838', padding: '0.75rem 1rem' }}
      >
        <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                color: '#ff8200',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ← Back
            </motion.button>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ffffff' }}
            >
              {currentRoom?.name}
            </motion.h1>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: '0.875rem', color: '#888888' }}
          >
            {currentRoom?.participants.length} people joined
          </motion.div>
        </div>
      </motion.div>

      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#1a1a1a' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ textAlign: 'center', color: '#888888', padding: '2rem 0' }}
              >
                No messages yet. Send a message first!
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, x: message.senderId === user?.uid ? 20 : -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.senderId === user?.uid ? 'flex-end' : 'flex-start',
                    gap: '0.25rem'
                  }}
                >
                  {message.senderId !== user?.uid && userProfiles[message.senderId] && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}
                    >
                      {userProfiles[message.senderId].photoURL ? (
                        <motion.img 
                          whileHover={{ scale: 1.1 }}
                          src={userProfiles[message.senderId].photoURL || ''} 
                          alt="Profile" 
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }} 
                        />
                      ) : (
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            backgroundColor: '#2d2d2d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: '#ff8200'
                          }}
                        >
                          {userProfiles[message.senderId].displayName.charAt(0).toUpperCase()}
                        </motion.div>
                      )}
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ fontSize: '0.875rem', color: '#ff8200' }}
                      >
                        {userProfiles[message.senderId].displayName}
                      </motion.span>
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    style={{
                      maxWidth: '70%',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: message.senderId === user?.uid ? '#ff8200' : '#2d2d2d',
                      color: 'white',
                      border: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', wordBreak: 'break-word', margin: 0 }}>{message.content}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.25rem', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {formatTime(message.timestamp)}
                      </span>
                      {message.senderId === user?.uid && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                          {message.read ? 'Read' : 'Sent'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 메시지 입력 */}
      <motion.div 
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        style={{ backgroundColor: '#2d2d2d', borderTop: '1px solid #383838', padding: '1rem' }}
      >
        <form onSubmit={handleSubmit} style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message..."
            className="message-input"
            style={{
              flex: 1,
              borderRadius: '0.5rem',
              border: '1px solid #383838',
              padding: '0.5rem 1rem',
              outline: 'none',
              fontSize: '1rem',
              backgroundColor: '#1a1a1a',
              color: 'white'
            }}
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ff8200',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              fontSize: '1rem'
            }}
            disabled={isLoading}
          >
            Send
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ChatRoomPage; 