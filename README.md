<div align="center">
  <h1>✨ Aura</h1>
  <p><strong>A Modern, Full-Stack Real-Time Workspace & Chat Application</strong></p>

  [![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-4.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
</div>

---

Aura is a beautiful, highly responsive chat application designed with a premium **glassmorphism** aesthetic. It moves seamlessly from a mobile hamburger menu to a full wide-screen desktop experience. 

Powered by a robust backend using **Node.js, Express, and MongoDB**, and fueled by **Socket.io** for instantaneous messaging.

## 🚀 Key Features

*   **⚡ Real-Time Everything**: Messages are broadcasted and received instantly without refreshing.
*   **⌨️ Live Typing Indicators**: See who is typing in real-time.
*   **🗄️ Persistent History**: Join any room and instantly see the full history loaded securely from MongoDB.
*   **🔒 Secure Authentication**: JSON Web Token (JWT) based login and registration. Passwords are cryptographically hashed using `bcrypt`.
*   **🛡️ Room Moderation**: Only registered users can create rooms. Only the user who created a room has the power to delete it.
*   **🔍 Instant Search**: Filter through active rooms on the dashboard with a lightning-fast local search.
*   **📱 Fully Responsive**: Custom media queries ensure the app looks stunning on both 4K monitors and mobile phones.
*   **✨ Glassmorphism UI**: Beautiful gradients, dynamic blur effects, and smooth micro-animations.

---

## 🛠️ Architecture

Aura uses a structured Monorepo format:
*   `/frontend` - Contains the React Single Page Application (SPA) bundled by Vite.
*   `/backend` - Contains the Express REST API and Socket.io server.

---

## 💻 Local Development Setup

Ready to run Aura on your own machine? Follow these simple steps.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or an Atlas URI)
*   Git

### 1. Clone & Install
```bash
git clone https://github.com/Ritik639471/RM-chat-app.git
cd RM-chat-app

# Install dependencies for both Frontend and Backend concurrently
npm run install-all
```

### 2. Configure Environment
Create a `.env` file inside the `/backend` folder.
```env
# backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aura-chat
CLIENT_URL=http://localhost:5173
JWT_SECRET=super_secret_development_key
```

*(Note: Ensure your local MongoDB instance is running, or replace the `MONGO_URI` with your own MongoDB Atlas connection string).*

### 3. Start Development Servers
Run the following command from the **root** folder. It leverages `concurrently` to start both Vite and Nodemon at the exact same time!
```bash
npm run dev
```

*   **Frontend**: `http://localhost:5173`
*   **Backend**: `http://localhost:5000`

---

## 🌍 Production Deployment Guide

You cannot use `localhost` when sharing your app with the world! Here is how to deploy Aura for free.

### Step 1: Cloud Database (MongoDB Atlas)
1. Sign up for [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a Free Tier cluster.
2. In **Database Access**, create a user (save the password!).
3. In **Network Access**, add the IP `0.0.0.0/0` to allow access from anywhere.
4. Click **Connect -> Connect your application**. Copy the URI.
5. Replace `<password>` in the URI with the password you created. Keep this string safe!

### Step 2: Host the Backend (Render)
1. Push all your code to GitHub.
2. Go to [Render](https://render.com/) and create a **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service:
    *   **Root Directory**: `backend`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
5. Add these **Environment Variables**:
    *   `MONGO_URI` = Your Atlas connection string
    *   `JWT_SECRET` = A strong, random string (e.g. `X8s9fA...`)
6. Click Deploy. Copy the backend URL (e.g. `https://aura-backend.onrender.com`).

### Step 3: Host the Frontend (Vercel)
1. **Critical:** Inside your frontend code (`Login.jsx`, `Chat.jsx`, `Rooms.jsx`), locate `const API_URL` and `SOCKET_URL`. Change them from `localhost:5000` to your new Render backend URL! Push this change to GitHub.
2. Go to [Vercel](https://vercel.com/) and create a new project from your GitHub repo.
3. Configure the Project:
    *   **Framework**: Vite
    *   **Root Directory**: `frontend`
4. Deploy! Copy the Vercel URL (e.g. `https://aura-chat.vercel.app`).

### Step 4: Finalize CORS
1. Go back to Render.
2. Add one final Environment Variable to your backend:
    *   `CLIENT_URL` = Your new Vercel Frontend URL.
3. Restart the backend service. Aura is now live!

---

## 🎨 Modifying the Theme
Aura relies on native CSS Custom Properties for theming. You can easily tweak the entire app's color palette by modifying the variables at the top of `frontend/src/index.css`:

```css
:root {
  --bg-main: #0B0E14;
  --glass-bg: rgba(20, 24, 32, 0.6);
  --glass-border: 1px solid rgba(255, 255, 255, 0.08);
  --primary-accent: #6366F1;
  --secondary-accent: #A855F7;
}
```

## 📝 License
This project is open-source and available under the MIT License.

## 🙌 Author
Built by **Ritik Maurya**. Feel free to fork, star, and contribute!
