# Copilot Instructions for My Teams

## Project Overview
This is a React + Vite + TypeScript application for managing fair soccer team selection. The app ensures equitable player participation across events by tracking attendance history.

## Instructions
- launch the dev server always on the default port 5173
- before launching the dev server, check whether it is already running

## Domain Model
- **Players**: name (first + last), birth year, skill score (1-5)
- **Events**: name, date, start time, teams, invited players, selection results
- **Teams**: belong to events, have max player capacity
- **Invitations**: link players to events with status (sent/accepted/declined)

## Architecture Decisions
- **Frontend-only**: Uses localStorage for persistence (no backend initially)
- **Mobile-first**: Minimum screen size iPhone SE (375px width)
- **Styling**: Tailwind CSS for utility-first responsive design
- **Fair selection**: Algorithm must consider previous event participation

## Key Pages & Features
- **Players Page**: CRUD operations, score editing
- **Events Page**: Event listing and management
- **Event Detail**: Team management, player invitations, selection process
- **Statistics**: Attendance tracking and fairness metrics

## Development Patterns
When implementing:
1. Create TypeScript interfaces for domain models first
2. Implement localStorage utilities with proper error handling
3. Use React hooks for state management (consider useReducer for complex state)
4. Build responsive components with Tailwind CSS utility classes (mobile-first)
5. Include fairness algorithms that track player participation history

## Critical Features
- Selection algorithm should display each player's previous event count
- Invitation status tracking throughout the workflow
- Statistics page showing attendance vs. selection ratios
- Mobile-optimized UI for touch interactions

## File Structure (to implement)
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── types/         # TypeScript interfaces
├── utils/         # localStorage, selection algorithms
└── hooks/         # Custom React hooks
```

Start with domain types and localStorage utilities before building UI components.