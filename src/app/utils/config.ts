import fs from "fs";
import { Config } from "twilio/lib/twiml/VoiceResponse";

export type CompanionConfig = {
  name: string;
  title: string;
  imageUrl: string;
  llm: string;
  phone: string;
};

class ConfigManager {
  private static instance: ConfigManager;
  private config: any;

  private constructor() {
    const data = fs.readFileSync("companions/companions.json", "utf8");
    this.config = JSON.parse(data);
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(fieldName: string, configValue: string) {
    //).filter((c: any) => c.name === companionName);
    try {
      if (!!this.config && this.config.length !== 0) {
        const result = this.config.filter(
          (c: any) => c[fieldName] === configValue
        );
        if (result.length !== 0) {
          return result[0];
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}

export default ConfigManager;
