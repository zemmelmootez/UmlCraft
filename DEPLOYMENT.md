# Deploying UMLCraft to Vercel

This guide explains how to deploy UMLCraft to Vercel.

## Prerequisites

- A GitHub account
- A Vercel account (can sign up with GitHub)
- An OpenAI API key

## Setup GitHub OAuth App

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "OAuth Apps" > "New OAuth App"
3. Fill in the details:
   - Application name: UMLCraft
   - Homepage URL: Your Vercel deployment URL (you can update this later)
   - Authorization callback URL: `https://your-vercel-domain.vercel.app/auth/github/callback`
4. Register the application and note down the Client ID and Client Secret

## Setup Vercel Project

1. Fork or clone the UMLCraft repository to your GitHub account
2. Sign in to Vercel and click "Add New Project"
3. Import your UMLCraft repository
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `npm run vercel-build`
   - Output Directory: frontend/dist

## Environment Variables

Add the following environment variables in the Vercel project settings:

- `GITHUB_CLIENT_ID`: Your GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App Client Secret
- `OPENAI_API_KEY`: Your OpenAI API key
- `NODE_ENV`: production

## Deploy

1. Click "Deploy" to start the deployment process
2. Once deployment is complete, update your GitHub OAuth App's Homepage URL and Authorization callback URL with your new Vercel domain

## Troubleshooting

### CORS Issues

If you encounter CORS issues, verify that:

- Your Vercel domain is correctly set in the CORS configuration
- Your GitHub OAuth App has the correct callback URL

### API Route Issues

If API routes aren't working:

- Check the Network tab in browser dev tools
- Verify that API requests are going to the correct URL
- Check Vercel Function Logs for potential errors

### GitHub Authentication Issues

If GitHub authentication fails:

- Check that the Client ID and Secret are correctly set in environment variables
- Verify the callback URL is correct in your GitHub OAuth App settings

## Important Notes

- The free tier of Vercel has limitations on serverless function execution time, which might impact larger UML diagram generations
- Consider setting up rate limiting for your deployed app to avoid unexpected costs from the OpenAI API
- UMLCraft uses gpt-4o-mini by default for an optimal balance of cost and performance
