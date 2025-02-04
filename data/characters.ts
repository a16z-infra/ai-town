import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';

// import { customAgentConfigs } from './customAgents';

// export const Descriptions = customAgentConfigs.map(config => ({
//     name: config.name,
//     character: config.character,
//     identity: config.identity,
//     plan: config.plan
// }));


// import { LocalAgentSource } from './sources/localAgentSource';
// import { AgentConfig } from './interfaces/agentSource';

// let cachedDescriptions: AgentConfig[] | null = null;

// export async function getDescriptions(): Promise<AgentConfig[]> {
//     if (!cachedDescriptions) {
//         const source = new LocalAgentSource();
//         cachedDescriptions = await source.getSelectedAgents();
//     }
//     return cachedDescriptions;
// }

// export function invalidateCache() {
//     cachedDescriptions = null;
// }

// let Descriptions: AgentConfig[] = [];
// (async () => {
//     Descriptions = await getDescriptions();
// })();

// export { Descriptions };

// import { ConvexClient } from "convex/browser";
// import ConvexClientProvider from '@/components/ConvexClientProvider';

export interface AgentDescription {
  name: string;
  character: string;
  identity: string;
  plan: string;
}

export let Descriptions: AgentDescription[] = [];

// // ① 建一个 client 实例，指向本地 Convex 服务
// //    端口要和你 Docker / just convex dev 一致
// const client = new ConvexClient("http://localhost:5173"); 
// // 如果你在 Docker 中反向映射到 5173 或 3000，也改成相应地址

// export async function updateDescriptions() {
//   try {
//     // ② 调用 "customizeAgents/queries:getSelectedAgents"
//     //    注意：必须按「模块路径 + : + 函数名」写 
//     const selectedAgentsData = await client.query(
//       "customizeAgents/queries:getSelectedAgents",
//       {}
//     );
//     if (!selectedAgentsData) {
//       Descriptions = [];
//       return;
//     }

//     // ③ 调用 "customizeAgents/queries:getAgents"
//     const agents = await client.query("customizeAgents/queries:getAgents", {});
//     if (!agents) {
//       Descriptions = [];
//       return;
//     }

//     // ④ 只保留在 selectedAgentsData.agentIds 里的那部分
//     const selectedAgents = agents.filter((agent: Doc<"agents">) =>
//       selectedAgentsData.agentIds.includes(agent._id)
//     );

//     Descriptions = selectedAgents.map((agent: Doc<"agents">) => ({
//       name: agent.name,
//       character: agent.character,
//       identity: agent.identity,
//       plan: agent.plan,
//     }));

//     console.log("Descriptions updated:", Descriptions);
//   } catch (error) {
//     console.error("Error updating descriptions:", error);
//   }
// }


export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f2SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f3SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 0.75;


// // test 
// const createAgent = useMutation(api.createAgent);
// createAgent({ 
//     name: "TestAgent1", 
//     character: "f1", 
//     identity: "A test character", 
//     plan: "To exist in AI town"
// });
// createAgent({ 
//     name: "TestAgent2", 
//     character: "f2", 
//     identity: "Another test character", 
//     plan: "To interact with others"
// });
// export const Descriptions = useQuery(api.getSelectedAgents) || [];