# UMLCraft

A powerful tool to automatically generate UML diagrams from GitHub repositories.

## Project Structure

This project is organized into two main parts:

- `frontend/` - React & Vite based frontend application
- `backend/` - Express-based Node.js backend

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- GitHub OAuth application credentials
- OpenAI API key

### Setup

1. Clone the repository

```
git clone https://github.com/yourusername/umlcraft.git
cd umlcraft
```

2. Configure GitHub OAuth

You need to create a GitHub OAuth application:

- Go to GitHub Settings > Developer Settings > OAuth Apps > New OAuth App
- Set Authorization callback URL to `http://localhost:3000/auth/github/callback`
- Copy your Client ID and Client Secret

3. Setup environment variables

Backend:

Option 1: Use the provided script to create a template `.env` file:

```
cd backend
npm run create-env
```

Then edit the `.env` file with your actual credentials.

Option 2: Manually create a `.env` file in the `backend/` directory with the following variables:

```
# GitHub OAuth credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key

# Server port
PORT=3001
```

Frontend:

```
cd frontend
cp .env.example .env  # then edit .env with your GitHub credentials
```

4. Install dependencies and start the applications

Backend:

```
cd backend
npm install
npm run dev
```

Frontend:

```
cd frontend
npm install
npm run dev
```

5. Open the application at http://localhost:3000

## Features

- GitHub authentication via OAuth
- Browse your GitHub repositories
- Generate UML diagrams from selected code
- Download diagrams in various formats
- AI-powered UML diagram generation

## Deployment

### Deploying to Vercel

This project is configured for deployment on Vercel:

1. Fork or clone this repository to your GitHub account
2. Sign up for Vercel (if you haven't already)
3. Create a new project in Vercel and link it to your GitHub repository
4. Configure the following environment variables in Vercel:
   - `GITHUB_CLIENT_ID` - Your GitHub OAuth app client ID
   - `GITHUB_CLIENT_SECRET` - Your GitHub OAuth app client secret
   - `OPENAI_API_KEY` - Your OpenAI API key
5. Deploy the project

The deployment process will use the Vercel configuration from `vercel.json` to build and deploy both the frontend and backend together.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
