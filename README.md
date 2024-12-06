# Basic Fediverse Reader

A simple reader for reading posts from the fediverse. Built with Fedify, Next.js, React, and Tailwind.

This project is personal learning project on example for a simple next.js app to fetch Fediverse posts with Fedify. I would not consider the code production-ready.

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

## Project Overview

Here is a brief overview of important files and folders in the project:

- The React code is mainly in the /app and /components folders.
  - `post/[...postUrl]` - This is the main page for viewing posts.
  - `[fedify]/[[...catchAll]]` - Allows this app to run as an ActivityPub sever.
- `/util` has federation setup, post fetching, utility functions.
- `/public` has the bulk of the SVGs used.
