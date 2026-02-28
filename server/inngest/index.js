import { Inngest } from "inngest";
import userModel from "../models/userModel.js";
import Connection from "../models/Connections.js";
import sendEmail from "../configs/nodemailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });

// inngest function to  save user data to a database// 



const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
        let username = email_addresses[0].email_address.split("@")[0];

        // check availability of username//
        const user = await userModel.findOne({ username })

        if (user) {
            username = username + Math.floor(Math.random() * 10000); // this is to make the username unique
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
            username
        }

        await userModel.create(userData);

    },
)


// ingest function to update user data in the database//

const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },

    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;


        const updatedUserData = {
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
        }
        await userModel.findByIdAndUpdate(id, updatedUserData);
        // hope this works//
    },
)
// delete user from database when user is deleted from clerk//

const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },

    async ({ event }) => {
        const { id } = event.data;
        await userModel.findByIdAndDelete(id);
        // await userModel.findByIdAndDelete(id);



    },
)

// inngest function to send reminder when a new connection request is added
const sendNewConnectionRequestReminder = inngest.createFunction(
    { id: "send-new-connection-request-reminder" },
    { event: "app/connection-request" },
    async ({ event, step }) => {
        const { connectionId } = event.data;

        await step.run('send-connection-request-mail', async () => {
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
            const subject = `👋🏻 New Connection Request`;
            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px; ">
                <h2> Hi ${connection.to_user_id.full_name}, </h2>
                <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}.</p>
                <p> Click <a href=${process.env.FRONTEND_URL}/connections" style="color: #10b981;" here</a> to accept or reject the request.</p>
                <br/>
                <p>Thanks, <br/> PingUp - Stay Connected</p>
            </div>    
            `;

            await sendEmail({ to: connection.to_user_id.email, subject, body });
        })

        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil('wait-for-24-hours', in24Hours);
        await step.run('send-connection-request-reminder', async () => {
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
            if (connection.status === "accepted") {
                return { message: "Already accepted" }
            }
            const subject = `👋🏻 New Connection Request`;
            const body = `
                <div style="font-family: Arial, sans-serif; padding: 20px; ">
                    <h2> Hi ${connection.to_user_id.full_name}, </h2>
                    <p>This is a reminder that you have a pending connection request from ${connection.from_user_id.full_name}- @${connection.from_user_id.username}.</p>
                    <p> Click <a href=${process.env.FRONTEND_URL}/connections" style="color: #10b981;" here</a> to accept or reject the request.</p>
                    <br/>
                    <p>Thanks, <br/> PingUp - Stay Connected</p>
                </div>    
                `;
            await sendEmail({ to: connection.to_user_id.email, subject, body });

            return { message: "reminder sent successfully" }
        })

    }
)

// inngest function to delete story after 24 hours 

const deleteStory = inngest.createFunction(
    { id: 'story-delete' },
    { event: 'app/story.deleted' },
    async ({ event, step }) => {
        const { storyId } = event.data;
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil('wait-for-24-hours', in24Hours);
        await step.run('delete-story', async () => {
            await Story.findByIdAndDelete(storyId);
            return { message: "story deleted successfully" }
        })
    }
)
const sendNotificationOfUnseenMessages = inngest.createFunction(
    { id: 'send-unseen-messages-notification-' },
    { cron: 'TZ=America/New_York 0 9 * * *' }, // every day 9 am

    async ({ step }) => {
        const messages = await Message.find({ seen: false }).populate('to_user_id ');
        const unseenCount = {};

        messages.map(messages => {
            unseenCount[messages.to_user_id._id] = unseenCount[messages.to_user_id._id] || (unseenCount[messages.to_user_id._id] || 0)
        })

        for (const userId in unseenCount) {
            const user = await userModel.findById(userId);
            const subject = `You have ${unseenCount[userId]} unseen messages`;
            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px; ">
                <h2> Hi ${user.full_name}, </h2>
                <p>You have ${unseenCount[userId]} unseen messages in your inbox.</p>
                <p> Click <a href=${process.env.FRONTEND_URL}/messages" style="color: #10b981;" here</a> to view them.</p>
                <br/>
                <p>Thanks, <br/> PingUp - Stay Connected</p>
            </div>    
            `;

            await sendEmail({
                to: user.email,
                subject,
                body
            });
        }
        return { message: "Notifications sent successfully" }
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendNewConnectionRequestReminder,
    deleteStory,
    sendNotificationOfUnseenMessages
];