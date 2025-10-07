const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    relatedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    relatedProcess: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Process'
    },
    activityType: {
        type: String,
        enum: ['nudge', 'task_created', 'task_completed', 'task_approved', 'task_rejected', 'task_updated', 'user_created', 'user_updated', 'login', 'logout', 'other'],
        default: 'other'
    },
    details: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index'ler
ActivitySchema.index({ user: 1, createdAt: -1 });
ActivitySchema.index({ relatedUser: 1, createdAt: -1 });
ActivitySchema.index({ activityType: 1, createdAt: -1 });
ActivitySchema.index({ action: 'text', message: 'text' });

module.exports = mongoose.model('Activity', ActivitySchema); 