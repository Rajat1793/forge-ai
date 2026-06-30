# Demo Script — Forge AI

> Target length: **4 minutes** (max 5). Record at 1080p, screen + webcam picture-in-picture (small, bottom-right).
>
> Tools: OBS Studio (free) or Loom · Mic: any decent USB · Browser: clean profile, no extensions, full-screen.

---

## Pre-record Checklist

- [ ] Seed the prod DB with the bundled demo workspace:
      `pnpm db:seed` — creates the "Acme Inc" workspace with one feature, PRD,
      tasks, a fake repo, an open PR, and an AI review with one BLOCKING issue.
- [ ] Have a real test GitHub repo ready (e.g. `forge-demo-app`) with at least one branch you can PR from
- [ ] Pre-write the feature request text (below) — don't type live
- [ ] Have the PR diff ready in a separate branch (commit ahead of time so you can `gh pr create` instantly)
- [ ] Razorpay test card handy: `4111 1111 1111 1111`, any future expiry, any CVV
- [ ] Close Slack, email, notifications
- [ ] Open browser tabs in this order: Forge AI app, GitHub repo, Inngest dashboard, Razorpay test dashboard
- [ ] Test mic levels (`-12 dB` to `-6 dB` peak)
- [ ] Practice run end-to-end once

---

## Script

### [0:00 – 0:20] Hook & Intro
> *Screen: landing page, hero visible*
>
> "Hey, I'm [name]. This is **Forge AI** — an AI-powered product delivery platform built for the ChaiCode hackathon. It takes a feature request from idea all the way to production, with AI doing the heavy lifting at every step, and humans staying in control of the final call.
>
> Let me show you the full loop in under four minutes."

### [0:20 – 0:40] Sign in & Workspace
> *Action: click "Sign in" → GitHub OAuth → land on dashboard*
>
> "Auth is powered by BetterAuth. I sign in with GitHub, and I'm dropped into my workspace — Acme Inc. Multi-tenant SaaS, role-based access — I'm the owner. Dashboard shows open features, PRs awaiting review, and my AI credit balance."

### [0:40 – 1:10] Submit a Feature Request (Phase 1 — Discovery)
> *Action: click "New Feature Request" → paste prepared text*
>
> Prepared text:
> ```
> Title: Add dark mode toggle
> Description: Users on our customer portal have asked for a way to switch
> between light and dark themes. Right now it's light-only.
> Source: Customer email
> ```
>
> "I submit a real customer request — vague on purpose. Watch what happens."
>
> *Action: page auto-refreshes, AI clarifying message appears within 5-10s*
>
> "An Inngest workflow fires immediately. Our discovery agent — running on `gpt-4o-mini` via the Vercel AI SDK — reads the request and decides it needs more context. It asks me three follow-up questions: should the toggle persist per user, should it respect system preference, and which pages are in scope.
>
> *Action: reply briefly to all three in the chat thread*
>
> "I answer. The agent re-evaluates and marks the request as **ready for PRD**."

### [1:10 – 1:50] PRD Generation (Phase 1 → 2)
> *Action: click "Generate PRD"*
>
> "Now another Inngest function kicks off — `prd.generate`. It uses `gpt-4o` with `streamObject` so I can watch the PRD render section by section in real time."
>
> *Screen: PRD streams in — problem statement, goals, non-goals, user stories, acceptance criteria, edge cases, success metrics*
>
> "Every field is validated against a strict Zod schema. No free-form mess. I can edit any section inline, and every save creates a new version I can diff later.
>
> Looks good — I hit **Approve PRD**."

### [1:50 – 2:20] Task Generation & Kanban (Phase 2)
> *Action: click "Generate Tasks"*
>
> "The approved PRD becomes the input to `tasks.generate`. Out come engineering tasks — frontend, backend, QA — each with its own acceptance criteria and a rough estimate."
>
> *Screen: Kanban board, tasks in Backlog column*
>
> "I can drag tasks across columns. Five tasks here — I approve the plan."

### [2:20 – 2:55] GitHub Integration & PR (Phase 3)
> *Action: switch tab → connected repo "forge-demo-app" → run `gh pr create` from pre-staged branch*
>
> "I've already connected a GitHub repo through OAuth — Forge AI used Octokit to install a webhook on the fly. Now I open a PR from a branch where I've implemented the feature.
>
> The PR description mentions `Closes FORGE-12` — that's how we link code to the task."
>
> *Action: switch back to Forge AI feature page → status flips to "In Review" within seconds*
>
> "GitHub fires a webhook to our endpoint — HMAC-verified — and triggers the `pr.ai_review` Inngest function."

### [2:55 – 3:35] AI Review Loop (Phase 4)
> *Screen: Forge AI review page populating live · then switch to GitHub PR tab showing AI's posted review*
>
> "Our QA agent loads the PRD, the tasks, the PR diff, and a repo summary. Then `gpt-4o` produces a structured review — issues classified as BLOCKING or NON-BLOCKING, by category: PRD coverage, security, performance, edge case, code quality.
>
> Here it flagged one BLOCKING issue: the theme isn't persisting because we forgot to write to localStorage. It cites the PRD acceptance criterion, explains why, and suggests a code fix.
>
> That review is also posted directly on the GitHub PR via Octokit — inline comments where the line is known."
>
> *Action: push a fix commit from terminal (`git commit --amend; git push -f` or new commit)*
>
> "I push a fix. The webhook fires again, Inngest re-reviews, and this time… clean. Status flips to **Ready for Human**."

### [3:35 – 4:00] Human Approval, Ship, Billing
> *Action: switch to "Final Approval" page · click Approve · click Ship*
>
> "Human reviewer page bundles everything — PRD, tasks, every AI review in history, outstanding issues, the PR link. I approve. Ship button enables. I ship — that fires a GitHub release tag back via Octokit.
>
> *Action: switch to Billing page briefly*
>
> "Billing is real — Razorpay Checkout, test mode here. Every AI review debited one credit from the ledger. Free plan, Pro, Team — usage metered.
>
> *Action: back to dashboard, show feature card now marked SHIPPED*
>
> "That's the full loop. **Feature Request → Clarify → PRD → Tasks → Code → AI Review → Fixes → Re-Review → Human Approval → Shipped.** Built on Next.js, tRPC, Prisma, BetterAuth, Inngest, Vercel AI SDK, Octokit, and Razorpay. Code is on GitHub, app is live — links in the description.
>
> Thanks ChaiCode, Hitesh Sir, and Piyush for the hackathon. Builder mode on."

---

## Post-record Checklist

- [ ] Trim dead air at start/end
- [ ] Add a 1-second title card: "Forge AI — ChaiCode Hackathon 2026"
- [ ] Add caption with name + repo URL + live URL on screen for last 5 seconds
- [ ] Export 1080p, H.264, < 100 MB
- [ ] Upload to YouTube as **Unlisted** (not Private — judges can't view Private)
- [ ] Add description with: repo link, live URL, tech stack, your socials
- [ ] Add timestamps in description (Phase 1 at 0:40, etc.)
- [ ] Paste video URL into README.md "Demo video" section
- [ ] Final social post: link video + repo + live URL, tag ChaiCode + Hitesh + Piyush, hashtag `#chaicode`, end with `Builder Mode On | iPhone Giveaway Hackathon`

---

## Backup Plan (if something breaks live)

- **AI is slow / times out:** Have a pre-recorded 10-second clip of the PRD streaming, drop it in during edit
- **GitHub webhook fails:** Have a "Manually trigger review" button wired up that calls the same Inngest event
- **Razorpay sandbox down:** Skip the billing demo, mention it as implemented and show the Billing page UI only
- **Internet flakes:** Run the demo against `localhost:3000` with Inngest dev server; mention this in description as "local-first demo for stability"
