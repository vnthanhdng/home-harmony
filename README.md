A task management application designed for families and roommates to coordinate household responsibilities.

## Features

- Create and join family/living space units
- Create and assign tasks to household members
- Verify task completion with photo/video evidence
- In-app communication with household members
- Activity tracking to see recent tasks and completions

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS
- React Query and Context API
- React Hook Form with Zod validation
- Vite build tool

### Backend
- Node.js with Express
- Prisma ORM with PostgreSQL
- JWT authentication
- AWS S3 for media storage

### Infrastructure
- AWS RDS (PostgreSQL)
- AWS S3 for image/video uploads
- AWS CloudFront (optional)
- AWS ECS or App Runner for deployment

## Project Structure

```
/home-harmony/
├── packages/
│   ├── client/         
│   ├── server/         
│   └── common/         
├── package.json        
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- PostgreSQL database
- AWS account for S3 setup

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/home-team.git
   cd home-team
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the server directory:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/hometeam"
   JWT_SECRET="your-secret-key"
   AWS_REGION="your-region"
   AWS_ACCESS_KEY_ID="your-access-key"
   AWS_SECRET_ACCESS_KEY="your-secret-key"
   S3_BUCKET_NAME="your-bucket-name"
   ```

4. Initialize the database
   ```bash
   cd packages/server
   npx prisma db push
   ```

5. Start the development servers
   ```bash
   # From the root directory
   npm run dev
   ```


### Component Diagram
```
┌─────────────────┐      ┌─────────────────────────────────┐
│                 │      │                                 │
│  React Client   │◄────►│  Express API Server             │
│  (TypeScript)   │      │  (TypeScript)                   │
│                 │      │                                 │
└─────────────────┘      └───────────────┬─────────────────┘
                                         │
                                         ▼
┌─────────────────┐      ┌─────────────────────────────────┐
│                 │      │                                 │
│  AWS S3 Storage │◄────►│  Prisma ORM                     │
│  (Media Files)  │      │                                 │
│                 │      │                                 │
└─────────────────┘      └───────────────┬─────────────────┘
                                         │
                                         ▼
                         ┌─────────────────────────────────┐
                         │                                 │
                         │  PostgreSQL Database (AWS RDS)  │
                         │                                 │
                         └─────────────────────────────────┘

```