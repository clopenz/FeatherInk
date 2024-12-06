require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log('Connected to MongoDB'))
	.catch((err) => console.log('MongoDB connection error:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));

app.get('/', (req, res) => {
	res.send('Server is running');
});

mongoose.connection.once('open', () => {
	console.log('Connected to MongoDB:', mongoose.connection.name);
});

// Login route
app.post('/login', async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });

	if (!user) {
		return res.status(400).json({ message: 'User not found' });
	}

	// Compare password with the stored hashed password
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		return res.status(400).json({ message: 'Invalid credentials' });
	}

	// Create JWT token
	const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
		expiresIn: '1h',
	});

	return res.status(200).json({ token, message: 'Login successful' });
});

app.get('/login', async (req, res) => {
	res.sendFile(__dirname + '/public/login.html');
});

// Create Account route
app.post('/login', async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });

	if (!user) {
		return res.status(400).json({ message: 'User not found' });
	}

	// Compare password with the stored hashed password
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		return res.status(400).json({ message: 'Invalid credentials' });
	}

	// Create JWT token
	const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
		expiresIn: '1h',
	});

	return res.status(200).json({ token, message: 'Login successful' });
});

app.get('/create-account', async (req, res) => {
	res.sendFile(__dirname + '/public/create-account.html');
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
