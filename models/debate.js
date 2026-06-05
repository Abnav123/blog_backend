import mongoose from 'mongoose';

const debateSchema = new mongoose.Schema({
     title: {type: String, required: true},
     description: {type: String, required: true},
     creator: {type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
     }
}, {timestamps: true})

export default mongoose.model('Debate', debateSchema);