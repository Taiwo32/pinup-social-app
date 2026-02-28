import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import userModel from "../models/userModel.js";
import { inngest } from "../inngest/index.js";

// add user story 
export const addUserStory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, media_type, background_color } = req.body;
        const media = req.file
        let media_url = ''

        // upload media to imagekit 
        if (media_type === 'image' || media_type === 'video') {
            const fileBuffer = fs.readFileSync(media.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            })
            media_url = response.url

        }
        // create story 
        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color,
        })

        // schedule story deletion after 24 hours using inngest

        await inngest.send({
            name: 'app/story.delete',
            data: {storyId: story._id}

        })

        return res.json({ success: true, });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// get user stories

export const getStories = async (req, res) => {
    try {
        const { userId } = req.auth();
        const  user = await userModel.findById(userId)

        // user connections and followings

        const userIds = [userId, ...user.following, ...user.connections]

        const stories = await Story.find({ user: { $in: userIds } }).populate('user').sort({ createdAt: -1 })
        return res.json({ success: true, stories });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
