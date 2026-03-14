const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: "YOUR_OPENAI_API_KEY"
});

/* TEST */

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

Return clean JSON with:

title
date
location
eventType
description
lineup (array)
tickets (array with name + price)

If unknown return null.
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

const data = JSON.parse(response.choices[0].message.content);

res.json({
success:true,
data
});

}
catch(err){

console.error(err);

res.status(500).json({
error:"AI Vision parsing failed"
});

}

});

/* START */

app.listen(3000, ()=>{
console.log("Vision AI running http://localhost:3000");
});