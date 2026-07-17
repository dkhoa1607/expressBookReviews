const express = require('express');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');

const registeredUsers = express.Router();
const users = [];
const JWT_SECRET = 'access';

const isValid = (username) =>
  !users.some((user) => user.username === username);

const authenticatedUser = (username, password) =>
  users.some(
    (user) => user.username === username && user.password === password,
  );

registeredUsers.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({
    message: 'User logged in successfully.',
    accessToken,
  });
});

registeredUsers.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const review = req.body.review || req.query.review;
  const username = req.user.username;

  if (!books[isbn]) return res.status(404).json({ message: 'Book not found.' });
  if (!review) return res.status(400).json({ message: 'Review text is required.' });

  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: 'Review added or updated successfully.',
    reviews: books[isbn].reviews,
  });
});

registeredUsers.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const username = req.user.username;

  if (!books[isbn]) return res.status(404).json({ message: 'Book not found.' });
  if (!Object.prototype.hasOwnProperty.call(books[isbn].reviews, username)) {
    return res.status(404).json({ message: 'No review found for this user.' });
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: 'Review deleted successfully.',
    reviews: books[isbn].reviews,
  });
});

module.exports = {
  authenticated: registeredUsers,
  authenticatedUser,
  isValid,
  users,
};
