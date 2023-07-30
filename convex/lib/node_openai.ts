// 'use node';
// import { Configuration, CreateModerationResponseResultsInner, OpenAIApi } from 'openai';
// import { internalAction } from '../_generated/server';
// import { v } from 'convex/values';

// export const chat = internalAction({
//   args: {
//     messages: v.array(
//       v.object({ role: v.union(v.literal('system'), v.literal('user')), content: v.string() }),
//     ),
//     body: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const openai = openAI();
//     // Check if the message is offensive.
//     const modResponse = await openai.createModeration({
//       input: args.body,
//     });
//     const modResult = modResponse.data.results[0];
//     if (modResult.flagged) {
//       throw new Error('Your message was flagged: ' + flaggedCategories(modResult).join(', '));
//     }

//     const messages = [...args.messages, { role: 'user' as const, content: args.body }];

//     const openaiResponse = await openai.createChatCompletion({
//       model: 'gpt-3.5-turbo',
//       messages,
//     });
//     console.log({
//       body: openaiResponse.data.choices[0].message?.content,
//       usage: openaiResponse.data.usage,
//       updatedAt: Date.now(),
//       ms: Number(openaiResponse.headers['openai-processing-ms']),
//     });
//   },
// });

// const flaggedCategories = (modResult: CreateModerationResponseResultsInner) => {
//   return Object.entries(modResult.categories)
//     .filter(([, flagged]) => flagged)
//     .map(([category]) => category);
// };

// function openAI() {
//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) {
//     throw new Error(
//       'Missing OPENAI_API_KEY in environment variables.\n' +
//         'Set it in the project settings in the Convex dashboard:\n' +
//         '    npx convex dashboard\n or https://dashboard.convex.dev',
//     );
//   }

//   const configuration = new Configuration({ apiKey });
//   return new OpenAIApi(configuration);
// }

export default 'Not used for now';
