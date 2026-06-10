import mongoose from 'mongoose';

const debateSchema = new mongoose.Schema({
     title: {type: String, required: true},
     description: {type: String, required: true},
     category: {type: String, trim: true, default: 'General'},
     tags: [{type: String, trim: true}],
     status: {
        type: String,
        enum: ['OPEN', 'CLOSED'],
        default: 'OPEN'
     },
     likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
     }],
     views: {type: Number, default: 0},
     creator: {type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
     }
}, {timestamps: true})

export default mongoose.model('Debate', debateSchema);
