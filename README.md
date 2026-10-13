# VidyaExam

**Empowering learning, achieving dreams.**

VidyaExam is an education-focused, role-based examination platform designed to support online assessments, learning progress, and exam administration. The repository contains a React + Vite frontend and a separate backend directory.

> **Project status:** Active development. Features, API routes, and setup requirements may change. Check the source code and environment configuration for the current implementation.

## Contents

- [Overview](#overview)
- [Key capabilities](#key-capabilities)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Available scripts](#available-scripts)
- [Development workflow](#development-workflow)
- [Security notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)

## Overview

VidyaExam is being developed to serve learners and education organizations through role-based access and subscription-aware experiences. Its intended scope includes student learning, mock examinations, results, and tools for managing exams and users.

Refer to the source files and backend documentation for exact endpoints, supported roles, and feature availability in your current checkout.

## Key capabilities

Depending on the current implementation, the platform is designed to support:

- **Role-based experiences** for students and education/organization staff.
- **Authentication and account management** with protected routes.
- **Mock tests and assessments** for exam practice.
- **Results and progress views** for reviewing performance.
- **Exam administration**, such as creating or scheduling assessments.
- **User management** for students and teachers.
- **Subscription-aware plans** for individual and organization/tenant use.

Some capabilities may still be in development or require backend/API configuration. Do not assume a feature is production-ready solely because it is listed here.

## Technology stack

### Frontend

- React
- Vite
- JavaScript / JSX
- React Router
- Lucide React
- Sonner notifications
- CSS

### Backend and data

The repository includes `VidyaExam_Backend/`. Check its package/configuration files and documentation for the authoritative backend framework, database, and setup instructions.

## Repository structure

```text
VidyaExam/
├── vidyaexam-frontend/   # React + Vite frontend
├── VidyaExam_Backend/    # Backend application and API
├── README.md
└── LICENSE
```

The exact structure may change during development.

## Getting started

### Prerequisites

Install the tools required by the frontend and backend:

- Git
- Node.js and npm compatible with the project's Vite/package configuration
- The database and runtime required by the backend
- Any API credentials or environment configuration required for local development

### 1. Clone the repository

```bash
git clone https://github.com/Saurabhh0000/VidyaExam.git
cd VidyaExam
```

### 2. Start the frontend

```bash
cd vidyaexam-frontend
npm install
```

Create a local `.env` file if required. For example:

```env
VITE_API_BASE_URL=http://localhost:5173
```

Replace the example value with the actual backend API URL and port. Verify the required variable names against the current source code.

Start the development server:

```bash
npm run dev
```

Vite prints the local URL in the terminal, commonly `http://localhost:5173`.

### 3. Start the backend

Open another terminal:

```bash
cd VidyaExam_Backend
```

Follow the backend's README and package/configuration files to install dependencies, configure the database, and start the API. Backend commands are not specified here because they must match the current implementation.

### 4. Connect frontend and backend

Set `VITE_API_BASE_URL` to the backend API base URL. Ensure the backend is running and its CORS configuration allows requests from the frontend development origin.

## Environment configuration

- Keep local environment files out of version control.
- Use `.env.example` files to document variable names without including real secrets.
- Configure the frontend API URL for the environment where the backend runs.
- Configure database and authentication settings using the backend's documented environment variables.
- Use separate development and production configuration.

Verify environment variable names and required values against the current source code.

## Available scripts

From `vidyaexam-frontend/`, common Vite scripts include:

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run preview  # Preview the production build locally
```

Run `npm run` to see the scripts actually defined in `package.json`. Run linting only if a lint script is configured.

## Development workflow

1. Create a feature branch for your change.
2. Keep changes focused and avoid committing generated files or secrets.
3. Test the relevant frontend and backend flows.
4. Run available lint and build checks.
5. Review the changes before merging.

Coordinate changes to shared files with other contributors and resolve merge conflicts before pushing.

## Security notes

- Never commit real `.env` files, credentials, API keys, tokens, or private certificates.
- Validate and authorize protected operations on the backend; frontend route guards alone are not a security boundary.
- Do not expose server secrets through variables prefixed with `VITE_`; these variables are included in the client bundle.
- Use HTTPS and appropriate production authentication/session settings when deploying.
- Review dependencies and deployment configuration before releasing to production.

## Contributing

Contributions and improvements should be coordinated with the project maintainers.

1. Discuss significant changes with the maintainers first.
2. Create a focused branch.
3. Follow the existing code style and architecture.
4. Test the affected functionality.
5. Describe the change and any required configuration in your pull request.

Do not include secrets, personal data, or production credentials in issues, commits, or pull requests.

## License

This project is distributed under the MIT License. See [`LICENSE`](./LICENSE) for the full license text.

Before publishing this license, ensure all relevant contributors or rights holders agree to release the applicable code under these terms. Third-party assets and dependencies remain subject to their own licenses.
