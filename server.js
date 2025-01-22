require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { BSON } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const cors = require('cors');
const path = require('path');

const User = require('./models/User');
const Note = require('./models/Note');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
	.connect(process.env.MONGODB_URI, {
		autoIndex: true,
	})
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

// Middleware to verify JWT
async function authenticateToken(req, res, next) {
	// Extract the Authorization header
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res
			.status(401)
			.json({ message: 'Unauthorized: Missing Authorization header' });
	}

	// Extract the token from 'Bearer <token>'
	const token = authHeader.split(' ')[1];
	if (!token) {
		return res.status(401).json({ message: 'Unauthorized: Malformed token' });
	}

	try {
		let decodedToken = jwt.verify(token, process.env.JWT_SECRET);

		req.user = decodedToken;
	} catch (error) {
		try {
			const decodedToken = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

			req.user = decodedToken;
		} catch (refreshError) {
			return res.status(401).json({ message: 'Unauthorized: Invalid token' });
		}
	}

	next();
}

// Search Notes Endpoint
app.get('/api/search-notes', authenticateToken, async (req, res) => {
	const query = req.query.query; // Get the 'query' parameter from the request

	if (!query) {
		return res.status(400).json({ message: 'Query parameter is required' });
	}

	try {
		// Search notes using the text index
		const results = await Note.find(
			{ $text: { $search: query }, userId: req.user.id },
			{ score: { $meta: 'textScore' } }
		).sort({ score: { $meta: 'textScore' } });

		res.status(200).json(results);
	} catch (error) {
		console.error('Error searching notes:', error);
		res.status(500).json({ message: 'Error searching notes', error });
	}
});

// Fetch user data from MongoDB
app.get(
	'/user-data',
	authenticateToken,

	async (req, res) => {
		try {
			const userId = req.user.id; // Extract user ID from decoded JWT payload
			const user = await User.findById(userId);

			if (!user) {
				return res.status(404).json({ message: 'User not found' });
			}

			res.status(200).json({
				username: user.username,
				email: user.email,
				otherData: user.otherField, // Send data as needed
			});
		} catch (error) {
			res.status(500).json({ message: 'Server error', error });
		}
	}
);

// Get User's Notes
app.get(
	'/user-notes',
	authenticateToken,

	async (req, res) => {
		try {
			const userId = req.user.id; // Extract user ID from decoded JWT payload

			const notes = await Note.find({ userId }).sort({ updatedAt: -1 });

			if (!notes || notes.length === 0) {
				return res
					.status(404)
					.json({ message: 'No notes found for this user' });
			}

			return res.status(200).json(notes);
		} catch (error) {
			console.error('Error fetching notes:', error);
			res.status(500).json({ message: 'Server error', error });
		}
	}
);

// Save Note
app.put(
	'/save-note',
	authenticateToken,

	async (req, res) => {
		try {
			const result = await Note.findByIdAndUpdate(req.body.noteId, {
				title: req.body.title,
				subtitle: req.body.subtitle,
				content: req.body.content,
				updatedAt: new Date().toISOString(),
			});
			res.status(200).json({ message: 'Note saved successfully' });
		} catch (error) {
			console.error('Error creating note:', error);
			res.status(500).json({ message: 'Server error', error });
		}
	}
);

// Create Note
app.post(
	'/create-note',
	authenticateToken,

	async (req, res) => {
		try {
			const { title, subtitle, content } = req.body;

			const note = new Note({
				title,
				subtitle,
				content,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				userId: req.user.id,
			});

			// Save the note
			await note.save();

			res.status(200).json({ message: 'Note created successfully', note });
		} catch (error) {
			console.error('Error creating note:', error);
			res.status(500).json({ message: 'Server error', error });
		}
	}
);

// Delete Note
app.delete(
	'/delete-note',
	authenticateToken,

	async (req, res) => {
		try {
			const noteId = req.body.noteId;
			const result = await Note.findByIdAndDelete(noteId);

			res.status(200).json({ message: 'Note deleted successfully' });
		} catch (error) {
			console.error('Error deleting note:', error);
			res.status(500).json({ message: 'Error deleting note', error });
		}
	}
);

// Login route
app.post('/login', async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email });

	if (!user) {
		console.log('User not found', email);
		return res.status(400).json({ message: 'User not found' });
	}

	// Compare password with the stored hashed password
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		return res.status(400).json({ message: 'Invalid credentials' });
	}

	// Create JWT token
	const token = jwt.sign(
		{ id: user._id, username: user.username, email: user.email },
		process.env.JWT_SECRET,
		{
			expiresIn: '15m',
		}
	);

	// Create JWT token
	const refreshToken = jwt.sign(
		{ id: user._id, username: user.username, email: user.email },
		process.env.JWT_REFRESH_SECRET,
		{
			expiresIn: '7d',
		}
	);

	tokenStored = true;
	refreshTokenStored = true;

	return res.status(200).json({ token, refreshToken });
});

app.get('/login', async (req, res) => {
	res.sendFile(__dirname + '/public/login.html');
});

// Create Account
app.post('/create-account', async (req, res) => {
	const { username, email, password, password2 } = req.body;

	if (password !== password2) {
		return res.status(400).json({ message: 'Passwords do not match' });
	}

	const existingEmail = await User.findOne({ email });
	const existingUsername = await User.findOne({ username });

	if (existingEmail) {
		return res.status(400).json({ message: 'Email already exists' });
	}

	if (existingUsername) {
		return res.status(400).json({ message: 'Username already exists' });
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = new User({ username, email, password: hashedPassword });

	try {
		await user.save();
		res.status(201).json({ message: 'Registration successful' });
	} catch (error) {
		console.error('Error creating user:', error);
		res.status(500).json({ message: 'Error creating user', error });
	}
});

app.get('/create-account', async (req, res) => {
	return res.sendFile(__dirname + '/public/create-account.html');
});

// Download Notes
app.get('/download-notes', authenticateToken, async (req, res) => {
	try {
		const userId = req.user.id;
		const userName = req.user.username;
		const user = await User.findById(userId);

		if (!user) return res.status(404).json({ message: 'User not found' });

		const notes = await Note.find({ userId });

		if (!notes || !notes.length) {
			return res.status(404).json({ message: 'No notes found for this user' });
		}

		//Convert notes into JSON format for download
		const fileContent = JSON.stringify(
			notes.map((note) => ({
				title: note.title,
				subtitle: note.subtitle,
				content: note.content,
				createdAt: note.createdAt,
				updatedAt: note.updatedAt,
			}))
		);

		// Set hearders for file download
		const fileName = `notes-${user.name || userId}.json`;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
		res.send(fileContent);
	} catch (error) {
		console.error('Error downloading notes:', error);
		res.status(500).json({ message: 'Error downloading notes', error });
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
