# Streaming Tracker - Frontend

Modern React-based frontend for the Streaming Tracker application built with Vite.

## Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite 6+
- **Routing**: React Router 7+
- **State Management**: Context API + React Query
- **HTTP Client**: Axios
- **Drag & Drop**: @dnd-kit
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint + Prettier

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend API running on http://localhost:3001

## Getting Started

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

The default values should work for local development. Adjust if needed:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_API_TIMEOUT` - API request timeout
- `VITE_TMDB_IMAGE_BASE_URL` - TMDB image CDN URL

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:5173

The dev server will automatically open in your browser and includes:
- Hot Module Replacement (HMR)
- Auto-refresh on file changes
- API proxy to backend (avoids CORS issues)

## Available Scripts

### Development
- `npm run dev` - Start development server with HMR
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally

### Testing
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI dashboard
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
frontend/
├── public/              # Static assets
│   └── vite.svg
├── src/
│   ├── api/            # API client and endpoints
│   ├── components/     # React components
│   │   ├── common/     # Reusable UI components
│   │   ├── auth/       # Authentication components
│   │   ├── lists/      # List management components
│   │   ├── titles/     # Title components
│   │   ├── recommendations/  # AI recommendation components
│   │   ├── settings/   # Settings components
│   │   └── layout/     # Layout components
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Route-level components
│   ├── styles/         # Global styles
│   ├── utils/          # Utility functions
│   ├── test/           # Test setup
│   ├── App.jsx         # Root component
│   ├── main.jsx        # Application entry point
│   └── routes.jsx      # Route definitions
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── vitest.config.js    # Vitest configuration
```

## Component Organization

### Component Structure

Each component should follow this structure:

```
ComponentName/
├── ComponentName.jsx       # Component logic
├── ComponentName.module.css # Scoped styles (if using CSS Modules)
└── ComponentName.test.jsx  # Component tests
```

### Component Guidelines

- Use functional components with hooks
- Keep components under 200 lines
- Write JSDoc comments for props
- Co-locate tests with components
- Use meaningful component and prop names

Example:

```jsx
/**
 * Button component with loading state.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Button text
 * @param {Function} props.onClick - Click handler
 * @param {boolean} [props.loading=false] - Loading state
 * @param {string} [props.variant='primary'] - Button style variant
 * @returns {JSX.Element}
 */
function Button({ label, onClick, loading = false, variant = 'primary' }) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : label}
    </button>
  );
}
```

## Routing

The application uses React Router for client-side routing:

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)
- `/recommendations` - AI recommendations (protected)
- `/settings` - User settings (protected)
- `/` - Redirects to `/dashboard`

Protected routes require authentication and redirect to `/login` if user is not authenticated.

## State Management

### Context API

Global state is managed using React Context:

- **AuthContext** - User authentication state
- **ListContext** - Lists and titles data
- **ThemeContext** - UI theme preferences
- **NotificationContext** - Toast notifications

### React Query

Data fetching and caching is handled by React Query:

- Automatic caching and background refetching
- Optimistic updates
- Request deduplication
- Retry logic

Example:

```jsx
import { useQuery } from '@tanstack/react-query';
import { listAPI } from '@api/list.api';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lists'],
    queryFn: listAPI.getLists
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

## Path Aliases

The following path aliases are configured in `vite.config.js`:

- `@` → `src/`
- `@components` → `src/components/`
- `@pages` → `src/pages/`
- `@hooks` → `src/hooks/`
- `@context` → `src/context/`
- `@api` → `src/api/`
- `@utils` → `src/utils/`
- `@styles` → `src/styles/`

Example usage:

```jsx
import Button from '@components/common/Button/Button';
import { useAuth } from '@hooks/useAuth';
import { formatDate } from '@utils/formatters';
```

## Styling

### Global Styles

Global styles are defined in `src/styles/globals.css`:
- CSS reset
- Typography
- Utility classes
- Common UI patterns

### Component Styles

Options for component styling:
1. **CSS Modules** (recommended) - Scoped styles per component
2. **Inline styles** - Dynamic styles
3. **Global classes** - Utility classes from globals.css

### CSS Variables

Use CSS variables for theming:

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --background-color: #f5f5f5;
  --text-color: #333;
}
```

## Testing

### Unit Testing

Test components, hooks, and utilities:

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);

    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Coverage Goals

- Overall: 60%+ coverage
- Components: Test rendering, interactions, edge cases
- Hooks: Test state changes, side effects
- Utils: Test all input/output combinations

## Development Guidelines

### Code Style

- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Keep files under 500 lines (split if needed)
- Write descriptive variable and function names
- Add JSDoc comments for all functions

### Performance

- Use React.memo for expensive components
- Implement virtualization for long lists
- Lazy load routes with React.lazy()
- Optimize images (use WebP, proper sizing)
- Monitor bundle size with build stats

### Accessibility

- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

## Build & Deployment

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory:
- Minified JavaScript and CSS
- Code splitting for better performance
- Source maps for debugging
- Asset optimization

### Preview Build

```bash
npm run preview
```

Preview the production build locally before deploying.

### Deployment Options

1. **Static Hosting** (Vercel, Netlify):
   - Connect GitHub repository
   - Auto-deploy on push to main
   - Environment variables in dashboard

2. **Traditional Server**:
   - Upload `dist/` folder contents
   - Configure web server (nginx, Apache)
   - Set up SSL certificate

3. **Docker**:
   - Build with Node.js base image
   - Serve with nginx
   - Include in docker-compose.yml

## Troubleshooting

### Port Already in Use

Change the port in `vite.config.js`:

```js
server: {
  port: 3000 // or any available port
}
```

### API Connection Issues

1. Verify backend is running on http://localhost:3001
2. Check `VITE_API_BASE_URL` in `.env`
3. Review browser console for CORS errors
4. Check Vite proxy configuration

### Build Failures

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check for TypeScript errors (if using .tsx)
3. Review ESLint errors
4. Verify all imports are correct

## License

Apache 2.0

## Related Documentation

- [PLANNING.md](../PLANNING.md) - Architecture and design decisions
- [TASK.md](../TASK.md) - Task tracking
- [Backend README](../backend/README.md) - Backend API documentation
