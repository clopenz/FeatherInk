const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
	title: { type: String, required: true },
	subtitle: String,
	content: String,
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Add a text index for full-text search
noteSchema.index({ title: 'text', content: 'text', subtitle: 'text' });

module.exports = mongoose.model('Note', noteSchema);
