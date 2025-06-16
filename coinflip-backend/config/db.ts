import mongoose from "mongoose";
import { MONGO_URL } from "./config";

export const connectMongoDB = async () => {
    let isConnected = false;

    const connect = async () => {
        try {
            if (MONGO_URL) {
                const connection = await mongoose.connect(MONGO_URL);
                console.log(`MONGODB CONNECTED : ${connection.connection.host}`);
                isConnected = true;
            } else {
                console.log("No Mongo URL");
            }
        } catch (error) {
            console.log(`Error : ${(error as Error).message}`);
            isConnected = false;
            // Attempt to reconnect
            setTimeout(connect, 1000); // Retry connection after 1 seconds
        }
    };

    connect();

    mongoose.connection.on("disconnected", () => {
        console.log("MONGODB DISCONNECTED");
        isConnected = false;
        // Attempt to reconnect
        setTimeout(connect, 1000); // Retry connection after 5 seconds
    });

    mongoose.connection.on("reconnected", () => {
        console.log("MONGODB RECONNECTED");
        isConnected = true;
    });
};