import express from "express";
const router = express().router;
import { sigin } from "../controllers/authentication.js";

router.post("/signup",sigin);
router.get("/user", function(req,res){
    res.json({
        messsage:"hello"
    })
})

export default router;