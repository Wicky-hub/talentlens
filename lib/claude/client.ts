import Anthropic from '@anthropic-ai/sdk'

export const MODEL = 'claude-sonnet-4-6' as const

let _client: Anthropic | null = null

export function getClaudeClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  }
  return _client
}
