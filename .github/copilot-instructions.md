# Basic Fediverse Reader Copilot Instructions

## Project Overview

Basic Fediverse Reader is a simple reader application for viewing posts and profiles from the fediverse (ActivityPub network). Built with Next.js, React, TypeScript, and Tailwind CSS, it uses Fedify for ActivityPub protocol integration. The app allows users to input either fediverse post URLs or profile URLs, automatically detecting the type and displaying posts with rich formatting, hashtag highlighting, custom emoji support, and author information, or showing user profiles with recent posts. This is a personal learning project demonstrating ActivityPub integration and is not considered production-ready.

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
- **Custom Emoji Support** - Server-specific emoji rendering with hand-drawn filters

## Architecture Patterns

### File Structure
```
app/
├── [fedify]/                   # ActivityPub federation routes
│   └── [[...catchAll]]/        # Catch-all route handler
├── post/[...postUrl]/          # Dynamic post viewing pages
├── profile/[...userHandle]/    # Dynamic profile viewing pages
├── fonts/                      # Custom font assets
├── globals.css                 # Global styles and CSS variables
├── layout.tsx                  # Root layout with font loading
└── page.tsx                    # Homepage with navigation

components/
├── nav.tsx                     # Smart URL input component (posts & profiles)
├── toot.tsx                    # Main post display component
├── tootAuthor.tsx              # Author information display
├── tootCard.tsx                # Compact post card component
├── tootCardFull.tsx            # Full post card component
├── profileHeader.tsx           # Profile header display component
├── tagList.tsx                 # Hashtag rendering component
├── emojiText.tsx               # Client component for text with custom emojis
└── emojiHtml.tsx               # Client component for HTML with custom emojis

util/
├── federation.ts               # Fedify setup and instance actor
├── fetchPost.ts                # ActivityPub post and profile fetching logic
├── helpers.ts                  # URL parsing and utility functions
├── emoji.ts                    # Custom emoji extraction and processing utilities
└── emojiServer.ts              # Server actions for emoji processing

public/                         # SVG assets and graphics
└── [extensive SVG collection]  # Custom illustrations and UI elements
```

### ActivityPub Integration
- **Fedify Federation** - Core ActivityPub protocol implementation
- **Instance Actor** - Required for object lookups on some Mastodon servers  
- **Document Loader** - Handles ActivityPub object resolution
- **Memory KV Store** - Temporary storage for development (should be replaced in production)
- **Dynamic Route Handling** - `/[fedify]/[[...catchAll]]/` handles all ActivityPub requests

### Fedify Framework Deep Dive
- **Documentation**: Primary docs at https://fedify.dev/reference/, especially the Context API and vocabulary sections
- **Core API Reference**: https://fedify.dev/reference/fedify/ - Complete API documentation
- **ActivityPub Vocabulary**: https://fedify.dev/reference/vocab/ - All ActivityPub object types and properties
- **Context API**: https://fedify.dev/reference/fedify/Context/ - Federation context and document loader
- **Lookup Functions**: https://fedify.dev/reference/fedify/lookupObject/ - Object resolution and federation
- **Federation Setup**: https://fedify.dev/manual/federation/ - Server setup and configuration
- **Error Handling**: https://fedify.dev/manual/federation/#error-handling - Best practices for federation errors
- **Collection Traversal**: Use `ctx.traverseCollection()` to iterate through ActivityPub collections like outboxes
  - Pattern: `for await (const activity of ctx.traverseCollection(outbox, { documentLoader }))`
  - Always handle errors gracefully as remote servers may be unreachable or return malformed data
- **Object Lookup**: Use `lookupObject()` with handles (@user@server.com) or URLs
  - Example: `lookupObject("@chris@floss.social", { documentLoader })`
  - Can fetch Actors, Notes, and other ActivityPub objects
- **Async Property Access**: Many Fedify objects require async access to properties
  - Example: `await actor.getIcon({ documentLoader })` for avatars
  - Example: `await actor.getOutbox({ documentLoader })` for user's outbox
- **Type Safety**: Import specific vocab types (`Actor`, `Note`, `Create`, etc.) from `@fedify/fedify/vocab`
- **Document Loader Context**: Always pass `{ documentLoader }` to async methods for proper federation

### ActivityPub Vocabulary Understanding
- **Actor**: Represents users/accounts (Person, Application, etc.)
- **Note**: Represents posts/toots/messages
- **Create**: Activity type that wraps Notes when posted
- **Collection**: Ordered lists like outboxes, followers, following
- **Outbox**: Collection of activities (Create, Announce, etc.) from an actor
- **Object Properties**: URLs in ActivityPub are URL objects, need `.toString()` for strings
- **Content Serialization**: Convert Fedify objects to simple types for Next.js serialization between server/client

### Real ActivityPub Data Fetching Patterns
```typescript
// Fetch user posts from outbox
const actor = await lookupObject(handle, { documentLoader }) as Actor;
const outbox = await actor.getOutbox({ documentLoader });

for await (const activity of context.traverseCollection(outbox, { documentLoader })) {
  if (activity instanceof Create) {
    const note = await activity.getObject({ documentLoader });
    if (note instanceof Note) {
      // Process the post
    }
  }
}

// Get avatar URL
const icon = await actor.getIcon({ documentLoader });
const avatarUrl = icon?.url?.toString();
```

### Post Fetching Architecture
- **URL Processing** - Handles various fediverse URL formats (elk.zone, Flipboard, etc.) and automatically detects post vs profile URLs
- **ActivityPub Object Lookup** - Fetches Notes (posts) and Actors (users) from remote servers
- **Profile Data Fetching** - Retrieves user profiles and their recent posts from outboxes via collection traversal
- **Content Parsing** - Safely parses HTML content from posts
- **Attachment Processing** - Handles images and media attachments
- **Local Testing** - Can save/load posts locally via `post.json` for development
- **Type Conversion** - Convert complex Fedify objects to simple serializable types for components

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
- Handle various fediverse URL formats and edge cases for both posts and profiles
- Implement caching strategies for production deployments

### Fedify Development Best Practices
- Always handle ActivityPub lookup failures gracefully
- Implement proper TypeScript error types  
- Provide meaningful fallbacks for missing content
- Log errors for debugging while avoiding user-facing crashes
- Handle various edge cases in URL processing
- Always pass `{ documentLoader }` to async Fedify methods
- Use `instanceof` checks for ActivityPub vocabulary objects (Note, Actor, Create)
- Convert Fedify objects to simple types for Next.js server/client serialization
- Handle avatar fetching with `await actor.getIcon({ documentLoader })`
- Test with various fediverse platforms (Mastodon, Pixelfed, etc.)
- Validate different post formats and content types

## Key Components & Features

### Navigation (`nav.tsx`)
- Smart URL input field that automatically detects post URLs vs profile URLs
- Supports various fediverse URL formats (Mastodon, elk.zone, etc.)
- Creative SVG-based styling with hover effects
- Enter key and button submission handling
- Automatic URL processing and redirection to appropriate post or profile pages

### Post Display (`toot.tsx`)
- HTML content parsing with custom link and hashtag rendering
- Dynamic SVG highlight animations based on text length
- Proper handling of ActivityPub content structure
- Support for various content types and formatting

### Author Information (`tootAuthor.tsx`)
- ActivityPub Actor display with avatar and metadata
- Custom clip-path styling for creative avatar shapes
- Responsive design for mobile and desktop views

### Profile Header (`profileHeader.tsx`)
- Displays user profile information including avatar, name, and bio
- Handles various ActivityPub Actor properties
- Integrates with creative SVG styling system
- Responsive layout for mobile and desktop

### Custom Emoji Support
The application includes comprehensive support for fediverse custom emojis:

#### Emoji Components (`emojiText.tsx`, `emojiHtml.tsx`)
- **EmojiText**: Client component for rendering plain text with custom emoji replacements
- **EmojiHtml**: Client component for rendering HTML content with custom emoji replacements
- **Real-time Processing**: Emojis are processed client-side for smooth rendering
- **Server Integration**: Emoji data is extracted during ActivityPub object fetching

#### Emoji Utilities (`emoji.ts`, `emojiServer.ts`)
- **extractCustomEmojis()**: Extracts emoji data from ActivityPub tags (Emoji vocabulary objects)
- **replaceCustomEmojis()**: Replaces shortcodes with HTML img tags
- **processCustomEmojis()**: Server action for emoji processing
- **Type Safety**: Full TypeScript support with CustomEmoji interface

#### Emoji Features
- **ActivityPub Integration**: Uses Fedify's Emoji vocabulary objects from ActivityPub tags
- **Server-Specific**: Each fediverse server can have unique custom emoji sets
- **Universal Support**: Works in usernames, post content, and profile bios
- **Styled Integration**: Custom CSS with hand-drawn aesthetic filters
- **Performance**: Client-side processing with server-side data extraction

#### Implementation Pattern
```tsx
// Extract emojis during ActivityPub fetching
const emojis = await extractCustomEmojis(activityPubTags);

// Use in components
<EmojiText text={displayName} emojis={actor.emojis} />
<EmojiHtml html={bioContent} emojis={actor.emojis} />
```

### Federation Route (`[fedify]/[[...catchAll]]/route.ts`)
- Handles all ActivityPub federation requests
- Integrates with x-forwarded-fetch for proper request handling
- Provides proper HTTP responses for federation protocol

## Development Commands

### Primary Commands
- `npm run dev` - Start development server (**NOTE: Do not run this in chat - it's a never-ending command that will hang the session, just ask the user to do it.**)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run Biome linter and formatter

### Development Workflow
- Use `fetchTestPost()` instead of `fetchPost()` for local testing
- Save posts locally with `saveNoteLocally()` function for debugging
- Test with various fediverse URLs (both posts and profiles) to ensure broad compatibility

## Environment Configuration

### Required Environment Variables
- `SERVER_DOMAIN` - Your server's domain for ActivityPub federation
- Server must be accessible via HTTPS for proper federation

### Local Development
- Uses memory-based KV store (not persistent)
- No database required for basic functionality
- Can operate offline with locally saved test data

## URL Processing & Detection

### Smart URL Parsing (`helpers.ts`)
The application includes intelligent URL parsing that can differentiate between post URLs and profile URLs:

```typescript
import { parseFediverseUrl } from "@/util/helpers";

// Parse any fediverse URL
const parsed = parseFediverseUrl("https://floss.social/@chris");
// Returns: { type: 'profile', path: 'chris@floss.social', handle: '@chris@floss.social' }

const postParsed = parseFediverseUrl("https://mastodon.social/@user/123456789");
// Returns: { type: 'post', path: 'mastodon.social/@user/123456789' }
```

### URL Detection Logic
- **Profile URLs**: Detects formats like `server.com/@username`, `server.com/users/username`
- **Post URLs**: Detects long numeric IDs, `/notes/`, `/status/`, `/objects/` paths
- **URL Cleaning**: Removes protocols, handles elk.zone prefixes, Flipboard suffixes
- **Fallback Behavior**: Defaults to post URL if type cannot be determined

### Navigation Integration
The navigation component uses this parsing to automatically route users to the correct page type:

```typescript
const parsed = parseFediverseUrl(userInput);
if (parsed?.type === 'profile') {
  window.location.href = `/profile/${parsed.path}`;
} else {
  window.location.href = `/post/${parsed.path}`;
}
```

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

### Collection Traversal for User Posts
```tsx
// Fetch recent posts from a user's outbox using real ActivityPub data
const actor = await lookupObject("@username@server.com", { documentLoader }) as Actor;
const outbox = await actor.getOutbox({ documentLoader });

const posts = [];
for await (const activity of context.traverseCollection(outbox, { documentLoader })) {
  if (activity instanceof Create) {
    const note = await activity.getObject({ documentLoader });
    if (note instanceof Note) {
      posts.push({ post: note, author: actor });
    }
  }
}
```

### User Profile and Posts Fetching
```tsx
// Fetch user profile and recent posts using the helper function
const recentPosts = await fetchUserPosts("@username@server.com", 6);

// Fetch actor information separately for profile display
const actor = await lookupObject("@username@server.com", { documentLoader }) as Actor;
const icon = await actor.getIcon({ documentLoader });

// Convert to simple types for component props
const simpleActor = {
  id: actor.id?.toString(),
  name: actor.name,
  preferredUsername: actor.preferredUsername,
  url: actor.url?.toString(),
  avatarUrl: icon?.url?.toString(),
  summary: actor.summary?.toString(),
};
```

### Avatar Handling Pattern
```tsx
// Fetch avatar URL from actor
const icon = await actor.getIcon({ documentLoader });
const avatarUrl = icon?.url?.toString();

// Convert to simple types for serialization between server/client
const simpleActor = {
  name: actor.name,
  avatarUrl: icon?.url?.toString(),
  // ... other properties
};
```

### Type Conversion for Next.js Serialization
```tsx
// Convert complex Fedify objects to simple serializable types
function convertToSimpleTypes(posts: Array<{ post: Note; author: Actor }>) {
  return posts.map(({ post, author }) => ({
    post: {
      id: post.id?.toString(),
      content: post.content,
      published: post.published ? new Date(post.published.toString()) : undefined,
    },
    author: {
      name: author.name,
      url: author.url?.toString(),
    },
  }));
}
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
- Custom emoji styling with `.inline-emoji` CSS class featuring hand-drawn filters

## Error Handling
- Always handle ActivityPub lookup failures gracefully
- Implement proper TypeScript error types
- Provide meaningful fallbacks for missing content
- Log errors for debugging while avoiding user-facing crashes
- Handle various edge cases in URL processing
- Use try-catch blocks around all ActivityPub operations
- Handle network timeouts and server unavailability
- Gracefully handle malformed ActivityPub responses
- Return empty arrays or null values rather than throwing errors to UI
- Log detailed error information for debugging while showing user-friendly messages

## ActivityPub-Specific Error Patterns
```tsx
// Always wrap ActivityPub calls in try-catch
try {
  const actor = await lookupObject(handle, { documentLoader }) as Actor;
  const outbox = await actor.getOutbox({ documentLoader });
  // Process outbox...
} catch (error) {
  console.error("ActivityPub lookup failed:", error);
  return []; // Return empty array instead of throwing
}

// Handle individual activity processing errors
for await (const activity of context.traverseCollection(outbox, { documentLoader })) {
  try {
    // Process activity...
  } catch (error) {
    console.warn("Error processing activity:", error);
    continue; // Skip this activity, continue with next
  }
}
```

## Testing Approach
- Use local post saving/loading for development testing
- Test with various fediverse platforms (Mastodon, Pixelfed, etc.)
- Validate different post formats and content types
- Test federation functionality with real ActivityPub servers
- Test both post URL and profile URL parsing and handling
- Verify profile page rendering with various user account types

## Remember
- This is a learning project, not production-ready code
- Always handle ActivityPub protocol edge cases gracefully
- Use TypeScript strictly to catch federation-related errors early
- Leverage the creative SVG assets for engaging user experience
- Focus on proper ActivityPub protocol implementation
- Consider performance implications of real-time federation requests
- Implement proper content security when parsing remote HTML content

## Key Lessons from Real Implementation
- **Collection Traversal is the Key**: Use `context.traverseCollection()` to fetch user posts from outboxes rather than trying to construct URLs
- **Avatar Fetching**: Use `await actor.getIcon({ documentLoader })` pattern, always include documentLoader context
- **Type Serialization**: Convert complex Fedify objects to simple types for Next.js server/client boundaries
- **Error Resilience**: ActivityPub federation can fail in many ways - always have fallbacks and continue processing other items
- **Documentation**: Fedify's docs at https://fedify.dev/reference/ are essential, especially Context API and vocabulary sections
- **Real Data vs Sample Data**: Always prefer real ActivityPub data over mock data - the protocol has nuances that samples miss
- **URL Detection**: Smart URL parsing enables dual functionality (posts + profiles) while maintaining backward compatibility
- **Profile Data Architecture**: User profiles require both Actor lookup and outbox traversal for complete functionality
