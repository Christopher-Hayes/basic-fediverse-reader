# Basic Fediverse Reader

A simple reader for viewing posts and profiles from the fediverse. Built with Fedify, Next.js, React, and Tailwind.

This project is a personal learning project showcasing a simple Next.js app to fetch Fediverse posts and profiles with Fedify. The application now supports both post URLs and profile URLs, allowing users to view individual posts or browse user profiles with their recent posts. I would not consider the code production-ready.

## Features

- **Post Viewing**: View individual fediverse posts with rich formatting, hashtag highlighting, and author information
- **Profile Viewing**: Browse user profiles and their recent posts from across the fediverse
- **Multi-Platform Support**: Works with various fediverse platforms (Mastodon, Pixelfed, etc.)
- **Smart URL Detection**: Automatically detects whether input is a post URL or profile URL
- **ActivityPub Integration**: Uses Fedify for proper ActivityPub protocol implementation

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Overview](#project-overview)

## Installation

To install the Basic Fediverse Reader and its dependencies, you need to have Node.js installed. Clone the repository from GitHub and install the required packages using npm:

```sh
npm install
```

This will install both the runtime and development dependencies as specified in the package.json file.

## Usage

To use the Basic Fediverse Reader, you can run different scripts provided in the package.json:

- Start the development server:  

  ```sh
  npm run dev
  ```

- Lint the project:  

  ```sh
  npm run lint
  ```

### Using the Application

1. **View Posts**: Enter any fediverse post URL (e.g., `https://mastodon.social/@user/123456789`) in the input field
2. **View Profiles**: Enter any fediverse profile URL (e.g., `https://floss.social/@chris`) to view user profiles and recent posts
3. **Supported URL Formats**:
   - Post URLs: `server.com/@username/postid`, `server.com/notes/abc123`
   - Profile URLs: `server.com/@username`, `server.com/users/username`
   - Works with elk.zone URLs and other common formats

## Project Overview

Here is a brief overview of important files and folders in the project:

- The React code is mainly in the /app and /components folders.
  - `post/[...postUrl]` - Main page for viewing individual fediverse posts.
  - `profile/[...userHandle]` - Profile pages for viewing user profiles and recent posts.
  - `[fedify]/[[...catchAll]]` - Allows this app to run as an ActivityPub server.
- `/components` contains reusable UI components:
  - `nav.tsx` - Smart URL input that handles both post and profile URLs
  - `toot.tsx` - Post display component with rich formatting
  - `profileHeader.tsx` - User profile header display
  - `tootCard.tsx` & `tootCardFull.tsx` - Post cards for different layouts
- `/util` has federation setup, post/profile fetching, and utility functions:
  - `federation.ts` - Fedify setup and ActivityPub configuration
  - `fetchPost.ts` - Logic for fetching posts and user data from ActivityPub
  - `helpers.ts` - URL parsing and utility functions
- `/public` has the bulk of the custom SVGs used throughout the interface.
