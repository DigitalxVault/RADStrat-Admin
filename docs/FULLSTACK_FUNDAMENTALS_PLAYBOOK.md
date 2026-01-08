# Full-Stack Fundamentals Playbook

A practical handbook synthesized from the FS Training Bootcamp curriculum, distilling production patterns and best practices into actionable guidance.

---

## 1. Purpose & How to Use This Playbook

### What This Is
A consolidated reference guide for building production-grade full-stack applications. This playbook extracts the core teachings from a comprehensive training curriculum covering frontend, backend, databases, cloud infrastructure, security, and DevOps.

### How to Use It
- **As a checklist**: Use section checkboxes when starting new projects
- **As a reference**: Jump to specific sections when implementing features
- **As a learning path**: Follow sections sequentially for foundational understanding
- **As a code review guide**: Verify implementations against documented patterns

### Prerequisites
- Basic JavaScript/TypeScript knowledge
- Familiarity with terminal/command line
- Understanding of HTTP basics

**Repo references**: `slides/01-introduction.md`

---

## 2. Full-Stack Mental Model

### The Request Lifecycle
Every user action follows this path through your stack:

```
User Action → Browser → Network → Server → Database → Response Path (reverse)
```

### Layer Responsibilities

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **Presentation** | User interface, interactions | Next.js, React |
| **API Gateway** | Request routing, middleware | Express/NestJS |
| **Business Logic** | Domain rules, orchestration | Services layer |
| **Data Access** | Database operations | Prisma ORM |
| **Infrastructure** | Hosting, scaling, monitoring | AWS, Docker |

### The Full-Stack Developer's Mental Checklist
When implementing any feature, consider:

- [ ] How does data flow from UI to database?
- [ ] Where does validation happen (client, server, both)?
- [ ] What happens when things fail?
- [ ] How will this scale under load?
- [ ] What security implications exist?

### Key Principle: Separation of Concerns
Each layer should only know about its immediate neighbors:
- Controllers don't query databases directly
- Services don't know about HTTP
- Repositories don't contain business logic

**Repo references**: `slides/01-introduction.md`, `slides/04-backend-fundamentals.md`

---

## 3. Codebase Structure Standards

### Frontend Structure (Next.js App Router)

```
src/
├── app/                    # Routes and pages
│   ├── (auth)/            # Route groups for layouts
│   ├── api/               # API routes (if needed)
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI primitives
│   └── features/          # Feature-specific components
├── lib/                   # Utilities, API clients
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript definitions
```

### Backend Structure (NestJS)

```
src/
├── modules/
│   └── [feature]/
│       ├── [feature].controller.ts
│       ├── [feature].service.ts
│       ├── [feature].repository.ts
│       ├── dto/
│       └── entities/
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── filters/
├── config/
└── main.ts
```

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `UserCard.tsx` |
| Hooks | camelCase with `use` | `useAuth.ts` |
| Services | kebab-case with suffix | `user.service.ts` |
| DTOs | kebab-case with suffix | `create-user.dto.ts` |
| Constants | SCREAMING_SNAKE | `API_ENDPOINTS.ts` |

### Module Independence Checklist
- [ ] Each module is self-contained
- [ ] No circular dependencies between modules
- [ ] Shared code lives in `common/` or `shared/`
- [ ] Clear public API (what the module exports)

**Repo references**: `slides/03-frontend-fundamentals.md`, `slides/04-backend-fundamentals.md`

---

## 4. JavaScript/TypeScript Fundamentals

### TypeScript Essentials for Full-Stack

#### Type Definitions Pattern
```typescript
// Define once, use everywhere
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Partial for updates
type UpdateUserDto = Partial<Pick<User, 'email' | 'role'>>;

// Omit for creation (no id yet)
type CreateUserDto = Omit<User, 'id' | 'createdAt'>;
```

#### Async/Await Patterns
```typescript
// Always handle errors explicitly
async function fetchUser(id: string): Promise<User | null> {
  try {
    const user = await userService.findById(id);
    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    return null;
  }
}
```

#### Null Safety
```typescript
// Use optional chaining
const userName = user?.profile?.name ?? 'Anonymous';

// Use type guards
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'email' in value;
}
```

### Common Gotchas Checklist
- [ ] Always specify return types for functions
- [ ] Use `unknown` instead of `any` when type is truly unknown
- [ ] Prefer `interface` for object shapes, `type` for unions/intersections
- [ ] Enable `strict` mode in tsconfig.json

**Repo references**: `slides/03-frontend-fundamentals.md`, `slides/05-api-production.md`

---

## 5. Frontend Fundamentals

### Component Architecture

#### Component Types
| Type | Purpose | State? | Example |
|------|---------|--------|---------|
| **Page** | Route entry point | Server | `app/users/page.tsx` |
| **Layout** | Shared structure | Server | `app/layout.tsx` |
| **Feature** | Business logic | Client | `UserDashboard.tsx` |
| **UI** | Reusable primitives | Minimal | `Button.tsx` |

#### Server vs Client Components
```typescript
// Server Component (default) - no 'use client'
// Can: fetch data, access backend, use async/await
// Cannot: use hooks, add event handlers

// Client Component
'use client';
// Can: use hooks, handle events, manage local state
// Cannot: directly access server resources
```

### State Management Patterns

#### Local State (Single Component)
```typescript
const [isOpen, setIsOpen] = useState(false);
```

#### Shared State (Multiple Components)
```typescript
// Context for auth, theme, etc.
const AuthContext = createContext<AuthState | null>(null);
```

#### Server State (Remote Data)
```typescript
// Use React Query or SWR
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

### Form Handling Pattern
```typescript
// React Hook Form + Zod validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### Frontend Checklist
- [ ] Components are small and focused (< 200 lines)
- [ ] Business logic extracted to hooks
- [ ] API calls centralized in `lib/api`
- [ ] Loading and error states handled
- [ ] Forms validated client-side AND server-side

**Repo references**: `slides/03-frontend-fundamentals.md`

---

## 6. Backend Fundamentals

### Layered Architecture

```
Request → Controller → Service → Repository → Database
                ↓
           Response ← (reverse path)
```

#### Layer Responsibilities

| Layer | Does | Doesn't |
|-------|------|---------|
| **Controller** | Parse request, validate input, return response | Contain business logic |
| **Service** | Business logic, orchestration, transactions | Know about HTTP, SQL |
| **Repository** | Database operations, queries | Contain business rules |

### Controller Pattern
```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException();
    return user;
  }
}
```

### Service Pattern
```typescript
@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Business logic here
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.userRepo.create({ ...dto, password: hashedPassword });
  }
}
```

### Repository Pattern
```typescript
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

### API Response Standards
```typescript
// Success responses
{ data: T }                    // Single item
{ data: T[], meta: { total, page, limit } }  // List with pagination

// Error responses
{
  statusCode: number,
  message: string,
  error: string,
  timestamp: string
}
```

### Backend Checklist
- [ ] Controllers are thin (no business logic)
- [ ] Services are testable (dependencies injected)
- [ ] All inputs validated with DTOs
- [ ] Errors return consistent format
- [ ] Database access only through repositories

**Repo references**: `slides/04-backend-fundamentals.md`, `slides/05-api-production.md`

---

## 7. Database Fundamentals

### Prisma Schema Patterns

#### Basic Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  posts     Post[]

  @@index([email])
}

enum Role {
  USER
  ADMIN
}
```

#### Relationships

| Type | Prisma Syntax | Use Case |
|------|--------------|----------|
| One-to-Many | `posts Post[]` / `author User @relation` | User has many posts |
| Many-to-Many | Implicit or explicit join table | Tags on posts |
| One-to-One | `profile Profile?` | User has one profile |

#### Soft Deletes Pattern
```prisma
model Post {
  id        String    @id @default(cuid())
  deletedAt DateTime?

  @@index([deletedAt])
}
```
```typescript
// In repository
async findAll() {
  return this.prisma.post.findMany({
    where: { deletedAt: null }
  });
}
```

### Migration Workflow
```bash
# Create migration (development)
npx prisma migrate dev --name add_user_role

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset
```

### Query Optimization

#### Use Select for Partial Data
```typescript
// Bad: fetches all columns
const users = await prisma.user.findMany();

// Good: fetches only needed columns
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true }
});
```

#### Use Indexes
```prisma
model Order {
  id        String   @id
  userId    String
  status    String
  createdAt DateTime

  @@index([userId])           // Queries by user
  @@index([status, createdAt]) // Queries by status + date
}
```

### Database Checklist
- [ ] Primary keys use `cuid()` or `uuid()`
- [ ] `createdAt` and `updatedAt` on all models
- [ ] Indexes on frequently queried columns
- [ ] Soft deletes for recoverable data
- [ ] Relations use referential actions (`onDelete`, `onUpdate`)

**Repo references**: `slides/09-database-design.md`

---

## 8. Auth & Authorization

### Authentication Patterns

#### JWT-Based Authentication
```typescript
// Login flow
async login(email: string, password: string) {
  const user = await this.userRepo.findByEmail(email);
  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new UnauthorizedException();
  }

  const payload = { sub: user.id, role: user.role };
  return {
    accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
    refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
  };
}
```

#### JWT Guard
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

### Authorization Patterns

#### Role-Based Access Control (RBAC)
```typescript
// Roles decorator
@Roles('admin', 'moderator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async delete(@Param('id') id: string) {
  return this.userService.delete(id);
}

// Roles guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

#### Permission-Based Access
```typescript
// More granular than roles
enum Permission {
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',
}

@RequirePermissions(Permission.DELETE_USERS)
@Delete(':id')
async delete(@Param('id') id: string) { ... }
```

### Password Security
```typescript
// Hashing (on registration/password change)
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Verification (on login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Auth Checklist
- [ ] Passwords hashed with bcrypt (cost factor 10+)
- [ ] Access tokens short-lived (15-30 min)
- [ ] Refresh tokens stored securely
- [ ] Failed login attempts rate-limited
- [ ] Sensitive routes protected by guards
- [ ] Token payload minimal (no sensitive data)

**Repo references**: `slides/10-authentication-security.md`

---

## 9. Testing Fundamentals

### Testing Pyramid

```
        /\
       /  \     E2E Tests (few)
      /----\
     /      \   Integration Tests (some)
    /--------\
   /          \ Unit Tests (many)
  --------------
```

### Unit Testing Pattern
```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
    } as any;
    service = new UserService(mockRepo);
  });

  it('should hash password on create', async () => {
    mockRepo.create.mockResolvedValue({ id: '1', email: 'test@test.com' });

    await service.create({ email: 'test@test.com', password: 'plain' });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: expect.not.stringMatching('plain'),
      })
    );
  });
});
```

### Integration Testing Pattern
```typescript
describe('POST /users', () => {
  it('should create user and return 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('test@test.com');
  });
});
```

### What to Test

| Layer | Test Type | What to Verify |
|-------|-----------|----------------|
| Controllers | Integration | HTTP status, response shape |
| Services | Unit | Business logic, edge cases |
| Repositories | Integration | Queries work correctly |
| Guards | Unit | Access control logic |

### Testing Checklist
- [ ] Unit tests for business logic in services
- [ ] Integration tests for API endpoints
- [ ] Mocks for external dependencies
- [ ] Test database separate from development
- [ ] CI runs tests on every PR

**Repo references**: `slides/05-api-production.md`, `slides/14-deployment-devops.md`

---

## 10. Dev Workflow & Quality Gates

### Git Workflow

```
main ← staging ← feature/ABC-123-user-auth
                      ↑
                 Your work here
```

#### Branch Naming
```
feature/TICKET-123-short-description
bugfix/TICKET-456-fix-login
hotfix/critical-security-patch
```

#### Commit Message Format
```
type(scope): description

feat(auth): add refresh token rotation
fix(users): handle duplicate email error
docs(readme): update setup instructions
```

### Pre-Commit Quality Gates

```bash
# package.json scripts
{
  "lint": "eslint src --fix",
  "format": "prettier --write src",
  "typecheck": "tsc --noEmit",
  "test": "jest",
  "pre-commit": "npm run lint && npm run typecheck && npm run test"
}
```

### CI/CD Pipeline Stages

```yaml
# .github/workflows/ci.yml
jobs:
  quality:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

  build:
    needs: quality
    steps:
      - run: docker build -t app .

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - run: ./deploy.sh
```

### Code Review Checklist
- [ ] Tests included for new functionality
- [ ] No console.logs or debugging code
- [ ] Error handling implemented
- [ ] Types properly defined
- [ ] Documentation updated if needed
- [ ] No security vulnerabilities introduced

**Repo references**: `slides/14-deployment-devops.md`, `slides/15-debugging-troubleshooting.md`

---

## 11. Security Essentials

### OWASP Top 10 Quick Reference

| Vulnerability | Prevention |
|--------------|------------|
| **Injection** | Use ORMs, parameterized queries, never concatenate user input |
| **Broken Auth** | Strong passwords, rate limiting, secure session management |
| **XSS** | Escape output, CSP headers, validate input |
| **CSRF** | CSRF tokens, SameSite cookies |
| **Security Misconfig** | Remove defaults, disable debug in prod, update dependencies |

### Input Validation Pattern
```typescript
// Always validate on the server
class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain letters and numbers',
  })
  password: string;
}
```

### Security Headers (Helmet)
```typescript
import helmet from 'helmet';

app.use(helmet());
// Sets: X-Content-Type-Options, X-Frame-Options,
//       X-XSS-Protection, Strict-Transport-Security, etc.
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts',
});

app.use('/auth/login', loginLimiter);
```

### Security Checklist
- [ ] All user input validated and sanitized
- [ ] Passwords hashed, never stored plain
- [ ] HTTPS enforced in production
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting on sensitive endpoints
- [ ] Dependencies regularly updated
- [ ] Secrets in environment variables, never in code
- [ ] SQL injection prevented (use ORM)
- [ ] XSS prevented (escape output)
- [ ] CORS configured properly

**Repo references**: `slides/10-authentication-security.md`, `slides/07-middleware.md`

---

## 12. Deployment & Operations Basics

### Docker Multi-Stage Build
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### Docker Compose (Development)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

### Health Checks
```typescript
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Liveness: Is the process running?
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  // Readiness: Can it handle requests?
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected' };
  }
}
```

### PM2 Process Management
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};
```

### Logging Best Practices
```typescript
// Structured logging with context
logger.info('User created', {
  userId: user.id,
  email: user.email,
  correlationId: req.headers['x-correlation-id'],
});

// Log levels
// error: Application errors requiring immediate attention
// warn: Unexpected but handled conditions
// info: Significant business events
// debug: Detailed debugging information
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health check endpoints working
- [ ] Logging configured for production
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] SSL/TLS certificates configured
- [ ] Secrets managed securely
- [ ] Rollback plan documented

**Repo references**: `slides/06-backend-cloud-setup.md`, `slides/13-logging-monitoring.md`, `slides/14-deployment-devops.md`

---

## 13. Capstone: Standard Full-Stack Starter Blueprint

### Tech Stack Recommendation

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) | SSR, file-based routing, React Server Components |
| Backend | NestJS | Modular, TypeScript-first, enterprise patterns |
| Database | PostgreSQL + Prisma | Reliable, type-safe ORM, excellent migrations |
| Cache | Redis | Session storage, caching, job queues |
| Jobs | BullMQ | Robust job processing, built-in retries |
| Auth | JWT + Refresh Tokens | Stateless, scalable |

### Project Bootstrap Commands
```bash
# Frontend
npx create-next-app@latest frontend --typescript --tailwind --app

# Backend
npx @nestjs/cli new backend
cd backend
npm install @prisma/client bcrypt class-validator class-transformer
npm install -D prisma @types/bcrypt
npx prisma init
```

### Essential Prisma Schema
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  password     String
  role         Role      @default(USER)
  refreshToken String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([email])
}

enum Role {
  USER
  ADMIN
}
```

### Required Module Structure
```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── guards/
│   │   └── dto/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── dto/
│   └── health/
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
├── prisma/
│   └── prisma.service.ts
└── main.ts
```

### Environment Configuration
```env
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/app

# Auth
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379
```

### Starter Implementation Checklist
- [ ] User registration with password hashing
- [ ] Login with JWT + refresh token
- [ ] Protected routes with guards
- [ ] Role-based access control
- [ ] Input validation on all endpoints
- [ ] Error handling with consistent responses
- [ ] Health check endpoints
- [ ] Structured logging
- [ ] Docker Compose for local development
- [ ] Basic CI/CD pipeline

**Repo references**: `slides/16-capstone-project.md`, `slides/04-backend-fundamentals.md`

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| **API** | Application Programming Interface - contract for software communication |
| **Auth** | Authentication (who you are) + Authorization (what you can do) |
| **CORS** | Cross-Origin Resource Sharing - browser security for cross-domain requests |
| **CRUD** | Create, Read, Update, Delete - basic data operations |
| **DTO** | Data Transfer Object - shapes data between layers |
| **Guard** | NestJS middleware that controls route access |
| **Interceptor** | NestJS middleware that transforms request/response |
| **JWT** | JSON Web Token - compact, self-contained auth token |
| **Middleware** | Code that runs between request and response |
| **ORM** | Object-Relational Mapping - database abstraction layer |
| **Pipe** | NestJS middleware for validation/transformation |
| **RBAC** | Role-Based Access Control |
| **REST** | Representational State Transfer - API design pattern |
| **SSR** | Server-Side Rendering |
| **Webhook** | HTTP callback for event notifications |

---

## 15. Appendix: Repo Content Map

### Slides Directory
| File | Topic | Key Content |
|------|-------|-------------|
| `slides/01-introduction.md` | Overview | Mental model, training structure |
| `slides/02-web-basics-crashcourse.md` | Web Fundamentals | HTTP, request-response |
| `slides/03-frontend-fundamentals.md` | Frontend | React, Next.js, components |
| `slides/04-backend-fundamentals.md` | Backend | NestJS, layered architecture |
| `slides/05-api-production.md` | API Design | REST, validation, errors |
| `slides/06-backend-cloud-setup.md` | Cloud | AWS, Docker, CI/CD |
| `slides/07-middleware.md` | Middleware | Guards, interceptors, pipes |
| `slides/08-system-architecture.md` | Architecture | Patterns, scaling, caching |
| `slides/09-database-design.md` | Database | Prisma, migrations, indexing |
| `slides/10-authentication-security.md` | Security | JWT, bcrypt, OWASP |
| `slides/11-background-jobs.md` | Jobs | BullMQ, queues, workers |
| `slides/12-ai-integration.md` | AI | LLM clients, streaming |
| `slides/13-logging-monitoring.md` | Observability | Winston, Pino, metrics |
| `slides/14-deployment-devops.md` | DevOps | Docker, PM2, GitHub Actions |
| `slides/15-debugging-troubleshooting.md` | Debugging | Error analysis, common issues |
| `slides/16-capstone-project.md` | Capstone | E-commerce project spec |

### Examples Directory
| Path | Contains |
|------|----------|
| `examples/` | Code samples referenced in slides |

### Exercises Directory
| Path | Contains |
|------|----------|
| `exercises/` | Hands-on practice materials |

### Real Project References (from curriculum)
| Project | Stack | Key Patterns |
|---------|-------|-------------|
| ktph-vestibular-api | Express.js + BullMQ | Medical VR, background jobs |
| navy-api | NestJS + AI | AI integration, streaming |
| mages-landing-page | Next.js | Marketing, SSR |
| navy-dashboard | Next.js | Admin UI, AI streaming |

---

*Last updated: December 2024*
*Generated from: FS Training Bootcamp curriculum*
