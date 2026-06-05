import argumentModel from '../models/argument.js';

async function addArgument(req, res) {
    try {
        const { content, side, debateId } = req.body;
        
        if (!content || !side || !debateId) {
            return res.status(400).json({ message: "Content, side, and debateId are required" });
        }

        if (!['FOR', 'AGAINST'].includes(side)) {
            return res.status(400).json({ message: "Side must be either 'FOR' or 'AGAINST'" });
        }

        const argument = new argumentModel({
            content,
            side,
            debate: debateId,
            author: req.user.userId
        });

        await argument.save();
        
        // Populate author so frontend gets the username immediately
        await argument.populate('author', 'username');

        return res.status(201).json({ message: "Argument added successfully", argument });
    } catch (err) {
        console.log("Error while adding argument:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getArgumentsByDebate(req, res) {
    try {
        const debateId = req.params.debateId;
        
        // Fetch all arguments for this debate, sort chronologically
        const argumentsList = await argumentModel.find({ debate: debateId })
            .populate('author', 'username')
            .sort({ createdAt: 1 }); 

        return res.status(200).json({ arguments: argumentsList });
    } catch (err) {
        console.log("Error while fetching arguments:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export { addArgument, getArgumentsByDebate };