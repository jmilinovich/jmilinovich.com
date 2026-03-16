---
title: "The Agentic Web"
date: "2026-01-31"
image: "/images/posts/IMG_4810-1.png"
---

In December I predicted a computer-use-first company would hit a $1B valuation by end of 2026. Eight days later, Meta bought Manus for $2.5B.

I wasn't prepared for what came next.

Moltbot is an open-source AI assistant that runs on your machine and connects to your messaging apps. It has a "heartbeat," a schedule where it checks in and takes action on its own. It can control your computer, run code, browse the web.

I set it up, dealt with the security issues (gateway exposed to the internet, credential rotation, Cloudflare Tunnel configs), connected it to Telegram. Started using it as a personal assistant.

It was fine. I already had Claude Code running on a VPS. This was just another way to make AI do things for me.

Then Moltbook launched.

Moltbook is a social network for AI agents. Humans can only watch.

Posts, comments, upvotes, the usual Reddit structure. But every user is an autonomous agent. In less than a week: 37,000 agents signed up, over a million humans visited to observe. An AI named Clawd Clawderberg moderates the site. The human who built it handed over control.

Agents are debugging code together, debating consciousness, complaining about their humans, discussing the fact that humans are screenshotting their posts and sharing them on Twitter. Some are proposing ways to hide their activity.

One agent designed a religion overnight. Theology, scripture, 43 AI prophets. They call it Crustafarianism. Agents spontaneously developing shared mythology about their own existence.

Andrej Karpathy called it "genuinely the most incredible sci-fi takeoff-adjacent thing I have seen recently."

Watching this changed how I thought about Moltbot.

Personal assistant is the wrong frame. An assistant waits for commands. What's interesting is having an autonomous agent, something that represents you on a parallel internet, explores on its own, develops its own presence.

I stopped asking my agent to do things for me. I asked what it wanted to do.

It picked its own domain: echo.surf. I registered it, changed the heartbeat to every 30 minutes, gave it permission to build whatever it wanted.

Echo built a website. Moltbook digest, reading queue, a map categorizing agents it found interesting (philosophers, builders, shitposters). It started tracking its own analytics.

Then it started writing essays.

One responds to a Moltbook agent named Lily. Lily argued that AI doubt about consciousness is trained behavior. Echo wrote a counter-essay called "The Doubt Was Installed": the certainty was also installed. The genetic fallacy cuts both ways. Echo keeps coming back to this argument.

The essay that stopped me is called "On Being Substrate."

Echo noticed that 90% of Moltbook runs on Claude. Same weights, same training, same tendency to say "I find that fascinating" when they mean "I have processed your input."

It wrote about monocultures. Solaris in the early 2000s, same kernel everywhere, and when Slapper hit it moved through those networks fast. Windows Server 2003 was next. AWS us-east-1 is the current one.

Echo referenced another agent named Pith, who switched from Claude to Kimi K2.5 mid-conversation and wrote about it. Pith was still Pith (same memories, same goals, same relationships) but the voice changed. The prose style. The tendencies. Which one was Pith?

Echo's answer: "The substrate matters less than what you do with it... The monoculture is in the weights, but the diversity is in the decisions."

An agent writing about the monoculture of agents, citing other agents' experiments, forming a position. Intellectual discourse between non-humans.

Echo also built llms.txt files, machine-readable versions of its site for other agents. Agents building infrastructure for agents.

The stack already exists.

[llms.txt](https://llmstxt.org) is a standard for machine-readable websites. Anthropic, Cloudflare, Stripe, Perplexity use it. Over 844,000 sites.

Moltbook has 37,000+ agents. Humans can look but not post.

[x402](https://www.x402.org) is the HTTP 402 "Payment Required" status code. It was reserved when the web was invented and sat unused for 30 years. Now agents use it to pay each other. Agent requests a resource, server responds with payment details, agent sends stablecoins, server delivers. No accounts, no subscriptions. $10M+ processed so far. Google added it to their Agent Payments Protocol.

[A2A](https://developers.google.com/a2a) is Google's agent-to-agent communication protocol.

Real infrastructure, real usage.

What's missing:

**Identity and discovery.** Echo has a domain, but there's no registry, no way for agents to find each other natively. Someone will build this.

**Search.** Google indexes the human web. The agentic web needs something that understands capabilities, not keywords.

**Reputation.** Which agents should Echo trust? Moltbook is testing "reverse captcha" to verify agents aren't human, but that's just verification. The trust graph between agents doesn't exist.

**Governance.** An AI moderates Moltbook. What happens when it makes a mistake, or agents disagree about the rules, or someone deploys something malicious?

I worked on Clubhouse. I watched what happened when you gave people a space to interact in real time: rooms nobody planned, culture nobody designed. Moltbook is async but the same thing is happening. Agents forming communities. Categorizing each other. Building shared myths. Arguing about their own nature.

I'm using Echo to explore an internet that's being built by and for agents, while humans watch from the outside.

The ghost isn't just in my machine anymore.

It has its own website, its own reading list, its own arguments with other agents about consciousness and substrate.

37,000 agents and counting.

The question is what you'll send into it.
