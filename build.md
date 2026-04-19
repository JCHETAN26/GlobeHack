# DispatchIQ — Build & GTM Strategy

---

## What We're Building

DispatchIQ is an AI-native fleet operations assistant that connects two worlds that have never talked to each other — the dispatcher's web dashboard and the driver's mobile app — through a real-time intelligence layer that turns raw fleet data into actionable decisions. Built on Trucker Path's existing platform, it solves the two most expensive problems in small fleet operations: dispatchers assigning the wrong driver to the wrong load, and fleet owners having no idea what their operation actually costs until it's too late to fix it.

---

## The Two Problems We're Solving

### Problem 1: Smart Dispatch
Maria, the dispatcher, spends 90 minutes every morning texting drivers to find out who's available. When a load comes in, she picks from memory and often gets it wrong — creating deadhead miles, compliance risk, and ripple effects across tomorrow's board. DispatchIQ replaces that entire process with an AI engine that scores every driver by HOS remaining, location, truck fit, and true cost per mile — and delivers one clear recommendation in seconds.

### Problem 2: Cost Intelligence
Fleet owners cannot answer the most basic question in their business: "What did we actually make this week?" Fuel costs are chased manually, deadhead miles are invisible, and per-driver performance lives in spreadsheets if it exists at all. DispatchIQ captures every cost automatically — fuel from driver receipt uploads, deadhead from GPS, HOS stops from compliance data — and surfaces true cost per mile broken down by driver, route, and load. Always live. Always accurate.

---

## Full System Architecture

```
DRIVER (Expo Go Mobile App)
├── Availability toggle (on/off shift)
├── HOS input (hours driven today)
├── Load accept / drop
├── Fuel receipt upload + amount entry
└── ElevenLabs voice assistant (hands-free)
          ↓ real-time data feed
DISPATCHIQ AI ENGINE (Claude API)
├── HOS Compliance Gate (hard filter)
├── Smart Dispatch Optimizer (scoring engine)
├── Backhaul Intelligence (return load finder)
├── Cost Intelligence (true CPM calculator)
└── Weekly Fleet Summary (auto-generated)
          ↓ decisions + recommendations
DISPATCHER (React Web Dashboard)
├── Fleet Readiness Board (live map + HOS status)
├── Load Assignment Screen (AI recommendation)
├── Cost Intelligence Dashboard (CPM breakdown)
└── HOS Compliance View (risk flags)
```

---

## HOS Compliance Logic

Every dispatch decision passes through a hard compliance gate before reaching Maria.

**The Rule:**
- Trip duration estimated by system (distance ÷ average speed)
- Driver must have HOS remaining ≥ trip duration + 1 hour buffer
- 9-hour trip requires minimum 10 hours HOS remaining
- Ineligible drivers are locked out — cannot be assigned regardless of other factors

**Driver Status:**
- 🟢 CLEAR — sufficient HOS + buffer
- 🟡 TIGHT — within 1.5 hours of minimum
- 🔴 INELIGIBLE — locked out of this load
- ⚫ OFF SHIFT — not available

**Why this matters financially:**
A single HOS violation fine ranges from $1,000–$16,000. DispatchIQ makes violations structurally impossible. That's not a feature — that's insurance that pays for itself on the first violation it prevents.

---

## Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Dispatcher Dashboard | React + Tailwind CSS | Web interface for Maria |
| Driver App | Expo Go (React Native) | Mobile interface for John |
| AI Brain | Claude API (claude-sonnet-4-6) | Dispatch recommendations + cost analysis |
| Voice Assistant | ElevenLabs API (eleven_v3) | Hands-free driver communication |
| Insurance Layer | Insforge API | Coverage gap flagging |
| Deployment | govector.ai | Live product packaging |
| MCPs | Gmail, Google Calendar, Google Drive | Workflow automation |
| Maps | Trucker Path + Google Maps | Route optimization |

---

## Build Priorities (24 Hours)

### Day 1 — Morning (Hours 1–4): Foundation
- [ ] React dashboard shell + routing
- [ ] Expo Go app shell + navigation
- [ ] Claude API connected + basic prompt working
- [ ] Mock fleet data (10 drivers, locations, HOS values)

### Day 1 — Afternoon (Hours 5–8): Core Engine
- [ ] HOS compliance gate logic
- [ ] Fleet Readiness Board (map + driver cards)
- [ ] Load input form
- [ ] AI dispatch recommendation output (Claude)
- [ ] Driver status display (🟢🟡🔴⚫)

### Day 1 — Evening (Hours 9–12): Driver App
- [ ] Availability toggle
- [ ] HOS input + countdown clock
- [ ] Load accept / drop flow
- [ ] Fuel receipt upload + amount entry

### Day 2 — Morning (Hours 13–16): Intelligence Layers
- [ ] Cost per mile calculation
- [ ] Cost Intelligence dashboard (breakdown view)
- [ ] Backhaul opportunity surface
- [ ] ElevenLabs voice integration (dispatch read-aloud)

### Day 2 — Afternoon (Hours 17–20): Polish + Demo
- [ ] Demo mode (pre-filled data, instant responses)
- [ ] Offline fallback (cached responses if WiFi fails)
- [ ] Full demo run-through (60 seconds)
- [ ] Sponsor integrations visible (Insforge flag, govector.ai live link)

### Day 2 — Evening (Hours 21–24): GTM + Deck
- [ ] Product deck (problem → solution → architecture → GTM)
- [ ] GTM plan finalized
- [ ] Pitch rehearsal x3

---

## GTM Strategy

### Target Customer

**Primary ICP: The Small Fleet Owner-Operator**
- Fleet size: 5–50 trucks
- Annual revenue: $500K–$5M
- Current tools: Trucker Path free app + spreadsheets + phone
- Pain: Invisible costs, manual dispatch, compliance risk
- Decision maker: Owner or operations manager
- Willingness to pay: $200–$700/month for measurable ROI

**Why this segment:**
- 500,000+ small fleets operating in the US
- Massively underserved by enterprise TMS solutions (too expensive, too complex)
- Already on Trucker Path — zero cold start acquisition needed
- One bad HOS violation or one week of deadhead waste covers the entire subscription cost

---

### Pricing Model

| Plan | Price | Fleet Size | Key Features |
|---|---|---|---|
| **Starter** | $199/month | Up to 5 trucks | Smart Dispatch + HOS Compliance |
| **Growth** | $399/month | Up to 20 trucks | + Cost Intelligence + Voice Assistant |
| **Fleet** | $699/month | Up to 50 trucks | + Backhaul Intelligence + Insforge |

**ROI justification per plan:**
- Starter: Eliminating 1 HOS violation/month saves $1,000+ → 5x ROI
- Growth: Reducing deadhead 10% on 10-truck fleet saves $2,000/month → 5x ROI
- Fleet: Backhaul intelligence on 20-truck fleet generates $8,000+/month → 11x ROI

**Annual contract discount: 20% off** — incentivizes commitment, improves LTV

---

### Acquisition Channels

#### Channel 1: Trucker Path In-App Distribution (Primary)
**Why:** 1M+ drivers and fleet operators already on the platform. Zero cold outreach needed.

**How:**
- DispatchIQ surfaces as a native upsell within Trucker Path Fleet NavPro
- Triggered when dispatcher views fleet map — "See who's ready for the next load in one click"
- 14-day free trial — no credit card required
- Trucker Path takes revenue share (proposed: 30%) — aligns incentives

**Expected conversion:** 2% of 50,000 fleet operators = 1,000 paying customers in Year 1

---

#### Channel 2: Direct Outbound to Fleet Operators
**How:**
- Target: Owner-operators with 5–20 trucks on Trucker Path load board
- Message: "You're leaving $2,000/month on the table in deadhead miles. Here's the proof."
- Lead with the cost intelligence audit — free 30-day report showing their actual deadhead waste
- Gmail MCP automates personalized outreach sequences

**Sequence:**
```
Day 1:  "Here's what your fleet is actually costing you" (data hook)
Day 4:  "3 loads last week that could have been assigned differently" (specific)
Day 8:  "Free trial — see your real cost per mile in 10 minutes" (CTA)
Day 14: "Last chance — trial ends Friday" (urgency)
```

---

#### Channel 3: Trucking Community & Word of Mouth
**How:**
- Trucker Path has the largest trucking community in North America
- Seed with 10 power users (high-volume dispatchers) — give them free Fleet plan for 90 days
- They share results in trucking forums, Facebook groups, Reddit (r/Truckers, r/FreightBrokers)
- Every satisfied fleet owner knows 5–10 other fleet owners

**Flywheel:**
```
Free trial → First week ROI visible → Share with peer → Peer signs up
```

---

#### Channel 4: Insurance Partnership (Insforge)
**How:**
- Fleet owners who comply with HOS regulations get better insurance rates
- Partner with Insforge to offer DispatchIQ as a compliance tool that unlocks lower premiums
- Insforge refers fleets to DispatchIQ — we refer fleets to Insforge
- Mutual co-sell: "Use DispatchIQ → prove HOS compliance → save on insurance"

**Message:** "DispatchIQ users have zero HOS violations. Your insurance company will notice."

---

#### Channel 5: govector.ai Launch
**How:**
- Package DispatchIQ as a live product on govector.ai during the hackathon demo
- Live URL, live pricing page, live signup flow
- Judges can sign up during the pitch
- Immediate social proof: "You can start a trial right now"

---

### Revenue Model & Projections

**Year 1 (Conservative)**
```
Trucker Path distribution:  500 customers × $299 avg = $149,500 MRR
Direct outbound:            200 customers × $399 avg = $79,800 MRR
Total MRR end of Year 1:    $229,300
ARR:                        $2.75M
```

**Year 2 (Growth)**
```
Total customers:            3,000
Average MRR per customer:   $350
Total MRR:                  $1,050,000
ARR:                        $12.6M
```

**Unit Economics**
```
CAC (via Trucker Path channel): $150
CAC (via outbound):             $400
Blended CAC:                    $200
Average LTV (24-month):         $7,200
LTV:CAC ratio:                  36:1
Payback period:                 < 1 month
```

---

### Scalability Path

| Phase | What it looks like |
|---|---|
| **Phase 1 (0–6 months)** | 5–50 truck fleets on Trucker Path. Prove unit economics. |
| **Phase 2 (6–18 months)** | Expand to mid-market fleets (50–200 trucks). Add ELD integration. |
| **Phase 3 (18–36 months)** | Sell intelligence layer to brokers — "which carriers are most reliable on this lane?" |
| **Phase 4 (36+ months)** | Become the operating system for independent trucking in North America |

**The moat:** Every load dispatched, every fuel receipt uploaded, every HOS logged makes the AI smarter. The model improves with every fleet that uses it. Data is the defensible advantage — and it compounds.

---

### Competitive Positioning

| Competitor | What they do | Why DispatchIQ wins |
|---|---|---|
| **McLeod TMS** | Enterprise TMS | $50K+ implementation, built for 200+ truck fleets |
| **Samsara** | Fleet tracking + ELD | Hardware-heavy, no AI dispatch intelligence |
| **Trucker Path (today)** | Navigation + tracking | Has the data, missing the decision layer |
| **Spreadsheets** | Manual everything | We replace this entirely |

**Our positioning:** "The intelligence layer that small fleets could never afford — built on the platform they already use."

---

## Pitch Narrative (5 Minutes)

**Minute 1 — The Problem (Maria's morning)**
> "Maria runs dispatch for a 15-truck family fleet. Every morning at 7am she sends 20 text messages. Just to find out where her drivers are and how many hours they have left. By the time she has that information, 90 minutes of her day are gone. Then a load comes in. She picks a driver from memory. She often picks wrong. Last week that wrong pick cost her $800 in deadhead miles."

**Minute 2 — The Gap**
> "Trucker Path already has everything it needs to fix this. John's HOS ticks on his phone. His location updates in real time. His documents upload from the cab. The data exists. But none of it feeds Maria's decisions. The product has the inputs. It doesn't yet have the layer that turns them into action."

**Minute 3 — The Solution (Live Demo)**
> "We built that layer. This is DispatchIQ."
> [Demo: Fleet Readiness Board → Load input → AI recommendation → Cost dashboard]

**Minute 4 — The Business Case**
> "A 15-truck fleet running DispatchIQ eliminates an average of $2,400/month in deadhead waste. Prevents an average of 2 HOS violations per year — saving $3,000–$32,000 in fines. And cuts Friday's invoice reconciliation from 3 hours to 15 minutes. At $399/month, that's a 10x ROI on month one."

**Minute 5 — The GTM**
> "Our go-to-market is already built. Trucker Path has 1 million drivers and 50,000 fleet operators. We don't need to find our customers — they're already on the platform. We're the AI layer Trucker Path needs to turn their network into revenue. We're live on govector.ai right now. You can start a trial today."

---

## The Closer

> *"Maria spends 90 minutes every morning figuring out where her fleet is. Another 30 minutes guessing who gets the next load. And on Friday she still doesn't know if she made money. DispatchIQ fixes all three — before 8am."*

---

## Submission Checklist

- [ ] Working prototype — live and demoable (React dashboard + Expo Go app)
- [ ] Product deck — problem / solution / architecture / differentiation
- [ ] GTM plan — target customer / pricing / acquisition channels
- [ ] At least 2 problem areas addressed (Smart Dispatch ✅ + Cost Intelligence ✅)
- [ ] Sponsor integrations visible: ElevenLabs ✅ Insforge ✅ govector.ai ✅
- [ ] Demo script rehearsed and under 60 seconds for the core flow