// 에이전트 "만들기" — 임직원이 맡기고 싶은 업무만 설명하면 Claude가 등록 초안을 만들어 준다.
// 구조화된 출력(zod)으로 받아 등록 폼을 그대로 채운다. 프롬프트 생성은 기획서 개정으로 제거됐다.
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, GENERATE_MODEL, estimateCostUsd } from "./anthropic";
import { db } from "./db";
import { TIME_BANDS } from "./time-band";

// 기획서 4.2 업무 카테고리 6종.
const ROLE_HINTS: Record<string, string> = {
  "작성·요약": "당신은 금융투자업 문서 작성과 요약에 능한 전문 비서입니다.",
  "조사·리서치": "당신은 증권사 리서치센터의 숙련된 애널리스트입니다.",
  분석: "당신은 금융 데이터 분석에 능숙한 전문가입니다.",
  "번역·검토": "당신은 금융 분야에 정통한 전문 번역가이자 문서 검토자입니다.",
  "기획·아이디어": "당신은 금융사 전략기획 실무에 능한 기획 전문가입니다.",
  "자동화·개발": "당신은 금융 시스템 개발과 업무 자동화에 능숙한 시니어 엔지니어입니다.",
};

function roleFor(cat: string): string {
  return ROLE_HINTS[cat] ?? "당신은 한화투자증권 임직원의 업무를 돕는 전문 AI 어시스턴트입니다.";
}

const TIME_BAND_VALUES = TIME_BANDS.map((b) => b.value) as [string, ...string[]];
const TIME_BAND_GUIDE = TIME_BANDS.map((b) => `${b.value}=${b.label}`).join(", ");

const AgentGenSchema = z.object({
  name: z.string().describe("에이전트 이름. 무슨 일을 하는지 드러나는 간결한 한국어 (예: 리서치 브리핑 자동 발송 에이전트)"),
  desc: z.string().describe("이 에이전트가 무엇을 해주는지 한두 문장으로 설명. 목록 카드에 그대로 노출된다."),
  runType: z
    .enum(["schedule", "event", "skill", "app"])
    .describe(
      "실행 방식. schedule=정해진 시각에 자동 실행, event=사내 시스템에 붙어 이벤트마다 동작, " +
        "skill=사용자 PC에 설치해 Claude가 파일·도구를 다룸, app=배포된 웹·메신저에서 사용",
    ),
  trigger: z.string().describe("언제 도는지 한 줄 (예: '매일 오전 06:30 (평일)', '신규 티켓이 생성될 때마다')"),
  targetTask: z
    .string()
    .describe("이 에이전트가 맡는 업무 설명. 도입 전에 사람이 그 일을 어떻게 처리했고 무엇이 번거로웠는지까지 2~3문장으로 포함."),
  tasks: z.array(z.string()).describe("에이전트가 스스로 하는 일을 실행 순서대로 3~5개. 각각 한 줄."),
  tools: z.array(z.string()).describe("연결되는 도구·데이터 2~4개. 접근 성격을 괄호로 덧붙인다 (예: '사내 리서치 포털 (조회)')."),
  effect: z.string().describe("도입 후 무엇이 달라졌는지 2~3문장. 시간 절감과 품질 변화를 함께 적는다."),
  timeBefore: z.enum(TIME_BAND_VALUES).describe(`도입 전 1회 소요시간 구간. ${TIME_BAND_GUIDE}`),
  timeAfter: z.enum(TIME_BAND_VALUES).describe(`도입 후 1회 소요시간 구간. ${TIME_BAND_GUIDE}`),
  prerequisites: z.array(z.string()).describe("쓰기 전에 미리 준비할 것 2~4개 (계정·권한·승인 등)."),
  howToUse: z.array(z.string()).describe("처음 쓰는 사람이 따라 할 수 있는 사용 순서 3~5단계. 각각 한 문장."),
  instructions: z
    .string()
    .describe("에이전트 정의 전문. 이름·설명·도구 목록·[작업 절차]·[규칙] 구조로 작성하며, 그대로 복사해 쓸 수 있어야 한다."),
});

const COMPLIANCE_RULE =
  "업무 내용이 고객·투자·상품·수익·매수·매도·종목·추천·펀드 등과 관련 있다면, 단정적인 수익 보장이나 투자 권유로 해석될 수 있는 표현은 피하고 사실 중심으로 작성하도록 지침에 반드시 포함하세요.";
const SENSITIVE_RULE = "실제 고객정보·계좌번호·주민번호 등 민감정보를 예시에 포함하지 마세요.";

async function logUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
  await db.usageLog.create({
    data: {
      userId,
      feature: "agent_generate",
      tokensIn: inputTokens,
      tokensOut: outputTokens,
      costUsd: estimateCostUsd(inputTokens, outputTokens),
    },
  });
}

export async function generateAgent(userId: string, cat: string, task: string) {
  const system = `당신은 한화투자증권 사내 "AI 공유 허브"의 에이전트 생성기입니다.
임직원이 맡기고 싶은 업무를 바탕으로, 다른 부서 사람이 읽고 그대로 따라 할 수 있는 에이전트 등록 초안을 만들어주세요.

카테고리: ${cat}
이 카테고리의 전형적인 역할: ${roleFor(cat)}

작성 규칙:
- 허브의 목적은 "우리 팀에서 잘 쓰던 걸 다른 팀도 가져다 쓰게 하는 것"입니다. 읽는 사람은 이 업무를 모릅니다.
- targetTask에는 도입 전 사람이 하던 방식과 불편함을 반드시 포함하세요. 효과가 왜 생기는지 드러납니다.
- timeBefore/timeAfter는 업무 성격에 비추어 현실적인 구간으로 고르세요. 과장하지 마세요.
- howToUse는 "무엇을 클릭/실행하면 되는지" 수준까지 구체적으로 적으세요.
- ${COMPLIANCE_RULE}
- ${SENSITIVE_RULE}`;

  const response = await anthropic.messages.parse({
    model: GENERATE_MODEL,
    max_tokens: 4096,
    system,
    output_config: { format: zodOutputFormat(AgentGenSchema), effort: "medium" },
    messages: [{ role: "user", content: `맡기고 싶은 업무: ${task}` }],
  });

  await logUsage(userId, response.usage.input_tokens, response.usage.output_tokens);

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("에이전트 생성에 실패했어요. 다른 표현으로 다시 시도해주세요.");
  }

  const out = response.parsed_output;
  return {
    ...out,
    cat,
    tasks: out.tasks.filter(Boolean),
    tools: out.tools.filter(Boolean),
    prerequisites: out.prerequisites.filter(Boolean),
    howToUse: out.howToUse.filter(Boolean),
  };
}
