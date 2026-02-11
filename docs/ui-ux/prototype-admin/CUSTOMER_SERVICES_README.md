# Customer Services Prototype - React

## Overview

This prototype implements the **customer-facing services** (Tasks, Calendar, User Dashboard) as part of the dual-frontend architecture described in `rbac-subscription-system.md`. These services complement the existing admin frontend (user/role/billing management).

## Implemented Features

### 1. **Task Board** (`/tasks`)
- ✅ Create, edit, delete tasks
- ✅ List and Kanban views
- ✅ Priority badges (Alta, Media, Baja)
- ✅ Status tracking (To Do, In Progress, In Review, Done)
- ✅ Task assignment to users
- ✅ Due dates with validation
- ✅ Tags management
- ✅ Subtasks (Professional plan)
- ✅ Search and filtering
- ✅ Feature gates:
  - `maxActiveTasks`: 10 (Free), 50 (Starter), 200 (Professional), ∞ (Enterprise)
  - `kanbanView`: Starter+
  - `subtasks`: Professional+

### 2. **Calendar** (`/calendar`)
- ✅ Month, Week, Day views
- ✅ Create, edit, delete events
- ✅ Color-coded categories (meeting, standup, client, review, personal)
- ✅ Participants management
- ✅ Location field with suggestions
- ✅ Time validation (end > start)
- ✅ Feature gates:
  - `maxEvents`: 20 (Free), 100 (Starter), 500 (Professional), ∞ (Enterprise)
  - `recurringEvents`: Professional+ (daily, weekly, monthly)
  - `calendarIntegrations`: Professional+

### 3. **User Dashboard** (`/user-dashboard`)
- ✅ Metrics widget (tasks completed, in progress, upcoming events, productivity)
- ✅ My Tasks widget (top 5 pending tasks by priority + due date)
- ✅ Upcoming Events widget (next 5 events sorted by date/time)
- ✅ Activity widget (recent actions timeline)
- ✅ Click-through navigation to Tasks/Calendar views

## Architecture

### File Structure
```
src/
├── components/
│   ├── customer/
│   │   ├── tasks/
│   │   │   ├── TaskBoard.jsx        # Main tasks view
│   │   │   ├── TaskCard.jsx         # Individual task card
│   │   │   ├── TaskModal.jsx        # Create/edit modal
│   │   │   └── TaskList.jsx         # List view wrapper
│   │   ├── calendar/
│   │   │   ├── Calendar.jsx         # Main calendar view
│   │   │   ├── CalendarViews.jsx    # Month/Week/Day renders
│   │   │   ├── EventCard.jsx        # Event display card
│   │   │   └── EventModal.jsx       # Create/edit modal
│   │   └── dashboard/
│   │       ├── UserDashboard.jsx    # Main dashboard layout
│   │       └── widgets/
│   │           ├── TasksWidget.jsx
│   │           ├── CalendarWidget.jsx
│   │           ├── MetricsWidget.jsx
│   │           └── ActivityWidget.jsx
│   ├── shared/
│   │   ├── PriorityBadge.jsx        # Priority display (alta/media/baja)
│   │   ├── StatusBadge.jsx          # Status display (todo/in_progress/done)
│   │   ├── EmptyState.jsx           # Generic empty state
│   │   ├── UpgradePrompt.jsx        # Feature gate upgrade message
│   │   ├── FeatureGate.jsx          # HOC for feature gating
│   │   └── DatePicker.jsx           # Styled date input
│   ├── Sidebar.jsx                  # Updated with Customer Services section
│   └── App.jsx                      # Updated routing
├── data/
│   ├── mockData.js                  # Extended with tasks, events, userStats
│   └── featureGates.js              # Plan limits and upgrade messages
├── hooks/
│   ├── useFeatureGate.js            # Feature gating logic
│   └── usePermissions.js            # Extended with tasks/calendar perms
└── index.css                        # Added badge and utility classes
```

### Key Patterns

#### Feature Gating
```javascript
const { hasFeature, canPerformAction, getUpgradeMessage } = useFeatureGate();

// Check boolean feature
if (!hasFeature('kanbanView')) {
  return <UpgradePrompt feature="kanbanView" />;
}

// Check numeric limit
if (!canPerformAction('maxActiveTasks', tasks.length)) {
  const message = getUpgradeMessage('maxActiveTasks');
  alert(message.title + '\n\n' + message.message);
  return;
}
```

#### Permissions
```javascript
const { canCreateTasks, canEditTasks, canDeleteTasks } = usePermissions();

if (!canCreateTasks()) {
  alert('No tienes permisos para crear tareas');
  return;
}
```

#### State Management
All data is managed with `useState` at the component level:
- State persists during session but resets on page reload
- No Redux/Context for simplicity (prototype only)
- Production would use shared state management

## Navigation

The sidebar now includes a **"SERVICIOS"** section:
- **Mi Dashboard** → User-facing dashboard (default for Member/Guest)
- **Tareas** → Task management
- **Calendario** → Event scheduling

**Default view logic:**
- `OrgAdmin` / `Manager` → Admin Dashboard
- `Member` / `Guest` / `Content Editor` → User Dashboard

## Feature Gates by Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| Max Active Tasks | 10 | 50 | 200 | ∞ |
| Kanban View | ❌ | ✅ | ✅ | ✅ |
| Subtasks | ❌ | ❌ | ✅ | ✅ |
| Max Events | 20 | 100 | 500 | ∞ |
| Recurring Events | ❌ | ❌ | ✅ | ✅ |
| Calendar Integrations | ❌ | ❌ | ✅ | ✅ |

## Testing Checklist

### Functional Testing
- [x] Create task → appears in list
- [x] Edit task → changes persist
- [x] Delete task → removed from list
- [x] Switch to Kanban view → columns render correctly
- [x] Create event → appears in calendar month view
- [x] Switch calendar views (month/week/day) → all work
- [x] Edit event → changes persist
- [x] Dashboard widgets → show correct user data

### Feature Gates Testing
- [x] Free plan → Kanban view blocked with upgrade message
- [x] Free plan → Creating 11th task shows limit message
- [x] Free plan → Recurring events option disabled
- [x] Starter plan → Kanban view enabled
- [x] Professional plan → All features unlocked

### Permissions Testing
- [x] Member role → can create/edit own tasks
- [x] Guest role → read-only access
- [x] Manager role → full access

### UI/UX Testing
- [x] No console errors
- [x] Empty states show friendly messages
- [x] Form validations work (required fields, date > today)
- [x] Responsive layout (desktop focus, mobile not yet implemented)

## Mock Data

### Tasks
- 6 sample tasks with varied statuses, priorities, assignees
- Subtasks included for Professional plan testing
- Tags: backend, security, design, ux, performance, database, docs, devops, review

### Events
- 4 sample events with different categories
- Recurrence patterns included
- Multiple participants per event
- Various locations (physical rooms, Zoom, Google Meet)

### User Stats
- Metrics for each user (tasks completed, in progress, upcoming events)
- Used by dashboard widgets

## Known Limitations (By Design)

1. **State persistence:** Data resets on page reload (no backend)
2. **Real-time updates:** No WebSocket/polling (static mock data)
3. **File attachments:** UI exists but no upload functionality
4. **Comments:** Counter displayed but no comment thread
5. **Notifications:** Activity widget is static mock
6. **Mobile responsive:** Desktop-first, mobile needs further work
7. **Calendar sync:** No Google/Outlook integration (Professional feature listed but not implemented)

## Future Extensions (Not in Scope)

The following services follow the same patterns and can be added easily:

1. **Notifications Center** (`/notifications`)
   - Real-time notification feed
   - Mark as read/unread
   - Notification preferences

2. **File Manager** (`/files`)
   - Upload/download files
   - Folder structure
   - Share files with team

3. **Project Portfolio** (`/projects`)
   - Project cards with status
   - Milestones and dependencies
   - Team assignments

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment Notes

To deploy this prototype:

1. Build the app: `npm run build`
2. Serve the `dist/` folder
3. Ensure all routes fallback to `index.html` (SPA routing)
4. No backend required (all data is mocked)

## Credits

**Implementation:** Claude Code (Anthropic)
**Architecture:** Based on PRD `rbac-subscription-system.md`
**Design System:** Tailwind CSS with custom components
**Icons:** Lucide React
