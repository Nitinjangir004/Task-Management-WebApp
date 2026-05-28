import 'dotenv/config'
import express from "express";
import cors from "cors";
import router from "./src/router/userroute.js";
import mongodb from "./db.js";
import { transporter } from "./utils/mailer.js";
import cookieParser from "cookie-parser";
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 5000;

//routes
app.use("/v1/account" , router);

const startServer = async () => {
    try {
        await transporter.verify()
        console.log("Mailer ready")
        
        mongodb()
        
        app.listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
    } catch (err) {
        console.error("Startup failed:", err)
        process.exit(1)  // kill server if critical setup fails
    }
}

startServer();