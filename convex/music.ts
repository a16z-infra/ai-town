import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';
import Replicate, { WebhookEventType } from 'replicate';
import { httpAction, internalAction } from './_generated/server';
import { internal, api } from './_generated/api';

function client(): Replicate {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
  });
  return replicate;
}

function replicateAvailable(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}

export const insertMusic = internalMutation({
  args: { storageId: v.string(), type: v.union(v.literal('background'), v.literal('player')) },
  handler: async (ctx, args) => {
    await ctx.db.insert('music', {
      storageId: args.storageId,
      type: args.type,
    });
  },
});

export const getBackgroundMusic = query({
  handler: async (ctx) => {
    const music = await ctx.db
      .query('music')
      .filter((entry) => entry.eq(entry.field('type'), 'background'))
      .order('desc')
      .first();
    if (!music) {
      return '/assets/background.mp3';
    }
    const url = await ctx.storage.getUrl(music.storageId);
    if (!url) {
      throw new Error(`Invalid storage ID: ${music.storageId}`);
    }
    return url;
  },
});

export const enqueueBackgroundMusicGeneration = internalAction({
  handler: async (ctx): Promise<void> => {
    if (!replicateAvailable()) {
      return;
    }
    const worldStatus = await ctx.runQuery(api.world.defaultWorldStatus);
    if (!worldStatus) {
      console.log('No active default world, returning.');
      return;
    }
    // TODO: MusicGen-Large on Replicate only allows 30 seconds. Use MusicGen-Small for longer?
    await generateMusic('16-bit RPG adventure game with wholesome vibe', 30);
  },
});

export const handleReplicateWebhook = httpAction(async (ctx, request) => {
  const req = await request.json();
  if (req.id) {
    const prediction = await client().predictions.get(req.id);
    const response = await fetch(prediction.output);
    const music = await response.blob();
    const storageId = await ctx.storage.store(music);
    await ctx.runMutation(internal.music.insertMusic, { type: 'background', storageId });
  }
  return new Response();
});

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
    throw new Error('Replicate API token not set');
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
