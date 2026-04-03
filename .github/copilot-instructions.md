# Copilot Instructions for My Teams

## Project Overview
This is a React + Vite + TypeScript application for managing fair soccer team selection. The app ensures equitable player participation across events by tracking attendance history.

## Instructions
- launch the dev server always on the default port 5173
- before launching the dev server, check whether it is already running

## Domain Model
- **Players**: firstName, lastName, birth year, level (1-5)
- **Events**: name, date, maxPlayersPerTeam, teams array, invitations array
- **Teams**: belong to events, have selectedPlayers, trainerId, shirtSetId, strength (1-3), startTime
- **Invitations**: link players to events with status (open/accepted/declined)
- **Trainers**: firstName, lastName for team management
- **ShirtSets**: sponsor, color, shirts array with numbers, sizes, goalkeeper flag
- **Shirts**: number, size (128-164, XS-XL), isGoalkeeper boolean

## Architecture Decisions
- **Full-stack**: React frontend with Node.js/Express backend API
- **State Management**: Centralized Zustand store with automatic data synchronization
- **Data Persistence**: MongoDB database with RESTful API endpoints
- **Mobile-first**: Minimum screen size iPhone SE (375px width)
- **Styling**: Tailwind CSS for utility-first responsive design
- **Fair selection**: Algorithm considers previous event participation history

## Key Pages & Features
- **HomePage**: Navigation hub and application overview
- **MembersPage**: Combined player and trainer management with tabbed interface, automatic alphabetical sorting
- **PlayerDetailPage**: Individual player statistics and event history
- **EventsPage**: Event listing, management, automatic chronological sorting
- **EventDetailPage**: Complex team management, player invitations, selection process
- **ShirtSetsPage**: Shirt set management sorted by sponsor and color
- **StatisticsPage**: Attendance tracking and fairness metrics
- **PlayerStatisticsPage**: Individual player performance analytics
- **EventAttendancePage**: Event attendance matrix and analysis

## Development Patterns
When implementing:
1. Use Zustand store for ALL data access - never call services directly from components
2. Create TypeScript interfaces in `/types/index.ts` for domain models
3. Implement API services in `/services/` with proper error handling
4. Use store selectors and mutations for state management
5. Build responsive components with Tailwind CSS utility classes (mobile-first)
6. Include fairness algorithms that track player participation history
7. Ensure automatic data sorting at store level (players by name, events by date)

## State Management Architecture
- **Zustand Store**: Central `useStore.ts` with devtools middleware
- **Data Loading**: Upfront loading via `AppInitializer` component
- **Selectors**: Individual hooks (`usePlayers`, `useEvents`, etc.) for clean component integration
- **Mutations**: Store handles all CRUD operations with automatic API synchronization
- **Error Handling**: Centralized loading/error states via store selectors

## Critical Features
- Selection algorithm displays each player's previous event participation count
- Invitation status tracking throughout the entire workflow
- Statistics pages showing attendance vs. selection ratios and fairness metrics
- Mobile-optimized UI for touch interactions
- Team management with trainer assignments and shirt distributions
- Player replacement and switching between teams
- Event attendance matrix visualization
- Individual player performance tracking
- Unified member management with tabbed interface for players and trainers

## File Structure (current implementation)
```
src/
├── components/         # Reusable UI components and modals
├── pages/             # Main page components using store hooks
│   ├── MembersPage.tsx # Combined players and trainers with tabs
│   ├── EventDetailPage.tsx # Complex team management
│   └── ...            # Other page components
├── types/             # TypeScript interfaces for all domain models
├── services/          # API service layers for backend communication
├── store/             # Zustand store implementation and selectors
├── hooks/             # Store-connected hooks for component integration
├── utils/             # Player statistics, date formatting utilities
└── config/            # API configuration and environment settings
```
