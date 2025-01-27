# AI Town Local Setup Guide (Windows with WSL2)

## Prerequisites

- **Windows 10/11** with WSL2 installed

- **Internet connection**

### 1. Install WSL2

1. Open Windows PowerShell as administrator and run:

```bash
wsl -l -v

```
- This checks if Ubuntu is installed and running on WSL2.

2. If not, run:

```bash
wsl --install

```
- Follow the setup instructions.

3. Inside your Ubuntu environment, update the package list:

```bash
sudo apt update

```
---

### 2. Install Dependencies and Project Source

#### 2.1 Install NVM and Node.js

Run the following commands line by line:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

source ~/.bashrc

nvm install 18

nvm use 18

```
#### 2.2 Install Python

```bash
sudo apt install python3 python3-pip -y

```
#### 2.3 Clone AI Town Repository

```bash
git clone https://github.com/a16z-infra/ai-town.git

cd ai-town

```
#### 2.4 Install Rust and Cargo

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

source $HOME/.cargo/env

cargo install just

export PATH="$HOME/.cargo/bin:$PATH"

just --version

```
#### 2.5 Install Ollama

```bash
sudo snap install ollama

```
---

### 3. Run LLMs Locally

#### 3.1 Pull Models

```bash
ollama pull llama3

ollama pull mxbai-embed-large

```
#### 3.2 Start Ollama

```bash
sudo pkill ollama

ollama serve (if it runs successfully, leave it run, open another WSL terminal to continue with step 3.3)

```
#### 3.3 Test if Ollama is Running

```bash
curl http://127.0.0.1:11434

```
- Should return: `Ollama is running`.

---

### 4. Install NPM Packages

1. Navigate to the project directory:

```bash
cd ai-town (make sure npm install at the directory of ai-town)

```
2. Install the necessary npm packages

```bash
npm install

npm audit fix

```
---

### 5. Install Latest Precompiled Convex

1. Download and install Convex:

```bash
curl -L -O https://github.com/get-convex/convex-backend/releases/latest/download/convex-local-backend-x86_64-unknown-linux-gnu.zip

unzip convex-local-backend-x86_64-unknown-linux-gnu.zip

rm convex-local-backend-x86_64-unknown-linux-gnu.zip

chmod +x convex-local-backend

```
---

### 6. Launch AI Town

1. Modify the `predev` configuration in `package.json`:

```bash
nano package.json

```
Find:

```json
"predev": "just convex dev --run init --until-success && convex dashboard",

```
Replace with:

```json
"predev": "echo 'Skipping cloud setup'",

```
Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

2. Set environment variable:

```bash
just convex env set OLLAMA_HOST

(if run into error message: error: I/O error in runtime dir `/run/user/1000/just`: Permission denied (os error 13), then run

sudo mkdir -p /run/user/1000

sudo chown -R $USER:$USER /run/user/1000

sudo chmod 700 /run/user/1000

just convex env set OLLAMA_HOST )

(It should show ✔ Successfully set OLLAMA_HOST to  if it runs successfully. Then leave it run, open another WSL terminal)

```
3. Update `.env.local`:

```bash
nano .env.local

```
Replace the content with:

```plaintext
VITE_CONVEX_URL=http://127.0.0.1:3210

```
Save and exit.

4. Start the local Convex backend:

```bash
./convex-local-backend

Requires Glibc version >= 2.34, and GPU dependency libraries to run this command successfully.

```
5. Launch the frontend and create init world:

```bash
npm run dev

just convex run init

(leave it run)

```
---

### 7. Access AI Town

Open your browser and navigate to:

```
http://localhost:5173/ai-town

```
---

### Notes

- You may need multiple terminal windows for running backend and frontend simultaneously.

- Ensure that `snap`, `nvm`, and `ollama` are properly installed to avoid errors.

