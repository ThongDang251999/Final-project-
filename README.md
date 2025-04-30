# Personal Budget Tracker

A full-stack web application for tracking personal finances, built with React, Node.js, Express, and MongoDB.

## Features

- User authentication (register/login)
- Add and track income/expenses
- Categorize transactions
- View spending breakdown by category
- Transaction history with filtering
- Real-time balance updates
- Responsive design

## Tech Stack

### Frontend
- React
- Material-UI
- Recharts for data visualization
- React Router for navigation
- Axios for API calls

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd budget-tracker
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017/budget-tracker
JWT_SECRET=your-secret-key
PORT=5000
```

4. Start MongoDB:
Make sure MongoDB is running on your system.

5. Start the backend server:
```bash
cd backend
npm start
```

6. Start the frontend development server:
```bash
cd frontend
npm run dev
```

7. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Transactions
- GET `/api/transactions` - Get all transactions for logged-in user
- POST `/api/transactions` - Add new transaction
- GET `/api/transactions/summary` - Get spending summary
- DELETE `/api/transactions/:id` - Delete a transaction

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
