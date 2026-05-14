import type { TalentScoreBreakdown, Platform, CampaignStatus, MatchStatus } from './index'

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      smes: {
        Row: {
          id: string
          user_id: string
          business_name: string
          industry: string
          description: string
          website_url: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['smes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['smes']['Insert']>
        Relationships: []
      }
      influencers: {
        Row: {
          id: string
          username: string
          platform: Platform
          display_name: string
          bio: string
          follower_count: number
          following_count: number
          post_count: number
          avg_engagement_rate: number
          categories: string[]
          location: string
          profile_image_url: string
          profile_url: string
          talent_score: number | null
          talent_score_breakdown: TalentScoreBreakdown | null
          apify_actor_run_id: string | null
          last_scraped_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          username: string
          platform: Platform
          display_name: string
          bio: string
          follower_count: number
          following_count: number
          post_count: number
          avg_engagement_rate: number
          categories: string[]
          location: string
          profile_image_url: string
          profile_url: string
          // nullable columns default to NULL — callers may omit them
          talent_score?: number | null
          talent_score_breakdown?: TalentScoreBreakdown | null
          apify_actor_run_id?: string | null
          last_scraped_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['influencers']['Insert']>
        Relationships: []
      }
      campaigns: {
        Row: {
          id: string
          sme_id: string
          name: string
          description: string
          budget: number
          target_categories: string[]
          target_location: string | null
          min_followers: number
          max_followers: number
          min_talent_score: number
          status: CampaignStatus
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['campaigns']['Row'],
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>
        Relationships: []
      }
      campaign_matches: {
        Row: {
          id: string
          campaign_id: string
          influencer_id: string
          match_score: number
          status: MatchStatus
          matched_at: string
        }
        Insert: Omit<Database['public']['Tables']['campaign_matches']['Row'], 'id' | 'matched_at'>
        Update: Partial<Database['public']['Tables']['campaign_matches']['Insert']>
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          campaign_id: string
          influencer_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}
