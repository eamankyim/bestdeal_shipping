# ShipEASE Backend API

Express.js backend API for the ShipEASE Delivery Management System.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your database credentials

# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# (Optional) Seed database
npm run prisma:seed

# Start development server
npm run dev
```

Server runs on: `http://localhost:5000`

## 📚 API Documentation

Once running, visit: `http://localhost:5000/api-docs`

## 🔧 Environment Variables

See `.env.example` for all required variables.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS

## 📦 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (generates Prisma Client)
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed database with initial data

## 🗄️ Database

Using **Prisma ORM** with **PostgreSQL**.

Schema location: `prisma/schema.prisma`

### Database Commands

```bash
# View database in browser
npm run prisma:studio

# Reset database (⚠️ deletes all data)
npm run db:reset

# Create migration
npx prisma migrate dev --name migration-name
```

## 🌐 Deployment

### Vercel Deployment

```bash
# Deploy to production
vercel --prod
```

See `VERCEL_DEPLOYMENT_GUIDE.md` for complete instructions.

### Environment Variables on Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=your-frontend-url
NODE_ENV=production
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app configuration
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Helper functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.js             # Database seeding
├── server.js               # Entry point
├── package.json
└── vercel.json             # Vercel configuration
```

## 🔐 Authentication

Uses **JWT** (JSON Web Tokens) for authentication.

**Flow:**
1. User logs in with email/password
2. Server returns access token + refresh token
3. Client includes token in Authorization header
4. Server validates token on protected routes

## 🛣️ API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### Jobs
- `GET /api/v1/jobs` - List jobs
- `POST /api/v1/jobs` - Create job
- `GET /api/v1/jobs/:id` - Get job
- `PUT /api/v1/jobs/:id` - Update job
- `PATCH /api/v1/jobs/:id/status` - Update job status
- `DELETE /api/v1/jobs/:id` - Delete job

### Tracking
- `GET /api/v1/tracking/:trackingId` - Public tracking (no auth)

See `/api-docs` for complete API documentation.

## 🔒 Security Features

- ✅ Helmet.js for security headers
- ✅ CORS protection
- ✅ Rate limiting
- ✅ Input validation
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ SQL injection protection (Prisma)

## 🧪 Testing

```bash
npm test
```

## 📊 Database Schema

See `prisma/schema.prisma` or `DATABASE_SCHEMA.md` for complete schema documentation.

**Main Models:**
- User
- Customer
- Job
- Batch
- Invoice
- Notification
- AuditLog

## 🐛 Troubleshooting

**Database Connection Error**
- Check DATABASE_URL is correct
- Verify database is running
- Check network/firewall settings

**Prisma Client Error**
- Run `npm run prisma:generate`
- Restart development server

**JWT Error**
- Check JWT_SECRET is set
- Verify token is not expired

## 📝 Notes

- Built with Express.js
- Uses Prisma ORM
- PostgreSQL database
- RESTful API design
- JWT authentication
- Swagger documentation

## 📞 Support

For issues and questions, see project documentation or contact the development team.
