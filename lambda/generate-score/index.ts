import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { GhostGolfer } from '../shared/scoring/generator.js';
import { GhostGolferConfigSchema } from '../shared/scoring/validation.js';
import { success, error } from '../shared/response.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate input using the existing config schema
    const config = GhostGolferConfigSchema.parse(body);

    // Generate round
    const golfer = new GhostGolfer(config);
    const round = golfer.generateRound();

    return success(round);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error(400, `Validation error: ${err.message}`);
    }
    console.error('Generate score error:', err);
    return error(500, 'Internal server error');
  }
};
