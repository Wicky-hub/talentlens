import { Pinecone } from '@pinecone-database/pinecone'

let _pinecone: Pinecone | null = null

function getPineconeClient(): Pinecone {
  if (!_pinecone) {
    _pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  }
  return _pinecone
}

export function getInfluencerIndex() {
  return getPineconeClient().index(process.env.PINECONE_INDEX_NAME!)
}

export async function upsertInfluencerEmbedding(
  influencerId: string,
  embedding: number[],
  metadata: Record<string, string | number | boolean>,
) {
  const index = getInfluencerIndex()
  await index.upsert([{ id: influencerId, values: embedding, metadata }])
}

export async function queryInfluencersByEmbedding(
  embedding: number[],
  topK: number = 10,
  filter?: Record<string, unknown>,
) {
  const index = getInfluencerIndex()
  const result = await index.query({
    vector: embedding,
    topK,
    filter,
    includeMetadata: true,
  })
  return result.matches
}
