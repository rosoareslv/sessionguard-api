## ProductCatalog API
[![CI](https://github.com/rosoareslv/productCatalog/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/rosoareslv/productCatalog/actions/workflows/ci.yml)

Products and Categories stored per user with JWT implementation.

#### Stack

- Nodejs - Runtime
  - ExpressJS - Api framework
  - Mongoose - MongoDB schemas and functions
  - Vitest - Tests
- :whale: Docker - Setup environments
- :four_leaf_clover: MongoDB - Database
- :red_circle: Redis - Refresh token whitelist implementation

#### Security

- JWT authentication
- AccessToken + RefreshToken
- Whitelist control of refreshTokens

#### JWT implementation flow comparison

<div align="center">
<img src="./docs/jwtFlowWithoutRefreshToken.svg" width="600" alt="JWT without refresh token">
</div>

<div align="center">
<img src="./docs/jwtFlowWithRefreshToken.svg" width="600" alt="JWT with refresh token">
</div>

#### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Authenticate and return an access token (refresh token is set as an HTTP cookie) |
| GET | `/auth/logout` | Access token | Logout application (It kills refreshToken to avoid updating the accessToken) |
| GET | `/auth/refresh` | Refresh token (cookie) | Issue a new access token |
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


- Access token must be sent in the `Authorization` header. 
- Products and categories are scoped to their owner. 
- A user can only see and change their own records.

#### Setup
1. Create .env file using the '/configs/.env.example' file using your credentials
2. Generate JWT Keys pair running the command below which is located inside '/api' folder:
```bash
npm run keys:generate
```
3. Deploy or Test the application using the commands below for each scenario.

#### Development Deploy

```bash
docker compose -f docker-compose.yaml up api
```

#### Test Execution

```bash
docker compose -f docker-compose.yaml up test
```

#### To implement:

- Fake data generator for performance workload tests

#### Key improvements:

- Validations Can Be More Rigorous (may add email field and validation)
- Input sanitization (express-validator)
- Rate limiting
- Performance metrics
- Structured logs
- Set resources usage (CPU, RAM...) in compose files
- Two factor authentication
