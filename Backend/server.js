import express from "express";
import cors from "cors";
import router from "./src/router/userroute.js";
import mongodb from "./db.js";
import { transporter } from "./utils/mailer.js";
import { config } from "dotenv";
config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT;
try {
    await transporter.verify();
    console.log("Server is ready to take our messages");
    } 
catch (err) {
    console.error("Verification failed:", err);
}

app.use("/v1/account" , router);


app.listen(port,()=>{
    console.log(`server is live ${port} `);
    mongodb();
});