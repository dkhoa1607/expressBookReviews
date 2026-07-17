const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');

const publicUsers = express.Router();

publicUsers.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: 'Username already exists.' });
  }

  users.push({ username, password });
  return res.status(201).json({ message: 'User registered successfully.' });
});

// Promise-based helpers keep concurrent reads non-blocking.
const readAllBooks = async () => Promise.resolve(books);
const readBookByISBN = async (isbn) => Promise.resolve(books[isbn]);
const readBooksByField = async (field, value) => {
  const normalizedValue = value.toLowerCase();
  return Promise.resolve(
    Object.fromEntries(
      Object.entries(books).filter(([, book]) =>
        book[field].toLowerCase().includes(normalizedValue),
      ),
    ),
  );
};

publicUsers.get('/', async (req, res) => {
  const allBooks = await readAllBooks();
  return res.status(200).json(allBooks);
});

publicUsers.get('/isbn/:isbn', async (req, res) => {
  const book = await readBookByISBN(req.params.isbn);
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  return res.status(200).json(book);
});

publicUsers.get('/author/:author', async (req, res) => {
  const matches = await readBooksByField('author', req.params.author);
  if (Object.keys(matches).length === 0) {
    return res.status(404).json({ message: 'No books found for this author.' });
  }
  return res.status(200).json(matches);
});

publicUsers.get('/title/:title', async (req, res) => {
  const matches = await readBooksByField('title', req.params.title);
  if (Object.keys(matches).length === 0) {
    return res.status(404).json({ message: 'No books found with this title.' });
  }
  return res.status(200).json(matches);
});

publicUsers.get('/review/:isbn', async (req, res) => {
  const book = await readBookByISBN(req.params.isbn);
  if (!book) return res.status(404).json({ message: 'Book not found.' });
  return res.status(200).json(book.reviews);
});

// Axios client functions required by the assignment's Promise/async tasks.
const API_BASE_URL = process.env.BOOK_API_URL || 'http://localhost:5000';

const getAllBooksWithAxios = async () => {
  const response = await axios.get(`${API_BASE_URL}/`);
  return response.data;
};

const getBookByISBNWithAxios = (isbn) =>
  new Promise((resolve, reject) => {
    axios
      .get(`${API_BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
      .then((response) => resolve(response.data))
      .catch(reject);
  });

const getBooksByAuthorWithAxios = async (author) => {
  const response = await axios.get(
    `${API_BASE_URL}/author/${encodeURIComponent(author)}`,
  );
  return response.data;
};

const getBooksByTitleWithAxios = async (title) => {
  const response = await axios.get(
    `${API_BASE_URL}/title/${encodeURIComponent(title)}`,
  );
  return response.data;
};

module.exports = {
  general: publicUsers,
  getAllBooksWithAxios,
  getBookByISBNWithAxios,
  getBooksByAuthorWithAxios,
  getBooksByTitleWithAxios,
};
