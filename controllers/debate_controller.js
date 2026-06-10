import debateModel from '../models/debate.js';
import argumentModel from '../models/argument.js';
import userModel from '../models/user.js';

function isSameId(firstId, secondId) {
    return firstId?.toString() === secondId?.toString();
}

function normalizeTags(tags) {
    if (!tags) {
        return [];
    }

    if (Array.isArray(tags)) {
        return tags.map(tag => tag.trim()).filter(Boolean);
    }

    return String(tags)
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createDebate(req, res) {
    if (!req.body.title || !req.body.description) {
        return res.status(400).json({ message: "Title and description are required" });
    }

    try {
        const { title, description, category } = req.body;
        const creatorId = req.user.userId;

        const debate = new debateModel({
            title,
            description,
            category,
            tags: normalizeTags(req.body.tags),
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
        const { search, category, tag, status } = req.query;
        const filter = {};

        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        if (category) {
            filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
        }

        if (tag) {
            filter.tags = { $regex: `^${escapeRegex(tag)}$`, $options: 'i' };
        }

        if (status) {
            const normalizedStatus = status.toUpperCase();

            if (!['OPEN', 'CLOSED'].includes(normalizedStatus)) {
                return res.status(400).json({ message: "Status must be either 'OPEN' or 'CLOSED'" });
            }

            filter.status = normalizedStatus;
        }

        const debates = await debateModel.find(filter)
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
        const debate = await debateModel.findByIdAndUpdate(
            debateId,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('creator', 'username');
        
        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        return res.status(200).json({ debate });
    } catch (err) {
        console.log("Error while fetching single debate:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function updateDebate(req, res) {
    try {
        const debate = await debateModel.findById(req.params.id);

        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        if (!isSameId(debate.creator, req.user.userId)) {
            return res.status(403).json({ message: "Only the debate creator can update this debate" });
        }

        const updates = {};
        const allowedFields = ['title', 'description', 'category'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (req.body.tags !== undefined) {
            updates.tags = normalizeTags(req.body.tags);
        }

        const updatedDebate = await debateModel.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate('creator', 'username');

        return res.status(200).json({ message: "Debate updated successfully", debate: updatedDebate });
    } catch (err) {
        console.log("Error while updating debate:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function deleteDebate(req, res) {
    try {
        const debate = await debateModel.findById(req.params.id);

        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        if (!isSameId(debate.creator, req.user.userId)) {
            return res.status(403).json({ message: "Only the debate creator can delete this debate" });
        }

        await argumentModel.deleteMany({ debate: debate._id });
        await userModel.updateMany(
            { bookmarkedDebates: debate._id },
            { $pull: { bookmarkedDebates: debate._id } }
        );
        await debate.deleteOne();

        return res.status(200).json({ message: "Debate deleted successfully" });
    } catch (err) {
        console.log("Error while deleting debate:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function toggleLikeDebate(req, res) {
    try {
        const debate = await debateModel.findById(req.params.id);

        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        const userId = req.user.userId;
        const alreadyLiked = debate.likes.some(likeId => isSameId(likeId, userId));

        if (alreadyLiked) {
            debate.likes = debate.likes.filter(likeId => !isSameId(likeId, userId));
        } else {
            debate.likes.push(userId);
        }

        await debate.save();

        return res.status(200).json({
            message: alreadyLiked ? "Debate unliked successfully" : "Debate liked successfully",
            liked: !alreadyLiked,
            likesCount: debate.likes.length
        });
    } catch (err) {
        console.log("Error while toggling debate like:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function toggleBookmarkDebate(req, res) {
    try {
        const debate = await debateModel.findById(req.params.id);

        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        const user = await userModel.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const alreadyBookmarked = user.bookmarkedDebates.some(debateId => isSameId(debateId, debate._id));

        if (alreadyBookmarked) {
            user.bookmarkedDebates = user.bookmarkedDebates.filter(debateId => !isSameId(debateId, debate._id));
        } else {
            user.bookmarkedDebates.push(debate._id);
        }

        await user.save();

        return res.status(200).json({
            message: alreadyBookmarked ? "Debate removed from bookmarks" : "Debate bookmarked successfully",
            bookmarked: !alreadyBookmarked
        });
    } catch (err) {
        console.log("Error while toggling debate bookmark:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getBookmarkedDebates(req, res) {
    try {
        const user = await userModel.findById(req.user.userId)
            .populate({
                path: 'bookmarkedDebates',
                populate: { path: 'creator', select: 'username' }
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ debates: user.bookmarkedDebates });
    } catch (err) {
        console.log("Error while fetching bookmarked debates:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function closeDebate(req, res) {
    try {
        const debate = await debateModel.findById(req.params.id);

        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        if (!isSameId(debate.creator, req.user.userId)) {
            return res.status(403).json({ message: "Only the debate creator can close this debate" });
        }

        debate.status = 'CLOSED';
        await debate.save();

        return res.status(200).json({ message: "Debate closed successfully", debate });
    } catch (err) {
        console.log("Error while closing debate:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function reopenDebate(req, res) {
    try {
        const debate = await debateModel.findById(req.params.id);

        if (!debate) {
            return res.status(404).json({ message: "Debate not found" });
        }

        if (!isSameId(debate.creator, req.user.userId)) {
            return res.status(403).json({ message: "Only the debate creator can reopen this debate" });
        }

        debate.status = 'OPEN';
        await debate.save();

        return res.status(200).json({ message: "Debate reopened successfully", debate });
    } catch (err) {
        console.log("Error while reopening debate:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export {
    createDebate,
    getAllDebates,
    getSingleDebate,
    updateDebate,
    deleteDebate,
    toggleLikeDebate,
    toggleBookmarkDebate,
    getBookmarkedDebates,
    closeDebate,
    reopenDebate
};
