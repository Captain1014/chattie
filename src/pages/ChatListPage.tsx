import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../contexts/ChatContext';
import { ChatRoom } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Stars, 
  OrbitControls, 
  Caustics, 
  Environment, 
  MeshTransmissionMaterial 
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { easing } from 'maath';

// 3D 유리구슬 컴포넌트
const GlassBall: React.FC<{
  position: [number, number, number];
  color: string;
  size: number;
  onClick: () => void;
}> = ({ position, color, size, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Caustics
      color={color}
      position={[0, -0.5, 0]}
      lightSource={[5, 5, -10]}
      worldRadius={0.01}
      ior={1.2}
      intensity={0.005}
      causticsOnly={false}
      backside={false}
    >
      <mesh 
        position={position}
        onClick={onClick}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        scale={hovered ? [1.2, 1.2, 1.2] : [1, 1, 1]}
        castShadow 
        receiveShadow
      >
        <sphereGeometry args={[size, 64, 64]} />
        <MeshTransmissionMaterial 
          resolution={1024}
          distortion={0.25}
          color={color}
          thickness={1}
          anisotropy={1}
        />
      </mesh>
    </Caustics>
  );
};

// 카메라 움직임을 위한 컴포넌트
const CameraController = () => {
  useFrame((state, delta) => {
    easing.damp3(
      state.camera.position,
      [
        Math.sin(state.pointer.x / 4) * 15,
        2 + state.pointer.y,
        Math.cos(state.pointer.x / 4) * 15
      ],
      0.5,
      delta
    );
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { chatRooms, setCurrentRoom, createChatRoom, deleteChatRoom, joinChatRoom } = useChat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [roomToEnter, setRoomToEnter] = useState<ChatRoom | null>(null);
  const [roomPassword, setRoomPassword] = useState('');
  const [participantNames, setParticipantNames] = useState<{ [key: string]: string }>({});
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);

  useEffect(() => {
    console.log('현재 채팅방 목록:', chatRooms);
  }, [chatRooms]);

  useEffect(() => {
    const fetchParticipantNames = async () => {
      const names: { [key: string]: string } = {};
      console.log('Fetching names for rooms:', chatRooms);
      
      for (const room of chatRooms) {
        // 방장 정보 가져오기
        if (room.ownerId && !names[room.ownerId]) {
          try {
            console.log('Fetching owner info for:', room.ownerId);
            if (room.ownerId === user?.uid) {
              console.log('Owner is current user:', user);
              names[room.ownerId] = user.displayName || user.email || 'Stranger';
            } else {
              const ownerDoc = await getDoc(doc(db, 'users', room.ownerId));
              console.log('Owner doc exists:', ownerDoc.exists(), 'Data:', ownerDoc.data());
              if (ownerDoc.exists()) {
                const ownerData = ownerDoc.data();
                names[room.ownerId] = ownerData.displayName || ownerData.email || 'Stranger';
              } else {
                names[room.ownerId] = 'Stranger';
              }
            }
          } catch (error) {
            console.error('방장 정보 가져오기 에러:', error);
            names[room.ownerId] = 'Stranger';
          }
        }

        // 참여자 정보 가져오기
        for (const participantId of room.participants) {
          if (!names[participantId]) {
            try {
              console.log('Fetching participant info for:', participantId);
              if (participantId === user?.uid) {
                console.log('Participant is current user:', user);
                names[participantId] = user.displayName || user.email || 'Stranger';
                continue;
              }
              
              const userDoc = await getDoc(doc(db, 'users', participantId));
              console.log('Participant doc exists:', userDoc.exists(), 'Data:', userDoc.data());
              if (userDoc.exists()) {
                const userData = userDoc.data();
                names[participantId] = userData.displayName || userData.email || 'Stranger';
              } else {
                names[participantId] = 'Stranger';
              }
            } catch (error) {
              console.error('사용자 정보 가져오기 에러:', error);
              names[participantId] = 'Stranger';
            }
          }
        }
      }
      console.log('최종 참여자 및 방장 이름:', names);
      setParticipantNames(names);
    };

    if (chatRooms.length > 0 && user) {
      fetchParticipantNames();
    }
  }, [chatRooms, user]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || isCreating || !user) return;

    try {
      setIsCreating(true);
      const roomId = await createChatRoom(
        newRoomName.trim(),
        newRoomPassword.trim() || undefined
      );
      console.log('새로운 채팅방이 생성되었습니다:', roomId);
      setIsModalOpen(false);
      setNewRoomName('');
      setNewRoomPassword('');
    } catch (error) {
      console.error('채팅방 생성 에러:', error);
      alert('채팅방 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    setRoomToDelete(roomId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      await deleteChatRoom(roomToDelete);
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
      setIsPasswordModalOpen(false);
      setSelectedRoom(null);
      setRoomToDelete(null);
    } catch (error) {
      console.error('채팅방 삭제 에러:', error);
      alert('채팅방 삭제에 실패했습니다.');
    }
  };

  const handleRoomClick = async (room: ChatRoom) => {
    console.log('채팅방 클릭:', room);
    if (room.participants[0] === user?.uid || !room.password) {
      try {
        await joinChatRoom(room.id);
        setCurrentRoom(room);
        navigate(`/chat/${room.id}`);
      } catch (error) {
        console.error('채팅방 입장 에러:', error);
        alert('채팅방 입장에 실패했습니다.');
      }
    } else {
      setRoomToEnter(room);
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomToEnter) return;

    if (roomPassword === roomToEnter.password) {
      try {
        await joinChatRoom(roomToEnter.id);
        setCurrentRoom(roomToEnter);
        navigate(`/chat/${roomToEnter.id}`);
        setIsPasswordModalOpen(false);
        setRoomPassword('');
        setRoomToEnter(null);
      } catch (error) {
        console.error('채팅방 입장 에러:', error);
        alert('채팅방 입장에 실패했습니다.');
      }
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  // 채팅방 위치 계산
  const getRoomPosition = (index: number): [number, number, number] => {
    const radius = 5;
    const angle = (index / chatRooms.length) * Math.PI * 2;
    return [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    ];
  };

  const handleStarClick = (room: ChatRoom) => {
    setSelectedRoom(room);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: '100vh', overflow: 'hidden', backgroundColor: 'black' }}
    >
      {/* 상단 정보 */}
      <div className="top-bar" style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10,
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
      }}>
        <div className="top-bar-content" style={{ 
          maxWidth: '1024px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <motion.h1 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#ff8200' 
              }}
            >
              ({chatRooms.length}) Chatties
            </motion.h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: '#ff8200',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Create a new chat
            </motion.button>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'white' }}>
              {user?.displayName || user?.email}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: '#DC2626',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Logout
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3D 캔버스 */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Canvas 
          shadows 
          camera={{ position: [-20, 0.5, 5], fov: 45 }}
          eventSource={document.body}
          eventPrefix="client"
        >
          <CameraController />
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.5 * Math.PI} />
          <spotLight decay={0} position={[5, 5, -10]} angle={0.15} penumbra={1} />
          <pointLight decay={0} position={[-10, -10, -10]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.1} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
          
          <Environment preset="night" />
          
          {chatRooms.map((room, index) => (
            <GlassBall
              key={room.id}
              position={getRoomPosition(index)}
              color={room.password ? '#ff8200' : '#4f46e5'}
              size={0.5}
              onClick={() => handleStarClick(room)}
            />
          ))}
          
          <EffectComposer>
            <Bloom luminanceThreshold={1} intensity={2} levels={1} mipmapBlur />
          </EffectComposer>
        </Canvas>

        {/* 클릭 시 상세 정보 팝업 */}
        <AnimatePresence>
          {selectedRoom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="room-detail-popup"
              style={{
                position: 'absolute',
                top: '50%',
                left: '10%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                padding: '2rem',
                borderRadius: '1rem',
                color: 'white',
                minWidth: '300px',
                maxWidth: '90%',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 20px rgba(255, 130, 0, 0.3)',
                border: '1px solid rgba(255, 130, 0, 0.2)',
                zIndex: 20
              }}
            >
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: '#ff8200',
                  marginBottom: '1rem'
                }}
              >
                {selectedRoom.name}
                {selectedRoom.password && (
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    style={{ marginLeft: '0.5rem', fontSize: '1rem' }}
                  >
                    🔒
                  </motion.span>
                )}
              </motion.h2>
              {/* Close pop up button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedRoom(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem' }}
              >
                ✕
              </motion.button>

              {/* Room info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="room-info"
                style={{ marginBottom: '1rem' }}
              >
                <p style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                  Chatters: {selectedRoom.participants.map(id => participantNames[id] || 'Stranger').join(', ')}
                </p>
                <p style={{ color: '#ff8200' }}>
                  Moderator: {participantNames[selectedRoom.ownerId] || 'Stranger'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="button-group"
                style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRoomClick(selectedRoom)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ff8200',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  Enter
                </motion.button>
                {selectedRoom.ownerId === user?.uid && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleDeleteClick(e, selectedRoom.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#DC2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 모달들 */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 30
            }}
          >
            <div style={{
              backgroundColor: 'black',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '28rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#ff8200' }}>
                Create a new chat
              </h2>
              <form onSubmit={handleCreateRoom}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'white', marginBottom: '0.25rem' }}>
                      Chat name
                    </label>
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Enter a chat name"
                      style={{
                        width: '85%',
                        padding: '0.5rem 1rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.5rem',
                        outline: 'none'
                      }}
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                      Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={newRoomPassword}
                      onChange={(e) => setNewRoomPassword(e.target.value)}
                      placeholder="Enter a password"
                      style={{
                        width: '85%',
                        padding: '0.5rem 1rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.5rem',
                        outline: 'none'
                      }}
                      disabled={isCreating}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      backgroundColor: '#F3F4F6',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: isCreating ? '#93C5FD' : '#ff8200',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: isCreating ? 'not-allowed' : 'pointer',
                      opacity: isCreating ? 0.5 : 1
                    }}
                    disabled={isCreating}
                    onMouseOver={(e) => !isCreating && (e.currentTarget.style.backgroundColor = '#ff8200')}
                    onMouseOut={(e) => !isCreating && (e.currentTarget.style.backgroundColor = '#ff8200')}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'black',
            color: 'white', 
            borderRadius: '0.5rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '28rem',
            margin: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Delete a chat
            </h2>
            <p style={{ color: '#4B5563', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this chat?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRoomToDelete(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#DC2626',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#B91C1C'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 확인 모달 */}
      {isPasswordModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'black',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '28rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Password verification
            </h2>
            <p style={{ color: '#4B5563', marginBottom: '1rem' }}>
              Enter the password for {roomToEnter?.name}.
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Enter a password"
                style={{
                  width: '85%',
                  padding: '0.5rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  marginBottom: '1rem'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setRoomToEnter(null);
                    setRoomPassword('');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#ff8200',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ff8200'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff8200'}
                >
                  Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatListPage; 