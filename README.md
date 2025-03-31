# Live Chat Application

A real-time chat application built with React, TypeScript, and Firebase. This application features a modern 3D interface with interactive chat rooms and secure authentication.

[Live Demo](https://chattie-455301.web.app/)

## Features

- 🔐 Secure authentication with Firebase
- 💬 Real-time chat functionality
- 🎨 Modern 3D interface using Three.js and React Three Fiber
- 🔒 Password-protected chat rooms
- 👥 Room management (create, join, delete)
- 🌟 Beautiful UI with animations using Framer Motion
- 📱 Responsive design

## Tech Stack

- React
- TypeScript
- Firebase (Authentication, Firestore, Realtime Database)
- Three.js / React Three Fiber
- Framer Motion

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/live-chat.git
cd live-chat
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a Firebase project and add your configuration:
   - Create a new project in Firebase Console
   - Enable Authentication and Firestore
   - Copy your Firebase configuration
   - Create a `.env` file in the root directory and add your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

1. Sign up or log in to your account
2. Create a new chat room or join an existing one
3. Start chatting with other users in real-time
4. Manage your chat rooms (create, join, delete)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

