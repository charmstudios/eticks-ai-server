const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
app.use(cors());

/* Ensure uploads folder exists */

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

/* OpenAI */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* TEST ROUTE */

app.get("/", (req,res)=>{
  res.send("AI Poster Vision API running");
});

/* POSTER AI */

app.post("/api/ai-poster", upload.single("image"), async (req,res)=>{

try{

if(!req.file){
return res.status(400).json({error:"No image uploaded"});
}

/* convert image to base64 */

const image = fs.readFileSync(req.file.path);
const base64 = image.toString("base64");

/* send to vision AI */

const response = await openai.chat.completions.create({

model:"gpt-4o-mini",

messages:[
{
role:"system",
content:`
You are an AI that extracts event data from posters.

Return clean JSON with these fields:

title
date
location
eventType
description
lineup
tickets

Example:

{
"title":"Afro Night Festival",
"date":"12 July 2026",
"location":"Nairobi",
"eventType":"Concert",
"description":"Join Nairobi's biggest Afro music party...",
"lineup":["DJ Joe","MC Vee"],
"tickets":[
{"name":"Early Bird","price":"1000"},
{"name":"VIP","price":"3000"}
]
}

If a field cannot be detected return null.
`
},

{
role:"user",
content:[
{
type:"text",
text:"Extract event information from this poster"
},
{
type:"image_url",
image_url:{
url:`data:image/jpeg;base64,${base64}`
}
}
]
}
],

response_format:{ type:"json_object" }

});

/* parse AI response */

const data = JSON.parse(response.choices[0].message.content);

/* delete uploaded file */

fs.unlinkSync(req.file.path);

res.json({
success:true,
data
});

}
catch(err){

console.error("AI ERROR:", err);

res.status(500).json({
error:"AI Vision parsing failed",
details: err.message
});

}

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
console.log("Vision AI running on port " + PORT);
});
