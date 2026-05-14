import type { AgentResult, Report } from '@/types'
import { getClaudeClient, MODEL } from '@/lib/claude/client'
import { createServiceClient } from '@/lib/supabase/server'

interface ReportInput {
  campaignId: string
  influencerId: string
}

const SYSTEM_PROMPT = `คุณเป็นที่ปรึกษาการตลาดอินฟลูเอนเซอร์สำหรับธุรกิจ SME ไทย
เขียนรายงานเป็นภาษาไทย ใช้ภาษาที่เข้าใจง่าย กระชับ และให้คำแนะนำที่ปฏิบัติได้จริง
จัดรูปแบบเป็น Markdown`

export async function generateReport(input: ReportInput): Promise<AgentResult<Report>> {
  const start = Date.now()

  try {
    const supabase = await createServiceClient()

    const [{ data: campaign }, { data: influencer }] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', input.campaignId).single(),
      supabase.from('influencers').select('*').eq('id', input.influencerId).single(),
    ])

    if (!campaign || !influencer) {
      throw new Error('Campaign or influencer not found')
    }

    const claude = getClaudeClient()
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `สร้างรายงานวิเคราะห์อินฟลูเอนเซอร์สำหรับแคมเปญต่อไปนี้:

## ข้อมูลแคมเปญ
- ชื่อแคมเปญ: ${campaign.name}
- คำอธิบาย: ${campaign.description}
- งบประมาณ: ${campaign.budget.toLocaleString('th-TH')} บาท
- หมวดหมู่เป้าหมาย: ${campaign.target_categories.join(', ')}

## ข้อมูลอินฟลูเอนเซอร์
- ชื่อบัญชี: @${influencer.username} (${influencer.platform})
- ชื่อ: ${influencer.display_name}
- ผู้ติดตาม: ${influencer.follower_count.toLocaleString('th-TH')} คน
- Engagement Rate: ${(influencer.avg_engagement_rate * 100).toFixed(2)}%
- TalentScore: ${influencer.talent_score}/100
- วิเคราะห์เบื้องต้น: ${influencer.talent_score_breakdown?.rationale ?? '-'}

รายงานควรครอบคลุม:
1. สรุปภาพรวมความเหมาะสม
2. จุดแข็งและข้อควรระวัง
3. ข้อเสนอแนะเรื่องรูปแบบการร่วมงานและค่าตอบแทนโดยประมาณ
4. KPI ที่ควรติดตาม`,
        },
      ],
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''

    const { data: report, error } = await supabase
      .from('reports')
      .insert({ campaign_id: input.campaignId, influencer_id: input.influencerId, content })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return { success: true, agent: 'report', duration_ms: Date.now() - start, data: report as Report }
  } catch (error) {
    return {
      success: false,
      agent: 'report',
      duration_ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
