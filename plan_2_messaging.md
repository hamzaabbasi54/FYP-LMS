# Plan 2: Department-Scoped Real-Time Messaging

> [!IMPORTANT]
> **Prerequisite**: Plan 1 (WebSocket + HTTP-Only Cookie Auth) MUST be fully implemented before starting this plan. This plan depends on: AuthContext, SocketContext, Socket.IO rooms (`dept_${department_id}`), and HTTP-Only cookie auth.

## Project Context

**Project**: FYP-LMS (University Learning Management System)  
**Stack**: React 19 + Vite (frontend) | Express 5 + MySQL via mysql2/promise (backend)  
**Repo root**: `d:\FYP-LMS` with `frontend/` and `backend/` directories  
**Database**: Aiven-hosted MySQL (`defaultdb`)  
**Migration system**: SQL files in `backend/migrations/`, run via `npm run migrate` (`node migrate.js`)  
**Roles**: `super_admin`, `deptadmin` (department admin), `faculty`

### Existing Infrastructure (from Plan 1)
- **AuthContext** (`frontend/src/context/AuthContext.jsx`): Provides `useAuth()` hook with `{ user, login, logout }`
- **SocketContext** (`frontend/src/context/SocketContext.jsx`): Provides `useSocket()` hook returning a connected Socket.IO instance
- **Socket rooms**: Users auto-join `dept_${department_id}` on WebSocket connect
- **Emit helper** (`backend/utils/emitHelper.js`): `emitToDepartment(deptId, event, data)` function
- **HTTP-Only cookies**: Auth token is in cookie, axios uses `withCredentials: true`
- **Existing Messages page**: `frontend/src/pages/faculty-pages/Messages.jsx` — currently a placeholder ("under construction")
- **Existing route**: `/faculty-messages` is already in `App.jsx` routing

### Database Schema Context
Key tables for understanding relationships:
- `users`: has `id, full_name, email, role, department_id, faculty_id`
- `departments`: has `id, name, faculty_id`
- `user_departments`: junction table for faculty who belong to multiple departments (`user_id, department_id, employment_type, is_primary`)
- `notifications`: has `id, user_id, title, message, type, is_read, created_at`

### Goal
Build a department-scoped messaging system where:
1. **Department admin** can message any faculty in their department
2. **Faculty** can message the department admin and other faculty in the same department
3. **Cross-department messaging is BLOCKED** at both API and WebSocket levels
4. Messages are delivered in **real-time** via Socket.IO
5. Messages are **persisted** in MySQL for history
6. UI shows a **chat-style interface** with conversation threads

---

## PHASE 1: Database Schema

### 1.1 Create migration file
**File**: `backend/migrations/012_add_messages_table.sql` (NEW)

```sql
-- Messages table for department-scoped chat
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    department_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_msg_sender (sender_id),
    INDEX idx_msg_recipient (recipient_id),
    INDEX idx_msg_department (department_id),
    INDEX idx_msg_read (is_read),
    INDEX idx_msg_created (created_at),
    -- Composite index for conversation queries
    INDEX idx_msg_conversation (sender_id, recipient_id, created_at),

    CONSTRAINT fk_msg_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_msg_recipient
        FOREIGN KEY (recipient_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_msg_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Run migration: `cd backend && npm run migrate`

### 1.2 Table design rationale
- `department_id` on every message enables fast department-scoped queries and enforces the security boundary
- `sender_id` + `recipient_id` = 1-to-1 messaging (not group chat)
- `is_read` tracks read status per message
- Composite index on `(sender_id, recipient_id, created_at)` optimizes conversation history queries

---

## PHASE 2: Backend API Routes

### 2.1 Create message routes
**File**: `backend/routes/messageRoutes.js` (NEW)

All routes require `verifyToken` middleware.

#### `GET /api/messages/contacts`
Returns list of users in the same department that the logged-in user can message.

Logic:
1. Get `department_id` from `req.user.department_id`
2. Query users who have `department_id` matching OR who appear in `user_departments` table with same `department_id`
3. Exclude the current user themselves
4. For each contact, include: `id, full_name, email, role, department_name`
5. Also include unread message count from each contact:
   ```sql
   SELECT u.id, u.full_name, u.email, u.role,
          (SELECT COUNT(*) FROM messages m 
           WHERE m.sender_id = u.id AND m.recipient_id = ? AND m.is_read = FALSE) as unread_count,
          (SELECT m2.content FROM messages m2 
           WHERE (m2.sender_id = u.id AND m2.recipient_id = ?) 
              OR (m2.sender_id = ? AND m2.recipient_id = u.id)
           ORDER BY m2.created_at DESC LIMIT 1) as last_message,
          (SELECT m3.created_at FROM messages m3 
           WHERE (m3.sender_id = u.id AND m3.recipient_id = ?) 
              OR (m3.sender_id = ? AND m3.recipient_id = u.id)
           ORDER BY m3.created_at DESC LIMIT 1) as last_message_time
   FROM users u
   WHERE u.department_id = ? AND u.id != ? AND u.is_active = TRUE AND u.status = 'approved'
   ORDER BY last_message_time DESC NULLS LAST
   ```

#### `GET /api/messages/conversation/:userId`
Returns message history between logged-in user and specified userId.

Logic:
1. **Security check**: Verify both users share the same `department_id`
   ```sql
   SELECT department_id FROM users WHERE id = :userId
   ```
   If `recipient.department_id !== req.user.department_id` → return 403 "Cannot message users outside your department"
2. Also check `user_departments` table for multi-department faculty
3. Fetch messages:
   ```sql
   SELECT m.*, u.full_name as sender_name
   FROM messages m
   JOIN users u ON m.sender_id = u.id
   WHERE (m.sender_id = ? AND m.recipient_id = ?)
      OR (m.sender_id = ? AND m.recipient_id = ?)
   ORDER BY m.created_at ASC
   LIMIT 100
   ```
4. Mark unread messages from this sender as read:
   ```sql
   UPDATE messages SET is_read = TRUE
   WHERE sender_id = :userId AND recipient_id = :currentUserId AND is_read = FALSE
   ```

#### `POST /api/messages/send`
Send a new message.

Request body: `{ recipient_id, content }`

Logic:
1. Validate: `content` is non-empty, `recipient_id` exists
2. **Security check**: Verify sender and recipient share same `department_id` (same logic as above, check both `users.department_id` and `user_departments` table)
3. If department mismatch → return 403 "You can only message members of your department"
4. Insert message:
   ```sql
   INSERT INTO messages (sender_id, recipient_id, department_id, content)
   VALUES (?, ?, ?, ?)
   ```
5. **Emit WebSocket event** to recipient for real-time delivery:
   ```js
   // Use Socket.IO to emit directly to the recipient's socket(s)
   const io = getIO();
   // Find all sockets for the recipient user
   const sockets = await io.in(`dept_${department_id}`).fetchSockets();
   for (const s of sockets) {
       if (s.user?.id === recipient_id) {
           s.emit('new_message', {
               id: result.insertId,
               sender_id: req.user.id,
               sender_name: req.user.full_name || 'User',
               content,
               created_at: new Date().toISOString()
           });
       }
   }
   ```
6. Return the created message object

#### `GET /api/messages/unread-count`
Returns total unread message count for the logged-in user.
```sql
SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = FALSE
```

#### `PUT /api/messages/read/:userId`
Mark all messages from a specific user as read.
```sql
UPDATE messages SET is_read = TRUE WHERE sender_id = :userId AND recipient_id = :currentUserId AND is_read = FALSE
```

### 2.2 Register routes in server.js
**File**: `backend/server.js`
- Add `import messageRoutes from './routes/messageRoutes.js';`
- Add `app.use('/api/messages', messageRoutes);`

---

## PHASE 3: Frontend API Layer

### 3.1 Add Message API to api.js
**File**: `frontend/src/services/api.js`

Add new section:
```js
// ============================================
// Message API
// ============================================
export const messageApi = {
    getContacts: async () => {
        const response = await api.get('/messages/contacts');
        return response.data;
    },
    getConversation: async (userId) => {
        const response = await api.get(`/messages/conversation/${userId}`);
        return response.data;
    },
    send: async (recipientId, content) => {
        const response = await api.post('/messages/send', { recipient_id: recipientId, content });
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/messages/unread-count');
        return response.data;
    },
    markRead: async (userId) => {
        const response = await api.put(`/messages/read/${userId}`);
        return response.data;
    }
};
```

---

## PHASE 4: Frontend Messages UI

### 4.1 Build Messages page
**File**: `frontend/src/pages/faculty-pages/Messages.jsx` (REPLACE placeholder)

The UI should be a **two-panel chat layout**:

**Left panel** — Contact list:
- Fetch contacts via `messageApi.getContacts()`
- Show each contact as a card with: avatar (initials), name, role badge, last message preview, unread count badge
- Clicking a contact selects them and loads the conversation
- Sort by most recent message first
- Search/filter contacts by name

**Right panel** — Conversation view:
- Header: recipient name + role
- Message list: scrollable, shows messages in chronological order
- Each message bubble: sender-aligned (right for sent, left for received), content, timestamp
- Input area at bottom: text input + send button
- Auto-scroll to bottom on new messages

**Real-time features**:
- Listen for `new_message` socket event
- When received AND the sender is the currently viewed contact → append message to conversation
- When received AND sender is NOT the current contact → increment unread badge on their contact card
- Show toast notification for messages from contacts not currently being viewed

### 4.2 Component structure suggestion
```
Messages.jsx
├── ContactList (left panel)
│   ├── SearchBar
│   └── ContactCard (for each contact)
└── ConversationView (right panel)
    ├── ConversationHeader
    ├── MessageList
    │   └── MessageBubble (for each message)
    └── MessageInput
```

These can be inline in Messages.jsx or separate components — agent's choice for readability.

### 4.3 Styling guidelines
- Use TailwindCSS classes (project already uses Tailwind)
- Chat bubbles: blue for sent messages, gray for received
- Responsive: on mobile, show contacts list by default, tap to view conversation
- Unread badge: red circle with count
- Online status indicator (green dot) if user's socket is connected (optional — can skip initially)

### 4.4 React Query integration
- Use `useQuery` for contacts list and conversation history
- Use `useMutation` for sending messages
- On successful send → optimistically add message to local state + invalidate conversation query
- Socket `new_message` event → invalidate contacts query (to update last message + unread count)

---

## PHASE 5: Admin Messages Page

### 5.1 Add Messages route for admin
The admin also needs a Messages page. Two options:

**Option A (recommended)**: Reuse the SAME `Messages.jsx` component for both admin and faculty routes:
- In `App.jsx`, add route under admin layout:
  ```jsx
  <Route path="/admin-messages" element={<Messages />} />
  ```
- The component uses `useAuth()` to get `department_id` — works for both roles
- Add "Messages" nav item to admin sidebar (`components/common/admin/Sidebar.jsx`)

**Option B**: Create a separate admin messages page — only if admin needs different UI

### 5.2 Update sidebar message badge
**File**: `frontend/src/components/common/faculty/Sidebar.jsx`
- Replace the hardcoded `badge={3}` on the Messages NavItem with a dynamic unread count
- Use `useQuery` to fetch `messageApi.getUnreadCount()` periodically or listen to socket events
- Listen to `new_message` socket event to increment badge count in real-time

Same change for admin sidebar if Messages is added there.

---

## PHASE 6: Socket Event Handling for Messages

### 6.1 Backend socket events for typing indicator (optional)
**File**: `backend/utils/socket.js`
- Add listener for `typing` event:
  ```js
  socket.on('typing', ({ recipientId }) => {
      // Find recipient's sockets in the same room and emit
      const roomSockets = io.sockets.adapter.rooms.get(`dept_${socket.user.department_id}`);
      // emit 'user_typing' to recipient only
  });
  ```

### 6.2 Frontend socket listeners
In `Messages.jsx`:
```js
const socket = useSocket();

useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (data) => {
        // If from currently viewed contact → append to messages
        // If from another contact → update unread count
        // Show toast if not viewing that contact
    });

    return () => socket.off('new_message');
}, [socket, selectedContact]);
```

---

## Security Checklist

| Check | Implementation |
|---|---|
| Cross-department messaging blocked | Backend validates `department_id` match on every `POST /messages/send` |
| Department verified from JWT | `req.user.department_id` comes from verified HTTP-Only cookie JWT |
| Multi-department faculty handled | Check both `users.department_id` AND `user_departments` table |
| XSS in message content | React auto-escapes JSX. Do NOT use `dangerouslySetInnerHTML` |
| SQL injection | All queries use parameterized `?` placeholders (mysql2) |
| WebSocket delivery scoped | Messages emitted only to specific user sockets within the department room |
| Rate limiting | Optional: Add rate limit on `POST /messages/send` (e.g., max 60 messages/minute) |

---

## Verification Steps

1. **Contact list**: Login as faculty → go to Messages → see only department members listed
2. **Send message**: Send a message to dept admin → message appears in conversation
3. **Real-time receive**: Open admin's Messages page in another tab → message appears instantly without refresh
4. **Cross-department block**: Try to call `POST /api/messages/send` with a recipient from a different department → get 403 error
5. **Unread count**: Send message to offline user → when they login, sidebar badge shows unread count
6. **Read receipts**: Open conversation → unread messages from that contact get marked as read
7. **Persistence**: Refresh page → message history is still visible (loaded from MySQL)
8. **Multi-department faculty**: If a faculty is in multiple departments, they should see contacts from their primary department (the one in `users.department_id`)
