# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Doctor Car (emergency medical vehicle) all-in-one management system PoC application. The project aims to demonstrate real-time information sharing between emergency medical teams (doctors/nurses in doctor cars) and hospital staff to improve emergency medical care efficiency.

## Architecture

- **Frontend**: React with Vite and TypeScript
- **Backend**: Firebase (BaaS) - Authentication, Cloud Firestore, Cloud Storage, Cloud Functions
- **Database**: Cloud Firestore (NoSQL, real-time sync)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet (primary choice for open-source compatibility)
- **State Management**: Zustand / React Context

## Database Schema (Cloud Firestore)

### Collections Structure
```
/users/{userId}
/cases/{caseId}
  ├─ /vitals/{vitalId}
  ├─ /treatments/{treatmentId}
  ├─ /messages/{messageId}
  └─ /locations/{locationId}
```

### Key Collections
- **users**: User information with roles (`doctor_car` or `hospital`)
- **cases**: Emergency dispatch cases with status tracking
- **vitals**: Patient vital signs (heart rate, blood pressure, SpO2)
- **treatments**: Medical treatments performed
- **messages**: Real-time chat messages
- **locations**: GPS location tracking

## Core Features

1. **Emergency Case Management**: View and manage dispatch cases
2. **Real-time Patient Information**: Input and share vital signs and treatment data
3. **GPS Map Integration**: Track doctor car location and route
4. **Real-time Communication**: Chat system between field teams and hospital staff
5. **Activity Recording**: Automatic saving of all activities tied to cases

## User Types

- **Doctor Car Team Members**: Input patient data, communicate from field
- **Hospital Staff**: Receive real-time updates, prepare for patient arrival

## Development Commands

When working with this project, check for these common development commands in package.json:
- `npm run dev` or `npm start` - Start development server
- `npm run build` - Build production version
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking

## Firebase Integration

The application uses Firebase SDK for:
- Authentication with email/password
- Real-time data synchronization with onSnapshot listeners
- Geolocation data with GeoPoint types
- Server timestamps for consistent timing

## Demo Scenario

The application is designed to demonstrate:
1. Emergency dispatch case selection
2. Real-time vital signs input by field teams
3. Instant data sharing to hospital dashboard
4. GPS tracking of doctor car movement
5. Chat communication between field and hospital
6. Complete activity logging for medical records

## Security Notes

- Uses Firebase Authentication for user management
- No real patient data should be used (demo data only)
- All data operations should include proper user role validation