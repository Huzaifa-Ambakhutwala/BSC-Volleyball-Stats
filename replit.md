# BSC Volleyball Stat Tracker

## Overview

BSC Volleyball Stat Tracker is a comprehensive web application for managing volleyball tournaments with real-time statistics tracking. The system provides three main interfaces: an admin panel for tournament management, a stat tracker for recording player statistics during matches, and a public scoreboard for displaying live match data. The application supports multi-set matches (up to 3 sets), detailed player statistics across multiple categories, and provides historical match data with analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with multiple protected routes
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: TailwindCSS with custom volleyball-themed color variables
- **State Management**: React hooks with local state and context providers for authentication
- **Data Fetching**: TanStack React Query for server state management

### Backend Architecture
- **Server**: Express.js with TypeScript running on Node.js
- **Database**: Dual storage approach - PostgreSQL with Drizzle ORM for structured data and Firebase Realtime Database for live statistics
- **Authentication**: Session-based authentication using express-session with PostgreSQL session store
- **File Handling**: Multer middleware for screenshot uploads in feedback system
- **API Design**: RESTful endpoints with proper error handling and validation using Zod schemas

### Data Storage Solutions
- **PostgreSQL**: Primary database for users, players, teams, matches, and player statistics using Drizzle ORM
- **Firebase Realtime Database**: Real-time statistics tracking, match scores, and live updates
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **File Storage**: Local file system for uploaded screenshots and attachments

### Authentication and Authorization
- **Admin Authentication**: Hardcoded credentials with session-based authentication
- **Stat Tracker Authentication**: Team-based login system stored in localStorage
- **Access Control**: Role-based permissions with full/limited access levels for admin users
- **Protected Routes**: Route guards for admin panel and stat tracker functionality

### Key Features and Components
- **Multi-Set Match Support**: Up to 3 sets per match with conditional set progression
- **Comprehensive Statistics**: 12+ stat categories including aces, spikes, blocks, errors, and neutral actions
- **Real-Time Updates**: Live scoreboard updates using Firebase listeners
- **Match Management**: Complete match lifecycle from scheduling to completion
- **Player Analysis**: Individual player performance tracking with historical data
- **Admin Panel**: Full CRUD operations for players, teams, and matches
- **Public Interfaces**: Leaderboard, schedule, and match history pages

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database connection
- **drizzle-orm**: Type-safe database queries and migrations
- **firebase**: Real-time database for live statistics and match updates
- **express**: Web server framework with session management
- **passport**: Authentication middleware with local strategy

### UI and Styling
- **@radix-ui/react-***: Accessible UI component primitives
- **@tailwindcss/vite**: Tailwind CSS integration with Vite
- **class-variance-authority**: Component variant management
- **tailwindcss**: Utility-first CSS framework

### Development and Build Tools
- **vite**: Frontend build tool and development server
- **typescript**: Type safety and enhanced development experience
- **esbuild**: Fast bundling for production server builds
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Utilities and Libraries
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight client-side routing
- **date-fns**: Date manipulation and formatting
- **chart.js**: Statistical visualization and charts
- **multer**: File upload handling for feedback system
- **zod**: Runtime type validation and schema definition