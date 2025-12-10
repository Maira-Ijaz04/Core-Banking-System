const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./config/database');
const path = require('path');

// Import Routes
const customerRoutes = require('./routes/customerRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const loanRoutes = require('./routes/loanRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== Serve Frontend =====
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== Frontend Page Routes (BEFORE API routes) =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/customers', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/customers.html'));
});

app.get('/accounts', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/accounts.html'));
});

app.get('/transactions', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/transactions.html'));
});

app.get('/loans', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/loans.html'));
});

// ===== API Routes =====
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/loans', loanRoutes);

// ===== Health Check =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Core Banking API is running' });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// ===== Initialize Database and Start Server =====
async function startup() {
  try {
    await database.initialize();
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

// ===== Graceful Shutdown =====
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await database.close();
  process.exit(0);
});

startup();