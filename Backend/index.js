require("dotenv").config(); 
const express = require("express");
const cors = require("cors"); 
const { CopilotRuntime, GoogleGenerativeAIAdapter,copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000; 

app.use(cors());

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


app.post("/api", async (req, res) => {

  const serviceAdapter = new GoogleGenerativeAIAdapter({ model: genAI.getGenerativeModel({ model: "gemini-2.5-pro" }) });
  
  const runtime = new CopilotRuntime();

  const handler = copilotRuntimeNodeHttpEndpoint({
    endpoint: "/api", 
    runtime,
    serviceAdapter,
  });

  return handler(req, res);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
