## SessionGuard API
[![CI](https://github.com/rosoareslv/productCatalog/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/rosoareslv/productCatalog/actions/workflows/ci.yml)
<!-- TODO: add coverage badge (e.g. Codecov) -->

**REST API with production-grade JWT authentication** 
- RS256-signed tokens
- Refresh token rotation with reuse detection, 
- Multiple concurrent sessions per user and per-device logout. 
- Products and categories are the domain used to demonstrate per-user data isolation.

#### Stack

- Nodejs - Runtime
  - ExpressJS - Api framework
  - Mongoose - MongoDB schemas and functions
  - Vitest - Tests
- :whale: Docker - Setup environments
- :globe_with_meridians: Nginx - Reverse proxy
- :four_leaf_clover: MongoDB - Database
- :red_circle: Redis - Session store (refresh token whitelist per session)

#### Security

- JWT signed with **RS256** (private key signs, public key verifies) and algorithm pinned on verification (prevents `alg` confusion attacks)
- **AccessToken** (10 min, `Authorization` header) + **RefreshToken** (1 day, `httpOnly` cookie)
- Token `type` claim: a refresh token can't be used as an access token (and vice versa)
- **Multiple sessions per user:** each login creates a session id (`sid`); Redis key `username:sid`
- **Refresh token rotation:** every refresh issues a new token (unique `jti`) and invalidates the previous one
- **Reuse detection:** presenting an already-rotated refresh token revokes that session
- **Per-device logout:** removes only the current session; other devices stay logged in
- Sessions expire automatically in Redis (TTL aligned with the refresh token lifetime)
- Passwords stored as hashes
- Products and categories scoped to their owner

#### JWT implementation flow comparison

<div align="center">
<img src="./docs/jwtFlowWithoutRefreshToken.svg" width="900" alt="JWT without refresh token">
</div>

<div align="center">
<img src="./docs/jwtFlowWithRefreshToken.svg" width="900" alt="JWT with refresh token">
</div>

#### Design decisions

| Decision | Why | Trade-off accepted |
|----------|-----|--------------------|
| **Stateless access token** (not checked against Redis) | No extra lookup per request; keeps the JWT benefit of self-contained verification | After logout, the access token remains valid until it expires (max 10 min) |
| **Refresh token in `httpOnly` cookie** | Not readable by JavaScript (XSS) | Requires cookie handling on the client |
| **Session id (`sid`) + token id (`jti`)** | `sid` identifies the session (stable across refreshes), `jti` makes every token unique so rotation always produces a new token | — |
| **Redis key `username:sid`** | Multiple concurrent sessions; logout affects only one device | "Logout from all devices" requires a key scan (not implemented yet) |
| **Reuse detection revokes the session** | A rotated token being presented means two copies exist; the server can't tell which one is legitimate, so it revokes both | Concurrent refreshes (e.g. two tabs) may log the user out |
| **TTL renewed on each refresh** | Abandoned sessions are cleaned up automatically; active users stay logged in (sliding session) | No absolute session lifetime |
| **JWT instead of opaque sessions** | Public key allows other services to verify tokens without access to Redis | More moving parts than a plain session id |

#### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Create a new session and return an access token (refresh token is set as an `httpOnly` cookie) |
| POST | `/auth/logout` | Refresh token (cookie) | Revoke the current session only (other devices stay logged in) |
| POST | `/auth/refresh` | Refresh token (cookie) | Rotate the refresh token and issue a new access token |
| GET | `/product` | Access token | List all products of the authenticated user |
| GET | `/product/:id` | Access token | Get a product by ID |
| POST | `/product` | Access token | Create a product (category must exist) |
| PATCH | `/product/:id` | Access token | Update a product |
| DELETE | `/product/:id` | Access token | Delete a product |
| GET | `/category` | Access token | List all categories of the authenticated user |
| GET | `/category/:id` | Access token | Get a category by ID |
| POST | `/category` | Access token | Create a category |
| PATCH | `/category/:id` | Access token | Update a category |
| DELETE | `/category/:id` | Access token | Delete a category |
| GET | `/docs` | — | Swagger UI (OpenAPI documentation) |

- Access token must be sent in the `Authorization` header (`Bearer <token>`).
- Products and categories are scoped to their owner.
- A user can only see and change their own records.

#### Setup
1. Create .env file using the '/configs/.env.example' file using your credentials
2. Generate JWT Keys pair running the command below which is located inside '/api' folder:
```bash
npm run keys:generate
```
3. Deploy the development environment or Test the application using the commands below for each scenario.
  
#### Development Deploy

```bash
docker compose -f docker-compose.yaml up --attach api reverse_proxy
```

#### Test Execution

```bash
docker compose -f docker-compose.yaml up test
```
#### TODO

- Fake data generator for performance workload tests
- Cookie hardening: `sameSite: "strict"` and `path: "/auth"`
- Logout from all devices endpoint
- Grace period for concurrent refreshes (avoid false-positive reuse detection)
- Rate limiting (especially on `/auth/login`)
- Set resources usage (CPU, RAM...) in compose files
- Performance metrics
- Structured logs
- Improve documentation
- Architecture diagram with application flow