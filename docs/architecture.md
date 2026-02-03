# Accountability Stakes App - Technical Implementation Document

## Overview

A mobile app where users create commitments with money on the line, verified by friends (referees), with social features and stat tracking. Built for iOS and Android.

---

## Tech Stack

### Frontend (Mobile)
- Framework: React Native with Expo
- Why: Cross-platform (iOS + Android) from single codebase, fast development, large ecosystem, Expo handles builds and deployments without needing Xcode/Android Studio expertise
- State Management: Zustand (simpler than Redux, sufficient for this app)
- Navigation: Expo Router (file-based routing, similar to Next.js)
- UI Components: React Native Paper (Material Design components, customizable)
- Forms: React Hook Form + Zod (validation)

### Backend
- Framework: Node.js with Hono (lightweight, fast, TypeScript-first)
- Why: Simple, performant, easy to deploy, great TypeScript support
- Database: PostgreSQL (hosted on Supabase)
- ORM: Drizzle ORM (type-safe, lightweight, great DX)
- Authentication: Supabase Auth (handles email, OAuth, magic links)
- File Storage: Supabase Storage (for proof photos)
- Payments: Stripe (Connect for payouts, Payment Intents for charges)

### Infrastructure
- Backend Hosting: Railway or Render
- Database: Supabase (includes Postgres + Auth + Storage)
- Push Notifications: Expo Push Notifications (free, built into Expo)
- Monitoring: Sentry (error tracking)

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  phone VARCHAR(20),
  stripe_customer_id VARCHAR(255),
  stripe_connect_account_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Friendships Table
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, declined, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

### Commitments Table
```sql
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Commitment details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- fitness, productivity, health, learning, finance, other

  -- Timing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  check_in_frequency VARCHAR(20) NOT NULL, -- daily, weekly, one_time

  -- Stakes
  stakes_amount INTEGER DEFAULT 0, -- in cents, 0 means no money
  stakes_currency VARCHAR(3) DEFAULT 'USD',
  stakes_destination VARCHAR(50), -- referee, charity, anti_charity, platform
  charity_id UUID REFERENCES charities(id),

  -- Payment
  stripe_payment_intent_id VARCHAR(255),
  stakes_status VARCHAR(20) DEFAULT 'pending', -- pending, held, released, forfeited

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending_referee', -- pending_referee, active, completed, failed, cancelled
  referee_accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Results
  result VARCHAR(20), -- won, lost, cancelled
  total_check_ins_required INTEGER NOT NULL,
  successful_check_ins INTEGER DEFAULT 0,
  failed_check_ins INTEGER DEFAULT 0,

  -- Visibility
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commitments_user ON commitments(user_id);
CREATE INDEX idx_commitments_referee ON commitments(referee_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_category ON commitments(category);
CREATE INDEX idx_commitments_public ON commitments(is_public) WHERE is_public = true;
```

### Check-ins Table
```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Check-in details
  check_in_date DATE NOT NULL,
  note TEXT,
  proof_photo_url TEXT,

  -- Verification
  user_reported_status VARCHAR(20) NOT NULL, -- success, failure
  referee_verified BOOLEAN DEFAULT false,
  referee_status VARCHAR(20), -- verified, disputed, pending
  referee_note TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Final status
  final_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failure

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(commitment_id, check_in_date)
);

CREATE INDEX idx_check_ins_commitment ON check_ins(commitment_id);
CREATE INDEX idx_check_ins_user ON check_ins(user_id);
CREATE INDEX idx_check_ins_date ON check_ins(check_in_date);
CREATE INDEX idx_check_ins_pending ON check_ins(referee_status) WHERE referee_status = 'pending';
```

### Challenges Table (Head-to-Head)
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Challenge details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  metric VARCHAR(100) NOT NULL, -- "most gym visits", "most miles run", etc.

  -- Timing
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Stakes
  stakes_amount INTEGER NOT NULL, -- in cents, each person puts this up
  stakes_currency VARCHAR(3) DEFAULT 'USD',

  -- Payment tracking
  challenger_payment_intent_id VARCHAR(255),
  challenged_payment_intent_id VARCHAR(255),
  challenger_paid BOOLEAN DEFAULT false,
  challenged_paid BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, active, completed, cancelled
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Results
  challenger_score INTEGER DEFAULT 0,
  challenged_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES users(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX idx_challenges_status ON challenges(status);
```

### Challenge Check-ins Table
```sql
CREATE TABLE challenge_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  check_in_date DATE NOT NULL,
  value INTEGER NOT NULL, -- the metric value (miles, visits, etc.)
  note TEXT,
  proof_photo_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(challenge_id, user_id, check_in_date)
);

CREATE INDEX idx_challenge_check_ins_challenge ON challenge_check_ins(challenge_id);
CREATE INDEX idx_challenge_check_ins_user ON challenge_check_ins(user_id);
```

### Charities Table
```sql
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  stripe_account_id VARCHAR(255), -- for direct payouts
  is_anti_charity BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Activity Feed Table
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  -- Types: commitment_created, commitment_won, commitment_lost,
  -- check_in_success, check_in_failure, challenge_created,
  -- challenge_accepted, challenge_won, challenge_lost, streak_milestone

  reference_type VARCHAR(50), -- commitment, challenge, check_in
  reference_id UUID,

  metadata JSONB, -- flexible data for different activity types

  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_activities_public ON activities(is_public, created_at DESC) WHERE is_public = true;
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  notification_type VARCHAR(50) NOT NULL,
  -- Types: referee_request, check_in_reminder, referee_verification_needed,
  -- challenge_invite, commitment_result, challenge_result, friend_request

  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,

  reference_type VARCHAR(50),
  reference_id UUID,

  is_read BOOLEAN DEFAULT false,
  is_pushed BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

### User Stats Table (Denormalized for Performance)
```sql
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Commitment stats
  total_commitments INTEGER DEFAULT 0,
  commitments_won INTEGER DEFAULT 0,
  commitments_lost INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Money stats (in cents)
  total_stakes_amount INTEGER DEFAULT 0,
  total_won_amount INTEGER DEFAULT 0,
  total_lost_amount INTEGER DEFAULT 0,

  -- Challenge stats
  total_challenges INTEGER DEFAULT 0,
  challenges_won INTEGER DEFAULT 0,
  challenges_lost INTEGER DEFAULT 0,

  -- Category breakdown (JSONB for flexibility)
  category_stats JSONB DEFAULT '{}',
  -- Example: {"fitness": {"won": 5, "lost": 1}, "productivity": {"won": 3, "lost": 2}}

  -- Referee stats
  times_been_referee INTEGER DEFAULT 0,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Push Tokens Table
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL, -- ios, android
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
```

---

## API Endpoints

### Authentication
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login with email/password
POST   /auth/magic-link        - Send magic link email
POST   /auth/verify            - Verify magic link token
POST   /auth/refresh           - Refresh access token
POST   /auth/logout            - Logout (invalidate token)
GET    /auth/me                - Get current user
```

### Users
```
GET    /users/:id              - Get user profile
GET    /users/:id/stats        - Get user stats
GET    /users/search           - Search users by username
PATCH  /users/me               - Update current user profile
POST   /users/me/avatar        - Upload avatar
DELETE /users/me               - Delete account
```

### Friends
```
GET    /friends                - Get friends list
GET    /friends/requests       - Get pending friend requests
POST   /friends/request        - Send friend request
POST   /friends/accept/:id     - Accept friend request
POST   /friends/decline/:id    - Decline friend request
DELETE /friends/:id            - Remove friend
```

### Commitments
```
GET    /commitments            - Get user's commitments (with filters)
GET    /commitments/:id        - Get commitment details
POST   /commitments            - Create new commitment
PATCH  /commitments/:id        - Update commitment (limited fields)
DELETE /commitments/:id        - Cancel commitment (before start only)

POST   /commitments/:id/accept-referee   - Referee accepts role
POST   /commitments/:id/decline-referee  - Referee declines role
```

### Check-ins
```
GET    /commitments/:id/check-ins        - Get all check-ins for commitment
POST   /commitments/:id/check-ins        - Submit check-in
GET    /check-ins/pending-verification   - Get check-ins needing referee verification
POST   /check-ins/:id/verify             - Referee verifies check-in
POST   /check-ins/:id/dispute            - Referee disputes check-in
```

### Challenges
```
GET    /challenges             - Get user's challenges
GET    /challenges/:id         - Get challenge details
POST   /challenges             - Create challenge (invite friend)
POST   /challenges/:id/accept  - Accept challenge
POST   /challenges/:id/decline - Decline challenge
POST   /challenges/:id/check-in - Submit challenge check-in
DELETE /challenges/:id         - Cancel challenge (before acceptance only)
```

### Feed
```
GET    /feed                   - Get activity feed (friends + own)
GET    /feed/public            - Get public feed
POST   /activities/:id/like    - Like an activity
POST   /activities/:id/comment - Comment on activity
```

### Notifications
```
GET    /notifications          - Get notifications
POST   /notifications/read     - Mark notifications as read
POST   /notifications/read-all - Mark all as read
```

### Payments
```
POST   /payments/setup-intent  - Create Stripe setup intent (save card)
POST   /payments/create-stakes - Create payment intent for stakes
GET    /payments/methods       - Get saved payment methods
DELETE /payments/methods/:id   - Remove payment method
POST   /payments/connect       - Setup Stripe Connect (to receive money)
GET    /payments/balance       - Get pending payouts balance
POST   /payments/payout        - Request payout
```

### Charities
```
GET    /charities              - Get list of charities
GET    /charities/anti         - Get list of anti-charities
```

---

## Core Business Logic

### Commitment Lifecycle

```
1. CREATION
   - User creates commitment with details
   - If stakes > 0, referee is required
   - If stakes > 0, payment method must be on file
   - Status: pending_referee (if referee assigned) or active (if no stakes)

2. REFEREE ACCEPTANCE
   - Referee receives notification
   - Referee accepts or declines
   - If declined, user must choose new referee
   - If accepted and stakes > 0, charge user's card, hold in escrow
   - Status: active

3. ACTIVE PERIOD
   - User submits check-ins according to frequency
   - Each check-in requires referee verification (if stakes > 0)
   - Referee has 48 hours to verify before auto-approval
   - Track successful vs failed check-ins

4. COMPLETION
   - On end_date, calculate results
   - Win condition: successful_check_ins >= required_threshold (e.g., 80%)
   - Update status: completed
   - Update result: won or lost

5. SETTLEMENT
   - If won: release stakes back to user
   - If lost: transfer stakes to destination (referee/charity/platform)
   - Update user stats
   - Create activity feed entry
   - Update streak
```

### Streak Calculation Logic

```javascript
// Pseudocode for streak calculation
function calculateStreak(userId) {
  // Get all completed commitments ordered by completion date
  const commitments = getCompletedCommitments(userId, orderBy: 'completed_at DESC');

  let currentStreak = 0;
  let lastWinDate = null;

  for (const commitment of commitments) {
    if (commitment.result === 'won') {
      if (lastWinDate === null) {
        // First win
        currentStreak = 1;
        lastWinDate = commitment.completed_at;
      } else {
        // Check if this win is within acceptable gap (e.g., 14 days)
        const daysSinceLastWin = daysBetween(commitment.completed_at, lastWinDate);
        if (daysSinceLastWin <= 14) {
          currentStreak++;
          lastWinDate = commitment.completed_at;
        } else {
          // Gap too large, streak broken
          break;
        }
      }
    } else if (commitment.result === 'lost') {
      // Loss breaks streak
      break;
    }
  }

  return currentStreak;
}
```

### Challenge Lifecycle

```
1. CREATION
   - Challenger creates challenge, invites friend
   - Status: pending

2. ACCEPTANCE
   - Challenged user receives notification
   - If accepted, both users' cards are charged
   - Stakes held in escrow
   - Status: active

3. ACTIVE PERIOD
   - Both users submit check-ins with their metric values
   - Running score displayed to both

4. COMPLETION
   - On end_date, compare scores
   - Higher score wins
   - Tie: both get money back

5. SETTLEMENT
   - Winner receives both stakes (minus platform fee if applicable)
   - Update both users' stats
   - Create activity feed entries
```

### Payment Flow

```
SETUP (one-time):
1. User adds payment method via Stripe Setup Intent
2. Payment method saved to Stripe Customer
3. User can also setup Stripe Connect to receive payouts

CHARGING STAKES:
1. When commitment/challenge becomes active
2. Create Payment Intent with amount = stakes
3. Confirm payment, capture funds
4. Record payment_intent_id on commitment/challenge
5. Money held by platform (not transferred yet)

SETTLEMENT - WIN:
1. Create refund on the Payment Intent
2. Full amount returned to user

SETTLEMENT - LOSS TO REFEREE:
1. Transfer to referee's Stripe Connect account
2. If referee has no Connect account, hold as platform credit

SETTLEMENT - LOSS TO CHARITY:
1. Transfer to charity's Stripe account
2. Record for tax purposes

SETTLEMENT - LOSS TO PLATFORM:
1. No transfer needed, funds already with platform
2. This is revenue
```

---

## Project Structure

```
/accountability-app
├── /apps
│   ├── /mobile                    # React Native Expo app
│   │   ├── /app                   # Expo Router pages
│   │   │   ├── (auth)
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   └── verify.tsx
│   │   │   ├── (tabs)
│   │   │   │   ├── index.tsx      # Home/Dashboard
│   │   │   │   ├── feed.tsx       # Activity Feed
│   │   │   │   ├── create.tsx     # Create Commitment
│   │   │   │   ├── profile.tsx    # Profile & Stats
│   │   │   │   └── _layout.tsx    # Tab navigation
│   │   │   ├── commitment
│   │   │   │   ├── [id].tsx       # Commitment detail
│   │   │   │   └── check-in.tsx   # Check-in screen
│   │   │   ├── challenge
│   │   │   │   ├── [id].tsx       # Challenge detail
│   │   │   │   └── create.tsx     # Create challenge
│   │   │   ├── user
│   │   │   │   └── [id].tsx       # User profile
│   │   │   ├── notifications.tsx
│   │   │   ├── settings.tsx
│   │   │   ├── friends.tsx
│   │   │   └── _layout.tsx        # Root layout
│   │   ├── /components
│   │   │   ├── /ui                # Base UI components
│   │   │   ├── /commitment
│   │   │   ├── /challenge
│   │   │   ├── /feed
│   │   │   ├── /profile
│   │   │   └── /shared
│   │   ├── /hooks
│   │   ├── /stores
│   │   ├── /services
│   │   ├── /utils
│   │   ├── /constants
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── /api                       # Backend API
│       ├── /src
│       │   ├── /routes
│       │   ├── /services
│       │   ├── /db
│       │   │   ├── schema.ts      # Drizzle schema
│       │   │   ├── index.ts       # DB connection
│       │   │   └── migrations/
│       │   ├── /middleware
│       │   ├── /jobs
│       │   ├── /utils
│       │   ├── /types
│       │   └── index.ts           # App entry point
│       ├── package.json
│       ├── tsconfig.json
│       └── drizzle.config.ts
│
├── /packages
│   └── /shared                    # Shared types and utils
│       ├── /types
│       ├── /constants
│       └── package.json
│
├── package.json                   # Root package.json (workspaces)
└── README.md
```

---

## Screen-by-Screen Specification

### 1. Authentication Screens

#### Login Screen
- Email input field
- "Send Magic Link" button
- "Continue with Google" button (optional, phase 2)
- Link to Register screen

#### Register Screen
- Email input
- Username input (with availability check)
- Display name input
- "Create Account" button
- Link to Login screen

#### Verify Screen
- Shown after magic link clicked
- Loading state while verifying
- Auto-redirect to home on success
- Error state with retry option

---

### 2. Main Tab Screens

#### Home/Dashboard (Tab 1)
Layout:
- Header: "Good morning, {name}" + notification bell
- Current streak display (prominent)
- Active Commitments section (cards, max 3 shown)
- Active Challenges section (cards, max 2 shown)
- "Pending Actions" section:
  - Check-ins due today
  - Referee verifications needed
  - Challenge invites

Commitment Card shows:
- Title
- Days remaining
- Progress bar (check-ins completed / required)
- Stakes amount (if any)
- Quick check-in button (if due today)

Challenge Card shows:
- Title
- Opponent name + avatar
- Current score (You vs Them)
- Days remaining
- Stakes amount

---

#### Feed (Tab 2)
Layout:
- Toggle: "Friends" / "Public"
- Activity list (infinite scroll)

Activity Card types:
- Commitment created: "{User} committed to {title} with ${amount} on the line"
- Commitment won: "{User} won their commitment: {title} [celebration]"
- Commitment lost: "{User} lost their commitment: {title}"
- Challenge accepted: "{User1} and {User2} are battling: {title}"
- Challenge won: "{User} beat {Opponent} in {title}"
- Streak milestone: "{User} hit a {number} win streak [streak]"

Each card has:
- User avatar + name
- Timestamp
- Like button + count
- Comment button + count

---

#### Create (Tab 3)
Two options presented:
- "New Commitment" (solo goal)
- "Challenge a Friend" (head-to-head)

Create Commitment Flow:

Screen 1 - Goal:
- Title input ("What's your goal?")
- Description input (optional)
- Category picker (fitness, productivity, health, learning, finance, other)

Screen 2 - Schedule:
- Start date picker
- End date picker
- Check-in frequency (daily, weekly, one-time)
- Auto-calculate total check-ins required

Screen 3 - Stakes (optional):
- "Add stakes?" toggle
- Amount input ($5, $10, $25, $50, $100, custom)
- Destination picker:
  - "My referee keeps it"
  - "Donate to charity" -> charity picker
  - "Donate to anti-charity" -> anti-charity picker
  - "Burn it" (goes to platform)

Screen 4 - Referee:
- Required if stakes > 0
- Friend picker (from friends list)
- Or invite via link/username

Screen 5 - Review:
- Summary of all details
- "Create Commitment" button
- Payment confirmation if stakes > 0

Create Challenge Flow:

Screen 1 - Opponent:
- Friend picker
- Or search by username

Screen 2 - Challenge:
- Title input
- Description
- Category
- Metric ("What are you measuring?" - e.g., "gym visits", "miles run", "hours studied")

Screen 3 - Schedule:
- Start date
- End date

Screen 4 - Stakes:
- Amount (required for challenges)
- Each person puts up this amount
- Winner takes all

Screen 5 - Review:
- Summary
- "Send Challenge" button

---

#### Profile (Tab 4)
Layout:
- Avatar + display name + username
- Edit profile button
- Stats overview:
  - Win rate: X%
  - Current streak: X
  - Longest streak: X
  - Total at stake: $X
  - Total saved: $X

- Recent activity (last 5 commitments/challenges)
- Category breakdown (pie chart or bars)
- "View All Stats" -> detailed stats screen
- Settings gear icon -> settings screen

Detailed Stats Screen:
- All-time stats
- Monthly/weekly breakdown
- Category performance
- Head-to-head record vs friends
- Biggest wins and losses

---

### 3. Detail Screens

#### Commitment Detail Screen
Header:
- Title
- Status badge (Active, Completed, Failed)
- Edit button (if not started)
- Share button

Body:
- Description
- Progress ring/bar
- Dates: Started X, Ends Y (Z days left)
- Stakes: $X -> {destination}
- Referee: {name} + avatar

Check-in History:
- List of all check-ins
- Each shows: date, status (success/fail/pending), proof photo if any
- Referee verification status

Actions:
- "Check In" button (if check-in due)
- "View Proof" on past check-ins

---

#### Challenge Detail Screen
Header:
- Title
- Status badge
- Share button

Scoreboard:
- Your avatar + score
- VS
- Opponent avatar + score
- Visual indicator of who's winning

Body:
- Description
- Metric being tracked
- Dates
- Stakes: $X each, winner takes $Y

Check-in History:
- Combined timeline of both users' check-ins
- Each shows: user, date, value, proof if any

Actions:
- "Log Progress" button
- Message opponent (future feature)

---

#### User Profile Screen (viewing someone else)
Layout:
- Avatar + name + username
- Friend status (Add Friend / Friends / Pending)
- Their public stats
- Their public commitments/challenges
- "Challenge" button

---

### 4. Other Screens

#### Notifications Screen
Layout:
- List of notifications, grouped by date
- Each notification is tappable -> goes to relevant screen
- Swipe to mark as read
- "Mark all read" button

Notification types:
- Referee request: "John wants you to be their referee for {title}"
- Check-in reminder: "Don't forget to check in for {title}"
- Verification needed: "John checked in for {title} - verify?"
- Challenge invite: "Sarah challenged you to {title}"
- Results: "You won/lost {title}!"
- Friend request: "Mike wants to be your friend"

---

#### Friends Screen
Layout:
- Search bar
- "Friend Requests" section (if any pending)
- "My Friends" list
- Each friend shows: avatar, name, username, current streak
- Tap -> their profile
- "Invite Friends" button -> share link

---

#### Settings Screen
- Account section:
  - Edit profile
  - Change email
  - Notification preferences
- Payments section:
  - Payment methods
  - Payout settings (Stripe Connect)
  - Transaction history
- App section:
  - Dark mode toggle
  - Push notifications toggle
- Support section:
  - Help/FAQ
  - Contact support
  - Terms of service
  - Privacy policy
- Danger zone:
  - Log out
  - Delete account

---

## Background Jobs

### 1. Check-in Reminder Job
Runs: Every hour

Logic:
```
For each active commitment:
  If check_in_frequency == 'daily':
    If no check-in today AND time is after 6pm user local time:
      Send push notification reminder
  If check_in_frequency == 'weekly':
    If it's the last day of the week AND no check-in this week:
      Send push notification reminder
```

### 2. Referee Auto-Approve Job
Runs: Every hour

Logic:
```
For each check-in where:
  - referee_status == 'pending'
  - created_at < NOW() - 48 hours
Do:
  - Set referee_status = 'verified'
  - Set final_status = user_reported_status
  - Update commitment successful/failed count
```

### 3. Commitment Settlement Job
Runs: Every hour

Logic:
```
For each commitment where:
  - status == 'active'
  - end_date < TODAY
Do:
  - Calculate final result (won/lost based on success rate)
  - Update status = 'completed'
  - Update result = 'won' or 'lost'
  - Process payment settlement
  - Update user stats
  - Update streak
  - Create activity feed entry
  - Send push notification
```

### 4. Challenge Settlement Job
Runs: Every hour

Logic:
```
For each challenge where:
  - status == 'active'
  - end_date < TODAY
Do:
  - Compare final scores
  - Determine winner (or tie)
  - Update status = 'completed'
  - Process payment settlement
  - Update both users' stats
  - Create activity feed entries
  - Send push notifications
```

---

## MVP Scope (Weeks 1-4)

### Week 1: Foundation
- [ ] Project setup (monorepo, Expo, Hono)
- [ ] Database schema and migrations
- [ ] Supabase setup (auth, database, storage)
- [ ] Basic auth flow (magic link)
- [ ] User registration and profile

### Week 2: Core Commitments
- [ ] Create commitment flow (all screens)
- [ ] Commitment detail screen
- [ ] Check-in submission
- [ ] Referee invitation (via link)
- [ ] Referee verification flow
- [ ] Home dashboard with active commitments

### Week 3: Payments & Settlement
- [ ] Stripe integration
- [ ] Add payment method flow
- [ ] Stakes charging on commitment activation
- [ ] Settlement job (win/lose)
- [ ] Basic user stats

### Week 4: Polish & Launch
- [ ] Push notifications
- [ ] Notifications screen
- [ ] Profile with stats
- [ ] Friends system (basic)
- [ ] Bug fixes and polish
- [ ] TestFlight / Play Store internal testing

### Post-MVP (Weeks 5-8)
- [ ] Challenges (head-to-head)
- [ ] Activity feed
- [ ] Leaderboards
- [ ] Charities and anti-charities
- [ ] Stripe Connect for referee payouts
- [ ] Advanced stats
- [ ] Public profiles and sharing

---

## Environment Variables

### Mobile App (.env)
```
EXPO_PUBLIC_API_URL=https://api.yourapp.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
EXPO_ACCESS_TOKEN=xxx  # For push notifications
JWT_SECRET=xxx
NODE_ENV=development
PORT=3000
```

---

## Third-Party Services Setup

### Supabase
1. Create project at supabase.com
2. Get URL and keys from Settings > API
3. Enable Email auth in Authentication settings
4. Create storage bucket "proof-photos" with public access

### Stripe
1. Create account at stripe.com
2. Get API keys from Developers > API keys
3. Enable Stripe Connect in Connect settings
4. Set up webhook endpoint for payment events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - account.updated (Connect)

### Expo
1. Create account at expo.dev
2. Create project
3. Get access token for push notifications
4. Configure app.json with your bundle identifiers

---

## Deployment

### Backend (Railway)
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically on push to main
4. Set up custom domain

### Mobile (Expo EAS)
1. Configure eas.json
2. Run `eas build --platform all`
3. Submit to TestFlight: `eas submit --platform ios`
4. Submit to Play Store: `eas submit --platform android`

---

## Testing Strategy

### Unit Tests
- Service functions (commitment logic, streak calculation, payment flow)
- Utility functions (date helpers, money formatting)

### Integration Tests
- API endpoints with test database
- Payment flows with Stripe test mode

### E2E Tests (Future)
- Detox for mobile E2E testing
- Critical flows: auth, create commitment, check-in, settlement

---

## Security Considerations

1. Authentication: All API routes except auth require valid JWT
2. Authorization: Users can only access their own data, friends' public data
3. Payment Security:
   - Never store card details (Stripe handles this)
   - Validate payment amounts server-side
   - Use webhooks for payment confirmation, not client callbacks
4. Input Validation: Zod schemas on all inputs
5. Rate Limiting: Implement on auth and payment endpoints
6. SQL Injection: Prevented by using Drizzle ORM (parameterized queries)

---

## Monitoring & Analytics

### Error Tracking
- Sentry for both mobile and backend
- Track crashes, API errors, payment failures

### Analytics (Future)
- Mixpanel or Amplitude for user behavior
- Key events: signup, commitment_created, check_in, commitment_won, payment_made

### Business Metrics to Track
- Daily/Weekly/Monthly active users
- Commitments created per user
- Win rate distribution
- Average stakes amount
- Revenue from "burn" stakes
- Conversion: free -> paid (stakes)

---

## Launch Checklist

- [ ] App Store assets (screenshots, description, keywords)
- [ ] Play Store assets
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Support email set up
- [ ] Landing page (optional but recommended)
- [ ] Social media accounts
- [ ] Stripe account verified for live payments
- [ ] Test complete flow with real money (small amounts)
- [ ] Backup and recovery plan for database
- [ ] Monitoring and alerting set up

---

## Cost Estimates (Monthly)

At launch (0-1000 users):
- Supabase: Free tier ($0)
- Railway: ~$5-10
- Stripe: 2.9% + $0.30 per transaction
- Expo: Free tier ($0)
- Sentry: Free tier ($0)
- Total: ~$10/month + payment processing

At scale (10,000+ users):
- Supabase Pro: $25+
- Railway: $20-50
- Expo: May need paid plan for build priority
- Sentry: May need paid plan
- Total: ~$100-200/month + payment processing

---

## Commands Reference

### Development
```bash
# Install dependencies (from root)
npm install

# Start mobile app
cd apps/mobile
npx expo start

# Start backend
cd apps/api
npm run dev

# Run database migrations
cd apps/api
npm run db:migrate

# Generate Drizzle migrations
npm run db:generate
```

### Deployment
```bash
# Build mobile apps
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android

# Deploy backend (Railway handles via GitHub)
git push origin main
```
