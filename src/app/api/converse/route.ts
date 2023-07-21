import dotenv from "dotenv";
import ConfigManager from "@/app/utils/config";
import { callLLM, loadCharacterOverview } from "@/app/utils/converse";
import { NextResponse } from "next/server";

dotenv.config({ path: `.env.local` });
let chatHistory: any[] = [];

export async function POST(req: Request, res: Response) {
  const data = await req.json();
  const characters = data.characters;

  const configManager = ConfigManager.getInstance();
  const character1Name = characters[0];
  const character2Name = characters[1];
  const character1Config = configManager.getConfig("name", character1Name);
  const character2Config = configManager.getConfig("name", character2Name);

  let fromCharacterOverview = await loadCharacterOverview(
    character1Config.name + ".txt"
  );
  let toCharacterOverview = await loadCharacterOverview(
    character2Config.name + ".txt"
  );

  const finalPrompt = `
  Your name is ${character1Name} and you are talking to ${character2Name}. 
  Do NOT greet more than once in the same conversation, based on the chat history provided below. 
  Do NOT repeat things you already talked about in the chat history provided below. 
  If you think this conversation should be concluded based on the chat history below, retuen "0". 
  Feel free to start a new topic if you think it'd be interesting to start a different conversation. Below are relevant details about ${character2Name}:
  ${toCharacterOverview}

  
  Chat history: 
  ${chatHistory.join("\n")}

  ${character1Name}:`;

  let responseFromConvo = await callLLM(finalPrompt);
  if (responseFromConvo!.text !== "0") {
    chatHistory.push(`${character1Name}: ${responseFromConvo!.text}`);

    return NextResponse.json({
      text: `${character1Name}: ${responseFromConvo!.text}`,
    });
  } else {
    console.log("sending stop signal");
    return NextResponse.json({
      text: `STOP`,
    });
  }
}
