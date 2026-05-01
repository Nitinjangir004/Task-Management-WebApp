import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());

const port = 8000;
app.get("/api/v1",function(req,res){
res.send("ALL GOOD ");
})


app.listen(port,()=>{
    console.log(`server is live ${port} `);
});