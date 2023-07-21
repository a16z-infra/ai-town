import { NextResponse } from "next/server";
import twilio from "twilio";
import clerk from "@clerk/clerk-sdk-node";
import dotenv from "dotenv";
import ConfigManager from "@/app/utils/config";
import { rateLimit } from "@/app/utils/rateLimit";

dotenv.config({ path: `.env.local` });
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;

export async function POST(request: Request) {
  let queryMap: any = {};
  const twilioClient = twilio(accountSid, twilioAuthToken);
  const data = decodeURIComponent(await request.text());
  data.split("&").forEach((item) => {
    queryMap[item.split("=")[0]] = item.split("=")[1];
  });
  const prompt = queryMap["Body"];
  const serverUrl = request.url.split("/api/")[0];
  const phoneNumber = queryMap["From"];
  const companionPhoneNumber = queryMap["To"];

  const identifier = request.url + "-" + (phoneNumber || "anonymous");
  const { success } = await rateLimit(identifier);
  if (!success) {
    console.log("INFO: rate limit exceeded");
    return new NextResponse(
      JSON.stringify({ Message: "Hi, the companions can't talk this fast." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // check if the user has verified phone #
  const users = await clerk.users.getUserList({ phoneNumber });

  if (!users || users.length == 0) {
    return new NextResponse(
      JSON.stringify({ Message: "User not authorized" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const configManager = ConfigManager.getInstance();
  const companionConfig = configManager.getConfig(
    "phone",
    companionPhoneNumber
  );
  console.log("companionConfig: ", companionConfig);
  if (!companionConfig || companionConfig.length == 0) {
    return new NextResponse(
      JSON.stringify({ Message: "User not authorized" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const companionName = companionConfig.name;
  const companionModel = companionConfig.llm;

  const response = await fetch(`${serverUrl}/api/${companionModel}`, {
    body: JSON.stringify({
      prompt,
      isText: true,
      userId: users[0].id,
      userName: users[0].firstName,
    }),
    method: "POST",
    headers: { "Content-Type": "application/json", name: companionName },
  });

  const responseText = await response.text();

  const to = queryMap["From"];
  const from = queryMap["To"];
  console.log("responseText: ", responseText);
  await twilioClient.messages
    .create({
      body: responseText,
      from,
      to,
    })
    .catch((err) => {
      console.log("WARNING: failed to send SMS.", err);
    });

  return NextResponse.json({ message: "Hello from the API!" });
}
