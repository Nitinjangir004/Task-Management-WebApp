import express from "express";
import cors from "cors";
import { config } from "dotenv";
config();
const app = express();
app.use(cors());
app.use(express.json());
import router from "./src/router/userroute.js";
import mongodb from "./db.js";
const port = process.env.PORT;


app.use("/v1/account" , router);


app.listen(port,()=>{
    console.log(`server is live ${port} `);
    mongodb();
});