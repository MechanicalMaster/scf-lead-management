# AI Features in Lead Management

This document describes the AI features in the Lead Management application and how to set them up.

## Overview

The application uses OpenAI's GPT models to provide the following AI capabilities:

1. **Reply Summarization** - Creates concise 2-3 word summaries of RM replies
2. **Next Action Prediction** - Analyzes replies to determine if a follow-up is needed or if the dealer is not interested

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign up or log in to your account
3. Generate a new API key

### 2. Configure the API Key

1. Create a `.env.local` file in the root of your project (you can copy from `.env.local.example`)
2. Add your OpenAI API key to the file:

```
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

> **⚠️ Security Warning**: This implementation uses the OpenAI API key directly in the browser, which is not recommended for production environments. The key is accessible to anyone who inspects your application code. For production, consider implementing a backend proxy service to make API calls on behalf of the client.

### 3. Restart the Application

After adding the API key, restart the development server:

```bash
pnpm dev
```

## Usage

Once configured, the AI features will automatically:

- Generate summaries for RM replies in the lead communications history
- Suggest the next workflow stage based on reply content
- Track token usage for analytics purposes

## Troubleshooting

If you encounter issues with the AI features:

1. **API Key Not Found** - Check that your `.env.local` file exists and contains the correct API key
2. **Invalid API Key** - Verify that your API key is valid and has not expired
3. **API Rate Limits** - If you receive rate limit errors, you may need to upgrade your OpenAI plan or implement rate limiting in your application

## Model Information

The application uses the `gpt-3.5-turbo` model by default. This provides a good balance of cost and performance for most use cases. 