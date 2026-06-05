import mongoose from 'mongoose';

const argumentSchema = new mongoose.Schema({
  content: {type: String, required: true },
  side: {type: String, enum: ['FOR', 'AGAINST'], required: true },
  debate: {type: mongoose.Schema.Types.ObjectId, ref: 'Debate', required: true},
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Argument', argumentSchema);