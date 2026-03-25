# Aura — Real-Time Chat Application([App](https://aura-app-in-chat.vercel.app/))

<div align="center">

![Aura Banner](https://img.shields.io/badge/Aura-Chat%20App-6366f1?style=for-the-badge&logo=lightning&logoColor=white)

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://aura-app.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)](https://aura-app-keg8.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb)](https://cloud.mongodb.com)

**A premium, feature-rich real-time messaging platform built with the MERN stack and Socket.io.**

</div>

---

## ✨ Features

### 💬 Messaging
- **Real-time chat** — WebSocket-powered instant messaging via Socket.io
- **Direct Messages (DMs)** — Private 1-on-1 conversations between users
- **Public Channels** — Create and join topic-based chat rooms
- **Message Edit** — Edit your own messages inline; others see an "(edited)" label
- **Message Delete** — Soft-delete any of your messages (admins can delete any)
- **Message Reactions** — Hover a message to react with 👍 ❤️ 😂 😮 😢 🔥
- **Read Receipts** — ✓ Sent / ✓✓ Read (blue) indicators for each message
- **Typing Indicators** — Live "User is typing..." status

### 📎 Media
- **Image Sharing** — Upload and share images directly in chat (hosted on Cloudinary)
- **Link Previews** — Paste any URL to get an automatic title + image preview card

### 🔒 Access Control & Admin
- **Strict Room Memberships** — Users must "Join" a room before sending or reading messages
- **Admin System** — Room creators can promote/demote members to admin
- **Pin Messages** — Admins can pin important messages shown in a gold banner at the top
- **Clear Chat** — Creator/Admins can wipe all messages from a room
- **Message Delete for Admins** — Admins can remove any message in their room

### 🔍 Discovery & UX
- **In-Chat Search** — Search messages in real-time with highlighted matches
- **Group Info Modal** — View all members with Online/Offline status and admin badges
- **Emoji Picker** — 30-emoji panel to insert emojis directly into messages
- **Channel + DM Tabs** — Separated views for public channels vs. direct messages
- **Pinned Messages Panel** — View all pinned messages at a glance

### 👤 User Profiles
- **Avatar Upload** — Set a custom profile photo (Cloudinary-hosted)
- **Bio & Status** — Add a bio (160 chars) and a status emoji/text
- **Public Profiles** — Any user's profile is viewable via `/api/profile/:username`

### 🔐 Authentication
- **JWT-based auth** — Secure tokenized session management
- **Bcrypt passwords** — Passwords are salted and hashed at rest
- **Email + Username login** — Log in with either your username or email
- **Forgot password** — OTP-based password reset via email (Nodemailer)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS (Glassmorphism) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas), Mongoose |
| **Real-Time** | Socket.io |
| **Auth** | JWT (jsonwebtoken), bcrypt |
| **Media** | Cloudinary (images + avatars), Multer |
| **Email** | Nodemailer (Gmail) |
| **Deployment** | Vercel (frontend), Render (backend) |

---

## 📁 Project Structure

```
RM-chat-app-main/
├── backend/
│   ├── middleware/
│   │   └── auth.js               # JWT middleware
│   ├── models/
│   │   ├── User.js               # User schema (avatar, bio, status, role)
│   │   ├── Room.js               # Room schema (members, admins, isDirectMessage)
│   │   └── Message.js            # Message schema (reactions, readBy, pinned, edited)
│   ├── routes/
│   │   ├── auth.js               # Signup, Login, Forgot/Reset password
│   │   ├── room.js               # CRUD rooms, join, DMs, admin management
│   │   ├── message.js            # CRUD messages, pin, clear
│   │   ├── upload.js             # Cloudinary image uploads
│   │   ├── profile.js            # User profile GET/PUT
│   │   └── linkpreview.js        # OG meta scraper for URL previews
│   ├── server.js                 # Express + Socket.io server
│   └── package.json
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ChatSidebar.jsx    # Online user list + room info
        │   ├── GroupInfoModal.jsx # Member list, admin controls
        │   ├── MessageBubble.jsx  # Message rendering, edit/delete/pin
        │   └── EmojiPicker.jsx   # Emoji panel
        ├── pages/
        │   ├── Login.jsx          # Login, Signup, OTP password reset
        │   ├── Rooms.jsx          # Channels + DMs tab view
        │   ├── Chat.jsx           # Main chat room orchestrator
        │   └── Profile.jsx        # User profile editor
        ├── App.jsx
        └── index.css
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Gmail account (for OTP emails)

### 1. Clone the repository
```bash
git clone https://github.com/Ritik639471/RM-chat-app.git
cd RM-chat-app-main
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/aura-chat
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `EMAIL_USER` | Gmail address for sending OTPs |
| `EMAIL_PASS` | Gmail App Password (not your regular password) |
| `CLIENT_URL` | Frontend URL (for CORS) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (from dashboard) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PORT` | Port to run the server on (default: 5000) |

---

## 🌐 Deployment

### Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add all environment variables from the table above

### Frontend (Vercel)
1. Import your repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to `Vite`
4. Set environment variable: `VITE_API_URL` (optional, if not hardcoded)
5. Add a `vercel.json` in `frontend/` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/auth/forgot-password` | Send OTP to email |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### Rooms
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rooms` | Get all public rooms + user's DMs |
| POST | `/api/rooms` | Create a new room |
| DELETE | `/api/rooms/:id` | Delete a room (creator only) |
| POST | `/api/rooms/:id/join` | Join a room |
| POST | `/api/rooms/dm/:username` | Start or open a DM |
| POST | `/api/rooms/:id/make-admin` | Promote member to admin (creator only) |
| DELETE | `/api/rooms/:id/remove-admin` | Demote admin (creator only) |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages/:roomName` | Get messages (members only) |
| GET | `/api/messages/:roomName/pinned` | Get pinned messages |
| PUT | `/api/messages/:id` | Edit a message (own only) |
| DELETE | `/api/messages/:id` | Delete a message (own or admin) |
| POST | `/api/messages/:id/pin` | Pin/unpin a message (admin only) |
| DELETE | `/api/messages/room/:roomName/clear` | Clear all messages (admin only) |

### Profiles & Media
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/profile/:username` | Get a user's public profile |
| PUT | `/api/profile` | Update own profile (bio, status, avatar) |
| POST | `/api/upload` | Upload an image (returns Cloudinary URL) |
| GET | `/api/linkpreview?url=` | Fetch OG metadata for a URL |

---

## 🔌 Socket Events

| Event (emit) | Payload | Description |
|---|---|---|
| `join_room` | `{ room, username }` | Join a socket room |
| `leave_room` | `{ room, username }` | Leave a socket room |
| `send_message` | `{ room, author, message, time }` | Send a text message |
| `broadcast_image` | message object | Broadcast an uploaded image to room |
| `typing` | `{ room, username }` | Notify others of typing |
| `stop_typing` | `{ room, username }` | Stop typing indicator |
| `toggle_reaction` | `{ messageId, emoji, username }` | Add/remove a reaction |
| `mark_read` | `{ room, username }` | Mark all messages as read |
| `message_edited` | `{ messageId, message, room }` | Broadcast an edit |
| `message_deleted` | `{ messageId, room }` | Broadcast a deletion |
| `message_pinned` | `{ messageId, pinned, room }` | Broadcast pin status change |
| `room_cleared` | `{ room }` | Broadcast room clear |

---

## 📸 App Screens

| Screen | Description |
|---|---|
| **Login/Signup** | Glassmorphism auth form with OTP password reset |
| **Rooms** | Tabbed view: Channels (Join/Open) + Direct Messages |
| **Chat** | Full-featured chat with sidebar, search, pinned bar, input toolbar |
| **Profile** | Avatar, bio, and status editor |
| **Group Info** | Member list with online status, admin badges, and promote controls |

---

## 👤 Author

**Ritik Maurya**  
GitHub: [@Ritik639471](https://github.com/Ritik639471)

---

<div align="center">
  Built with ❤️ using React, Node.js, Socket.io, and MongoDB
</div>
