// ===========================================================================
// invideo 2 (MCP) x Ahmed, Oct 2026. Shared series tokens.
// READ-ONLY for part builders: import from here, build layouts in your own file.
//
// Same world as the first invideo reel (src/invideo): Ahmed's Skilltree gray,
// fish7/fish8 tokens, the sampled invideo Editor palette and real UI strings.
// New here: the org chart of Ahmed's 42 agents (role names from his own
// 42-agent sales and 37-agent marketing reels) and the real invideo MCP
// strings from invideo.io/mcp. No invented copy anywhere.
// ===========================================================================
export { WORLD, SPRINGS, safePadX, FONT_UI, FONT_MONO, SAFE, EASE, IV, IV_UI, IV_LOGO } from "../invideo/theme";
export { TERM, AGENTS } from "../fish7/theme";

// Ahmed's AI workforce, two departments, 42 seats. Role names are the ones he
// says out loud in his 42-agent and 37-agent reels. Seat 43 is the empty one.
export const ORG = {
  sales: {
    chief: "Chief Sales Officer",
    teams: [
      { name: "Outreach", roles: ["Email Writer", "Voice & SMS", "BDR · English", "BDR · Spanish", "BDR · French", "BDR · German", "BDR · Arabic", "Follow-up Drafter"] },
      { name: "RevOps", roles: ["HubSpot", "Data Warehouse", "Competitive Intel", "Pipeline Reports"] },
      { name: "Research", roles: ["Lead Scoring", "Discovery Call Prep", "Account Analysis", "Call Analyst"] },
      { name: "Logistics", roles: ["Scheduling", "Proposals", "Enablement Content", "Contracts"] },
    ],
  },
  marketing: {
    chief: "Chief Marketing Officer",
    teams: [
      { name: "Social", roles: ["Instagram", "LinkedIn", "X", "Repurposing"] },
      { name: "Long-form", roles: ["Blog Writer", "Case Study Writer", "Publisher"] },
      { name: "DemandGen", roles: ["Meta Ads", "Google Ads", "SEO"] },
      { name: "Brand", roles: ["Creative", "Assets", "Landing Pages"] },
      { name: "Marketing Ops", roles: ["Email Infrastructure", "Newsletters", "Campaigns", "Analytics"] },
      { name: "Community", roles: ["Community Manager", "Partnerships", "YouTube"] },
    ],
  },
  emptySeat: "Video Editor",
  total: 42,
} as const;

// Real invideo MCP strings (invideo.io/mcp, fetched 2026-10-06). Copy exactly.
export const MCP = {
  server: "https://mcp-v2.invideo.io/mcp",
  addCommand: "claude mcp add --transport http --scope user invideo https://mcp-v2.invideo.io/mcp",
  setupPrompt:
    "Set up invideo's video editor as an MCP server for yourself so we can edit videos on a professional NLE timeline together.",
  agentsMd: "https://invideo.io/agents.md",
  remoteAgents: "invideo.io/remote-agents",
  introName: "Ahmed's Claude",
} as const;

// Lines Ahmed gives Claude Code in the script (the real capture may rephrase; builders copy the capture).
export const REQUESTS = {
  firstCut: "Build the first cut from these raw clips, cut the silences, and add titles.",
  shot: "I need a shot I never filmed here: generate it and cut it in.",
  tighten: "Tighten the ending.",
} as const;
