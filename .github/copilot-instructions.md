# Basic Fediverse Reader Copilot Instructions

## Project Overview

Basic Fediverse Reader is a simple reader application for viewing posts from the fediverse (ActivityPub network). Built with Next.js, React, TypeScript, and Tailwind CSS, it uses Fedify for ActivityPub protocol integration. The app allows users to input a fediverse post URL and displays the post with rich formatting, hashtag highlighting, and author information. This is a personal learning project demonstrating ActivityPub integration and is not considered production-ready.

## Technology Stack

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19 RC** - UI library with latest features
- **TypeScript** - Strict typing throughout the codebase
- **Tailwind CSS v3** - Utility-first CSS framework
- **Biome** - Linting and formatting (configured over ESLint/Prettier)

### Key Libraries
- **@fedify/fedify** - ActivityPub protocol implementation for fediverse integration
- **html-react-parser** - Parse HTML content from fediverse posts safely
- **classnames** - Conditional CSS class management
- **@svgr/webpack** - SVG-to-React component transformation
- **x-forwarded-fetch** - Handle forwarded requests for federation
- **@js-temporal/polyfill** - Temporal API polyfill for date handling

### Design & Assets
- **OpenComicFont** - Custom web font for comic-style typography
- **Extensive SVG graphics** - Custom illustrations and UI elements in `/public`
- **Custom clip-path animations** - Creative visual effects for avatars and elements

## Architecture Patterns

### File Structure
```
app/
├── [fedify]/                   # ActivityPub federation routes
│   └── [[...catchAll]]/        # Catch-all route handler
├── post/[...postUrl]/          # Dynamic post viewing pages
├── fonts/                      # Custom font assets
├── globals.css                 # Global styles and CSS variables
├── layout.tsx                  # Root layout with font loading
└── page.tsx                    # Homepage with navigation

components/
├── nav.tsx                     # URL input navigation component
├── toot.tsx                    # Main post display component
├── tootAuthor.tsx              # Author information display
└── tagList.tsx                 # Hashtag rendering component

util/
├── federation.ts               # Fedify setup and instance actor
├── fetchPost.ts                # ActivityPub post fetching logic
└── helpers.ts                  # Utility functions

public/                         # SVG assets and graphics
└── [extensive SVG collection]  # Custom illustrations and UI elements
```

### ActivityPub Integration
- **Fedify Federation** - Core ActivityPub protocol implementation
- **Instance Actor** - Required for object lookups on some Mastodon servers  
- **Document Loader** - Handles ActivityPub object resolution
- **Memory KV Store** - Temporary storage for development (should be replaced in production)
- **Dynamic Route Handling** - `/[fedify]/[[...catchAll]]/` handles all ActivityPub requests

### Post Fetching Architecture
- **URL Processing** - Handles various fediverse URL formats (elk.zone, Flipboard, etc.)
- **ActivityPub Object Lookup** - Fetches Notes (posts) and Actors (users) from remote servers
- **Content Parsing** - Safely parses HTML content from posts
- **Attachment Processing** - Handles images and media attachments
- **Local Testing** - Can save/load posts locally via `post.json` for development

## Development Guidelines

### Code Style
- Use **TypeScript** with strict configuration
- Follow **Biome** formatting rules (double quotes, 2-space indentation)
- Prefer functional components with hooks over class components
- Use proper async/await patterns for ActivityPub operations
- Import types explicitly with `import type`

### Component Development
- Use **Server Components** by default for better performance
- Add `"use client"` directive only when client-side interactivity is needed
- Use proper TypeScript props interfaces
- Handle loading and error states gracefully
- Implement proper accessibility with ARIA labels

### Styling Approach
- Use **Tailwind CSS** utility classes extensively
- Leverage CSS custom properties for theming (defined in `globals.css`)
- Use `classnames` utility for conditional styling
- Create responsive designs with Tailwind breakpoints
- Implement creative visual effects with CSS animations and clip-paths

### ActivityPub Best Practices
- Always handle ActivityPub object resolution errors gracefully
- Implement proper content sanitization when parsing HTML
- Use the instance actor for server identification
- Handle various fediverse URL formats and edge cases
- Implement caching strategies for production deployments

## Key Components & Features

### Navigation (`nav.tsx`)
- URL input field with fediverse post URL validation
- Creative SVG-based styling with hover effects
- Enter key and button submission handling
- Automatic URL processing and redirection to post pages

### Post Display (`toot.tsx`)
- HTML content parsing with custom link and hashtag rendering
- Dynamic SVG highlight animations based on text length
- Proper handling of ActivityPub content structure
- Support for various content types and formatting

### Author Information (`tootAuthor.tsx`)
- ActivityPub Actor display with avatar and metadata
- Custom clip-path styling for creative avatar shapes
- Responsive design for mobile and desktop views

### Federation Route (`[fedify]/[[...catchAll]]/route.ts`)
- Handles all ActivityPub federation requests
- Integrates with x-forwarded-fetch for proper request handling
- Provides proper HTTP responses for federation protocol

## Development Commands

### Primary Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run Biome linter and formatter

### Development Workflow
- Use `fetchTestPost()` instead of `fetchPost()` for local testing
- Save posts locally with `saveNoteLocally()` function for debugging
- Test with various fediverse URLs to ensure broad compatibility

## Environment Configuration

### Required Environment Variables
- `SERVER_DOMAIN` - Your server's domain for ActivityPub federation
- Server must be accessible via HTTPS for proper federation

### Local Development
- Uses memory-based KV store (not persistent)
- No database required for basic functionality
- Can operate offline with locally saved test data

## Common Patterns

### ActivityPub Object Fetching
```tsx
const { post, author } = await fetchPost(postUrl);

// Always handle null cases
if (!post) {
  return <ErrorComponent />;
}

// Parse content safely
const contentHtml = post?.content?.toString() ?? "";
```

### Custom SVG Integration
```tsx
import MySvg from "@/public/my-svg.svg";

// Use as React component
<MySvg className="text-highlight hover:text-bg-darker" />
```

### Conditional Styling with Tailwind
```tsx
import classnames from "classnames";

<div className={classnames(
  "base-classes",
  condition && "conditional-classes",
  anotherCondition ? "true-classes" : "false-classes"
)} />
```

### HTML Content Parsing
```tsx
import parse from "html-react-parser";

const options: HTMLReactParserOptions = {
  replace(domNode) {
    // Custom parsing logic for links, hashtags, etc.
  }
};

{parse(contentHtml, options)}
```

## File Naming Conventions
- Use kebab-case for file and folder names
- Use camelCase for TypeScript files and components
- Use descriptive names that reflect component purpose
- SVG assets use kebab-case with descriptive names

## Production Considerations
- Replace MemoryKvStore with persistent storage (Redis, etc.)
- Implement proper error handling and logging
- Add rate limiting for ActivityPub requests
- Set up proper CORS and security headers
- Consider implementing caching for frequently accessed posts
- Add proper monitoring for federation requests

## Theming & Design
- Light theme with cream/yellow color palette
- Comic-style typography with custom OpenComicFont
- Extensive use of custom SVG graphics for visual interest
- Creative clip-path and animation effects
- Responsive design optimized for both mobile and desktop

## Error Handling
- Always handle ActivityPub lookup failures gracefully
- Implement proper TypeScript error types
- Provide meaningful fallbacks for missing content
- Log errors for debugging while avoiding user-facing crashes
- Handle various edge cases in URL processing

## Testing Approach
- Use local post saving/loading for development testing
- Test with various fediverse platforms (Mastodon, Pixelfed, etc.)
- Validate different post formats and content types
- Test federation functionality with real ActivityPub servers

## Remember
- This is a learning project, not production-ready code
- Always handle ActivityPub protocol edge cases gracefully
- Use TypeScript strictly to catch federation-related errors early
- Leverage the creative SVG assets for engaging user experience
- Focus on proper ActivityPub protocol implementation
- Consider performance implications of real-time federation requests
- Implement proper content security when parsing remote HTML content
