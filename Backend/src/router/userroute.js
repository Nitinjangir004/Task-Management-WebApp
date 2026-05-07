import express from "express";
const router = express().router;
import { signup,login } from "../controllers/authentication.js";

router.post("/signup",signup);
router.post("/login",login);
router.get("/user", function(req,res){
    res.json({
        messsage:"hello"
    })
})

export default router;