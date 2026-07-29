---
title: "2026: the year of autonomous computing"
date: "2025-12-22"

---

Last week I pointed [Claude Code](https://docs.anthropic.com/en/docs/claude-code) at my Dropbox, a graveyard of half-organized folders I'd ignored for years, and it fixed the whole thing in one shot. It didn't hand me a script to run; it ran the script itself, renamed the files, created the folders, and moved everything.

I'm a programmer, but I didn't write any code. I just told the AI what I wanted, and it operated my computer to make it happen.

A few months ago, I built a game for my daughter, modeled on Toodles from Mickey Mouse Clubhouse, the character who pops up with four tools for whatever situation Mickey is in. Then one afternoon, while she was playing it on my computer, I modified the game from my phone using my voice and watched her react to the changes in real time. I wasn't coding, just asking.

The real breakthrough is AI that uses computers.

Most people think code generation means building apps. The bigger story is personal utility: software you'd never build because it's not worth the time, but that AI can now build and run in minutes.

Organizing your Dropbox, cleaning out the 2,000 browser bookmarks you've accumulated since 2019, unsubscribing from every email list you forgot you joined, building a personal finance dashboard that actually tracks what you care about, writing docs from the 47 files sitting in your downloads folder.

These are chores, not apps: the backlog of "I should really fix that someday" that never gets done.

Andrej Karpathy [named it](https://x.com/karpathy/status/2002118205729562949): Claude Code is "a little spirit/ghost that 'lives' on your computer. This is a new, distinct paradigm of interaction with an AI."

He also thinks OpenAI got this wrong by focusing its Codex and agent efforts on cloud deployments, containers orchestrated from ChatGPT, instead of localhost. Cloud agents are sandboxed and generic. Local agents have your files, your context, and your tools.

What changed technically? Models can now observe state mid-task, reason about what they're seeing, and take corrective action. They don't just blindly run a script. Combined with much better code generation, you get AI that can operate a computer reliably enough to be useful, if not yet perfect.

[Anthropic](https://anthropic.com) is furthest ahead. They've built a full stack.

[File creation](https://www.anthropic.com/news/create-files) shipped in September. Claude runs code in a private environment to create Excel spreadsheets, PowerPoints, and PDFs directly from chat. Upload your raw data, describe what you want, get back a polished report.

Claude Code runs in your terminal (the command line interface developers use). It's composable, scriptable, and local: it sees your actual files and runs on your actual machine.

[Claude for Chrome](https://www.anthropic.com/news/claude-for-chrome) just expanded to all paid users. It navigates sites, fills forms, and manages your calendar and email.

The pieces connect, so you can build in the terminal, test in the browser, and debug across both.

Others are building for everyone.

[Manus](https://manus.im) gives you an AI agent with its own computer. Tell it "create a competitive analysis deck for my pitch next week" and watch it research, write, and design slides. Tasks reportedly cost about $2 each.

The founder of [Zo Computer](https://www.zo.computer/) pitches it as "AWS for my mom": his mother, a biologist running a research lab, uses it to manage her schedule and run code from her grad students, texting it like a personal assistant.

I've played around with both but haven't become a big user of either. They're early, but computer-using AI is becoming a product category.

I'm calling this **autonomous computing**: AI that lives on your machine, operates independently, and does real work in the background. It's a persistent process, not a chatbot you visit.

![Streams of light flowing between a phone, tablet, laptop, and TV in a living room at dusk while a person waters a plant](/images/posts/autonomous-computing-living-room.png)

*The original artwork for this post: the work moving between your devices while you do something else.*

Two predictions:

**By December 31, 2026, Anthropic, OpenAI, and Google will all ship consumer-facing computer use in their main products.** Not just APIs or developer tools: this becomes table stakes, the way voice assistants did a decade ago.

**By December 31, 2026, at least one computer-use-first company built for non-developers will reach a $1B+ valuation.** Manus and Zo are early candidates. Others will emerge.

Engineers have had this for a year. 2026 is when everyone else gets it.

The last few years of AI have been about AI that responds. You ask, it answers.

2026 is the year AI learns to operate. You describe what you want, and it does the work (clicking, typing, running, building) while you do something else.

The ghost is already in the machine. My Dropbox is organized and my daughter's game keeps evolving. The question is what you'll give it to do.
