import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Entry from "./models/Entry.js";
import upload from "./middlewares/upload.js";
import path from "path";
import fs from "fs";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


app.post("/upload/text", async (req, res)=>{
  try{
    const { text} = req.body;
    if(!text) return res.status(400).json({ error: "Text is required"});

    const entry = await Entry.create({ type: "text", text});
    res.json({ success: true, entry});
  }
  catch(err){
    res.status(500).json({error: err.message});
  }
})

app.post("/upload/file", upload.array("files"), async(req, res)=>{
  try{
    if(!req.files || req.files.length === 0){
      return res.status(400).json({ error: "No files uploaded"});
    }

    const filesMeta = req.files.map((file)=>({
      name: file.originalname,
      size: file.size,
      mime: file.mimetype,
      storage: { localpath: file.filename},
    }));

    const entry = await Entry.create({ type: "file", files: filesMeta});
    res.json({ success: true,entry});

  } catch(err){
    res.status(500).json({ error: err.message});
  }
})

app.get("/download", async(req, res)=>{
  try{
    const entries = await Entry.find().sort({ createdAt: -1});
    res.json({ success: true, entries});

  } catch (err){
  res.status(500).json({ error: err.message})
  }
})

app.delete("/delete/:id", async(req, res)=>{
  try{
    const entry = await Entry.findById(req.params.id);
    if(!entry) return res.status(404).json({ error: "Entry not found"});

    if (entry.type === "file"){
      for (const file of entry.files){
        const filepath = path.join("./uploads", file.storage.localPath);
        if(fs.existSync(filepath)){
          fs.unlinkSync(filepath);
        }
      }
    }
    await Entry.findByIdAndDelete(req.params.id);
    res.json({ success: true});

  } catch(err){
    res.status(500).json({ error: err.message});
  }
})






mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

import messageRoutes from "./routes/messageRoutes.js";
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
