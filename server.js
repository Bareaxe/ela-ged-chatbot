{
  "name": "ela-ged-chatbot",
  "version": "1.0.0",
  "description": "An AI-powered study assistant for GED English Language Arts (ELA) prep",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "license": "MIT"
}
