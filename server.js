require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
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

// Middleware to verify JWT
function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	if (!authHeader) {
		return res
			.status(401)
			.json({ message: 'Unauthorized: Missing Authorization header' });
	}

	const token = req.headers['authorization'];
	if (!token) return res.status(401).json({ message: 'Unauthorized' });

	try {
		const decodedToken = jwt.verify(
			token.split(' ')[1],
			process.env.JWT_SECRET
		);
		req.user = decodedToken;

		next();
	} catch (error) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
}

function authenticateRefreshToken(req, res, next) {
	const refreshToken = req.body.token;
	if (!refreshToken) return res.status(401).json({ message: 'Unauthorized' });

	try {
		const decodedToken = jwt.verify(
			refreshToken,
			process.env.JWT_REFRESH_SECRET
		);
		req.user = decodedToken;
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
}

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

			const notes = await Note.find({ userId });

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
app.post(
	'/save-note',
	authenticateToken,

	async (req, res) => {
		try {
			console.log('save note');
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
				createdAt: new Date(),
				updatedAt: new Date(),
				userId: req.user.id,
			});

			// Save the note
			await note.save();

			res.status(200).json({ message: 'Note created successfully' });
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
		} catch (error) {}
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
			expiresIn: '1h',
		}
	);

	// Create JWT token
	const refreshToken = jwt.sign(
		{ id: user._id, username: user.username, email: user.email },
		process.env.JWT_REFRESH_SECRET,
		{
			expiresIn: '30d',
		}
	);

	return res.status(200).json({ token, refreshToken });
});

app.get('/login', async (req, res) => {
	res.sendFile(__dirname + '/public/login.html');
});

// Create Account route
app.post('/create-account', async (req, res) => {
	const { username, email, password, password2 } = req.body;

	if (password !== password2) {
		return res.status(400).json({ message: 'Passwords do not match' });
	}

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return res.status(400).json({ message: 'User already exists' });
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const user = new User({ username, email, password: hashedPassword });

	try {
		await user.save();
		res.redirect('/login?message=Registration Successful');
	} catch (error) {
		return res.status(500).json({ message: 'Error creating user', error });
	}
});

app.get('/create-account', async (req, res) => {
	return res.sendFile(__dirname + '/public/create-account.html');
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
