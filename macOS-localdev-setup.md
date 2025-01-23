# AI Town Local Development setup guide (Unix/Linux-based)

## Dependencies


1. **System Programs(manual install required)**
  - Node.js v18 & npm
  - just command runner
  - Ollama AI server

2. **Binary Dependencies(manual download required)** 
  - Convex Backend Binary
3. **NPM Dependencies**

   All npm dependencies will be automatically installed when run ```npm intall```


## Installation Steps
1. **Install Node.js v18**
    ```bash
    nvm install 18
    nvm use 18
    ```
2. **Install just command runner**
    ```bash
    brew install just
    ```
3. **Clone the repository**
   ```bash
   git clone https://github.com/a16z-infra/ai-town.git
   cd ai-town
    ```
4. **Install npm dependencies**
    ```bash
    npm install
5. **Download Convex backend**
    ```bash
    curl -L -O https://github.com/get-convex/convex-backend/releases/latest/download/convex-local-backend-aarch64-apple-darwin.zip
    unzip convex-local-backend-aarch64-apple-darwin.zip
6. **Install Ollama models**
    ```bash
    ollama serve
    ollama pull llama3
    ollama pull mxbai-embed-large
## Running the Application
  Start each component in separate terminal windows, in this order:

1. **Start Ollama Server**
    ```bash
      # terminal 1
      ollama serve
    ```  
    >If ollama is already running, it will warn you "*Error: listen tcp 127.0.0.1:11434: bind: address already in use*" , you can go straight to step 2

2. **Start Convex Backend**
    ```bash
      # terminal 2
      cd ai-town
      ./convex-local-backend
    ```
3. **Initialize and Start Convex Dev Server**

    Start the server (need to do this everytime)
    ```bash
      # terminal 3
      cd ai-town
      just convex dev
    ```
     If it's **NOT** your first step set up, go to step 4. If it's your **first time** setup, run: 
    ```bash
      # terminal 4
      cd ai-town
      just convex run init 
      just convex env set OLLAMA_HOST http://localhost:11434
    ```
   
4. **Start FrontEnd**
    ```bash
      # last terminal
      cd ai-town
      npm run dev:frontend
    ```
Visit http://localhost:5173/ai-town in your browser

## Troubleshooting Common Issues
1. **If bots aren't moving or interacting:**
- Ensure Ollama is running ```ollama serve```
- check whether Ollama is running ```curl http://localhost:11434```
- Verify required models are installed: ```ollama list```
- Check if you have llama3 model installed ```ollama pull llama3```
- Check if Convex engine is running```./convex-local-backend``` ```just convex dev```
- Rember than if you have reset world, or wiped the data, you need to initialize the world again.``` just convex run init```
2. **If running frontend returns tailwind.config error in the console:**
- Rename```tailwind.config.js``` to ```tailwind.config.cjs```

3. **If get warning *"✖ No CONVEX_DEPLOYMENT set, run npx convex dev to configure a Convex project"* when running ```npm run dev```**
- Run backend and frontend separately instead of using ```npm run dev```
- In AI-town directory, open one terminal, run```just convex dev```
- In AI-town directory,open a new terminal,run ```npm run dev:frontend```

## AI-Town README
https://github.com/a16z-infra/ai-town/blob/main/README.md


