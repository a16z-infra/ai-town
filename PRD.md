# Stanford Town MVP — PRD

## Priority Tasks

### P0 - Critical (Blocks demo)
- [x] T1: Fix Claude model name error (`claude-sonnet-4-6-20250627` not found) — LLM fallback works but wastes time/logs errors
- [x] T2: Fix Guardian patrol loop — Nora Xu stuck calling agentDoSomething every second without the operation "sticking"
- [x] T3: Fix AgentStatusPanel not rendering — right panel only shows Town News, no agent status/archetype badges/needs bars
- [x] T4: Verify activityEvents are being written to DB — Town News shows "0 events"

### P1 - Important (Core experience)
- [x] T5: Fix Town News to show real events — ensure new news entries include activityEvent data
- [x] T6: Verify archetype behavior variety — villain should skip work, guardian should patrol, stats should affect decisions
- [ ] T7: Polish AgentStatusPanel — ensure it updates in real-time with correct needs decay

### P2 - Nice to have
- [ ] T8: Add agent name labels on map sprites
- [ ] T9: Add conversation content preview in right panel
