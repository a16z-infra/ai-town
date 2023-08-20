import Replicate, { Prediction, WebhookEventType } from 'replicate';
import { v } from 'convex/values';
import { internalMutation, httpAction, internalAction, internalQuery } from '../_generated/server';
import { internal, api } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { ActionCtx } from 'convex/server';

enum MusicGenNormStrategy {
  Clip = 'clip',
  Loudness = 'loudness',
  Peak = 'peak',
  Rms = 'rms',
}
enum MusicGenFormat {
  wav = 'wav',
  mp3 = 'mp3',
}
export function replicateAvailable(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}
export const handleReplicateWebhook = httpAction(async (ctx, request) => {
  const req = await request.json();
  if (req.id) {
    await ctx.scheduler.runAfter(0, internal.lib.replicate.processWebhook, {
      externalId: req.id,
    });
  }
  return new Response();
});

async function backgroundMusicGenHandler(prediction: Prediction, ctx: ActionCtx) {
  const response = await fetch(prediction.output);
  const music = await response.blob();

  // TODO figure out why .store is returning a Promise<string> and not Promise<Id<'storage'>>
  // cannot type cause to Id<'storage'> either?
  const storageId = await ctx.storage.store(music);

  return await ctx.runMutation(internal.music.createMusic, {
    type: 'background',
    storageId: storageId,
  });
}

const handlers: {
  [K: string]: (
    prediction: Prediction,
    ctx: ActionCtx,
  ) => Promise<string & { __tableName: 'music' }>;
} = {
  BackgroundMusicGen: backgroundMusicGenHandler,
  //Add more handlers here
};

function handleResult(prediction: Prediction, handler: string, ctx: ActionCtx) {
  if (handlers[handler]) {
    return handlers[handler](prediction, ctx);
  }
  console.log('No handler found');
}
export const processWebhook = internalAction({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId, ...args }) => {
    // should this check be in the "controller"?
    const webhook = await ctx.runQuery(internal.lib.replicate.getEntry, { externalId: externalId });
    if (!webhook) {
      console.log('No webhook entry found in our database');
      return;
    }
    const prediction = await client().predictions.get(webhook.externalId);
    await handleResult(prediction, webhook.handler, ctx);
  },
});

export const enqueueBackgroundMusicGeneration = internalAction({
  args: {},
  handler: async (ctx, args) => {
    if (!replicateAvailable()) {
      return;
    }
    const worldState = await ctx.runQuery(api.players.getWorld);
    const frozen: boolean | undefined = worldState?.world.frozen;
    if (frozen) {
      console.log('World is frozen. not generating');
      return;
    }

    // TODO MusicGen-Large on Replicate only allows 30 seconds. Use MusicGen-Small for longer?
    const metadata = await generateMusic('16-bit RPG adventure game with wholesome vibe', 30);

    if (!metadata) {
      return;
    }
    const id = metadata.id;
    const webhookId: Id<'replicate_webhooks'> = await ctx.runMutation(
      internal.lib.replicate.createEntry,
      { externalId: id, handler: 'BackgroundMusicGen', input: metadata },
    );
    return webhookId;
  },
});

export const createEntry = internalMutation({
  args: {
    externalId: v.string(),
    handler: v.string(), //handler defines the function to use when Replicate POST back to server
    input: v.any(),
  },
  handler: async (ctx, { externalId, handler, input, ...args }) => {
    const webhookId = await ctx.db.insert('replicate_webhooks', {
      externalId,
      handler,
      input,
    });
    return webhookId;
  },
});

export const getEntry = internalQuery({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, { externalId, ...args }) => {
    const webhook = await ctx.db
      .query('replicate_webhooks')
      .filter((entry) => entry.eq(entry.field('externalId'), externalId))
      .first();
    return webhook;
  },
});

function client(): Replicate {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
  });

  return replicate;
}

/**
 *
 * @param prompt A description of the music you want to generate.
 * @param duration Duration of the generated audio in seconds.
 * @param webhook webhook URL for Replicate to call when @param webhook_events_filter is triggered
 * @param webhook_events_filter Array of event names to filter the webhook. See https://replicate.com/docs/reference/http#predictions.create--webhook_events_filter
 * @param normalization_strategy Strategy for normalizing audio.
 * @param top_k Reduces sampling to the k most likely tokens.
 * @param top_p Reduces sampling to tokens with cumulative probability of p. When set to `0` (default), top_k sampling is used.
 * @param temperature Controls the 'conservativeness' of the sampling process. Higher temperature means more diversity.
 * @param classifer_free_gudance Increases the influence of inputs on the output. Higher values produce lower-varience outputs that adhere more closely to inputs.
 * @param output_format Output format for generated audio. See @
 * @param seed Seed for random number generator. If None or -1, a random seed will be used.
 * @returns object containing metadata of the prediction with ID to fetch once result is completed
 */
export async function generateMusic(
  prompt: string,
  duration: number,
  webhook: string = process.env.CONVEX_SITE_URL + '/replicate_webhook' || '',
  webhook_events_filter: [WebhookEventType] = ['completed'],
  normalization_strategy: MusicGenNormStrategy = MusicGenNormStrategy.Peak,
  output_format: MusicGenFormat = MusicGenFormat.mp3,
  top_k = 250,
  top_p = 0,
  temperature = 1,
  classifer_free_gudance = 3,
  seed = -1,
  model_version = 'large',
) {
  if (!replicateAvailable()) {
    return;
  }
  return await client().predictions.create({
    // https://replicate.com/facebookresearch/musicgen/versions/7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906
    version: '7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906',
    input: {
      model_version,
      prompt,
      duration,
      normalization_strategy,
      top_k,
      top_p,
      temperature,
      classifer_free_gudance,
      output_format,
      seed,
    },
    webhook,
    webhook_events_filter,
  });
}
