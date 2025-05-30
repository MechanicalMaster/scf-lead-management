# SCF Lead Management

A modern web application for managing Supply Chain Finance leads, built with Next.js.

## Features

- Role-based access control (Admin and RM roles)
- Dashboard with analytics
- Lead management for RM and PSM teams
- Master data management
- Responsive design for all devices

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI Components

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd scf-lead-management
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials

- Admin: admin@yesbank.in / password
- RM: rm@yesbank.in / password

## Deployment

This application is configured for easy deployment on Vercel. 

## Lead Email Functionality

The application now includes a simulated email functionality for lead assignments. When a lead is successfully assigned to an RM (either manually or automatically), the system:

1. Creates a workflow state record for the lead
2. Generates a simulated email notification to the RM
3. Logs the communication in the system

### Implementation Details

- The email generation happens in the `handleUpload` function in the `NewLeads` component
- RM email addresses are retrieved or generated based on their ADID
- PSM details are retrieved from the anchor record
- Email content includes dealer details and action items for the RM

### Workflow States

Each lead goes through a workflow with different states:
- `RM_AssignmentEmailPending`: Initial state after lead creation
- `RM_AwaitingReply`: After assignment email is sent
- `RM_Escalation1`: If no response after first reminder
- `PSM_ReviewPending`: If no response after second reminder
- `Dropped`: If lead is dropped by PSM

### Viewing Communications

Lead communications can be viewed in the `LeadDetails` component under the "RM Communications" tab.

### Technical Implementation

- Email generation logic is in `lib/lead-utils.ts`
- Workflow state management is in `lib/lead-workflow.ts`
- Example implementations are in `lib/lead-workflow-examples.ts` 