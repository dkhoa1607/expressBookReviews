const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customerRoutes = require('./router/auth_users.js').authenticated;
const generalRoutes = require('./router/general.js').general;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'access';

app.use(express.json());
app.use(
  '/customer',
  session({
    secret: 'fingerprint_customer',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  }),
);

app.use('/customer/auth', (req, res, next) => {
  const authorizationHeader = req.headers.authorization || '';
  const bearerToken = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null;
  const sessionToken = req.session.authorization?.accessToken;
  const token = bearerToken || sessionToken;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  return jwt.verify(token, JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({ message: 'Invalid or expired access token.' });
    }

    req.user = decoded;
    return next();
  });
});

app.use('/customer', customerRoutes);
app.use('/', generalRoutes);

app.listen(PORT, () => console.log(`Book review server is running on port ${PORT}`));
