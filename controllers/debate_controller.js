import debateModel from '../models/debate.js';

async function createDebate(req, res) {
    if (!req.body.title || !req.body.description) {
        return res.status(400).json({ message: "Title and description are required" });
    }

    try {
        const { title, description } = req.body;
        const creatorId = req.user.userId;

        const debate = new debateModel({
            title,
            description,
            creator: creatorId
        });

        await debate.save();
        return res.status(201).json({ message: "Debate created successfully", debate });

    } catch (err) {
        console.log("Error while creating debate:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getAllDebates(req, res) {
    try {
        const debates = await debateModel.find()
            .populate('creator', 'username')
            .sort({ createdAt: -1 });

        return res.status(200).json({ debates });
    } catch (err) {
        console.log("Error while fetching debates:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getSingleDebate(req, res) {
    try {
        const debateId = req.params.id;
        const debate = await debateModel.findById(debateId).populate('creator', 'username');
        
        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        return res.status(200).json({ debate });
    } catch (err) {
        console.log("Error while fetching single debate:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export { createDebate, getAllDebates, getSingleDebate };