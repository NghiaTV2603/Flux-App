# Flux Chat Frontend

Modern React frontend application for the Flux Chat platform built with cutting-edge technologies.

## 🚀 Tech Stack

- **React 19** - Latest React with concurrent features
- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - Predictable state container
- **RTK Query** - Powerful data fetching and caching
- **React Router** - Declarative routing
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation
- **shadcn/ui** - Beautiful and accessible UI components
- **ESLint + Prettier** - Code quality and formatting

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── pages/              # Page components
│   └── auth/           # Authentication pages
├── store/              # Redux store setup
│   ├── api/            # RTK Query API endpoints
│   └── slices/         # Redux slices
├── lib/                # Utility functions
│   └── validations/    # Zod validation schemas
├── routes/             # Router configuration
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── constants/          # App constants
```

## 🛠️ Development

### Prerequisites

- Node.js 20.19.0+ (recommended)
- npm 10+

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp env.example .env.local
```

3. Update environment variables in `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_NODE_ENV=development
```

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Type checking
npm run type-check
```

## 🎨 UI Components

This project uses shadcn/ui components with Tailwind CSS for styling. Components are:

- **Accessible** - Built with Radix UI primitives
- **Customizable** - Easy to modify with CSS variables
- **TypeScript** - Fully typed components
- **Modern** - Latest design patterns

### Adding New Components

To add new shadcn/ui components:

1. Copy component code from [shadcn/ui](https://ui.shadcn.com/)
2. Place in `src/components/ui/`
3. Import and use in your pages

## 🔧 State Management

### Redux Store Structure

- **auth** - Authentication state and user info
- **api** - RTK Query cache and API state

### API Integration

RTK Query is configured to work with the backend API:

- **Base URL** - Configured via environment variable
- **Authentication** - Automatic token handling
- **Caching** - Intelligent caching and invalidation
- **Error Handling** - Standardized error responses

## 🛡️ Form Validation

Forms use React Hook Form with Zod validation:

```typescript
// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password too short'),
});

// Use in component
const methods = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});
```

## 🎯 Features

### Implemented

- ✅ Project setup with all technologies
- ✅ Authentication system (login/register)
- ✅ Protected routes
- ✅ Responsive design
- ✅ Form validation
- ✅ Error handling
- ✅ Type safety

### Upcoming

- 🔄 Server management
- 🔄 Real-time messaging
- 🔄 Channel system
- 🔄 User profiles
- 🔄 Settings panel
- 🔄 File uploads
- 🔄 Voice channels

## 📝 Code Quality

### ESLint Configuration

- TypeScript support
- React hooks rules
- Prettier integration
- Custom rules for code consistency

### Prettier Configuration

- Single quotes
- Semicolons
- 2-space indentation
- Trailing commas

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables

Required environment variables for production:

```env
VITE_API_URL=https://your-api-domain.com/api
VITE_NODE_ENV=production
```

## 🤝 Contributing

1. Follow the established code style
2. Write TypeScript for all new code
3. Add proper validation for forms
4. Test your changes
5. Update documentation as needed

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
