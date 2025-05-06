```
my-file-manager/
├── components/           # Frontend React components
├── public/               # Static assets
├── pages/                # Next.js pages
│   └── api/              # API routes (Next.js API)
│       └── v1/           # API version 1
│           ├── files/    # File management endpoints
│           └── users/    # User management endpoints
├── lib/                  # Shared utilities
├── server/               # Backend server code
│   ├── config/           # Server configuration
│   ├── controllers/      # Request handlers
│   ├── db/               # Database models and connections
│   ├── middleware/       # Express middleware
│   ├── routes/           # Express routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── storage/              # Local file storage (for development)
├── types/                # TypeScript type definitions
├── .env                  # Environment variables
├── .env.example          # Example environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```