const mongoose = require('mongoose');

const CommunicationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'call', 'meeting'],
    required: true,
  },
  subject: {
    type: String,
  },
  content: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'pending'],
    default: 'pending',
  },
  sentBy: {
    type: String,
    required: true,
  },
  // Email specific fields
  emailTo: {
    type: String,
  },
  emailSubject: {
    type: String,
  },
  // SMS specific fields
  smsTo: {
    type: String,
  },
  // Response tracking
  response: {
    type: String,
  },
  errorMessage: {
    type: String,
  },
});

module.exports = mongoose.models.Communication || mongoose.model('Communication', CommunicationSchema);