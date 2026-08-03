---
title: "Canva is one percent of the way there"
date: "2026-07-27"
---

**I spent three years inside the most ambitious company I've ever seen, and the way it works is a preview of how every company will soon have to work.**

The phrase you hear most inside Canva is *we're one percent of the way there*. Said casually and meant completely, it is also the largest thing I've ever heard a company say about itself. Mel Perkins was saying it when the company was a few hundred people. She was still saying it at five thousand people and a quarter of a billion users.

My three years there began in March 2023. I initially led Discovery, incubating much of what became [Magic Studio](https://www.canva.com/newsroom/news/magic-studio/), then ran the generative AI group that shipped [Canva AI](https://www.canva.com/newsroom/news/canva-create-2025/), and finally launched [Canva AI 2.0](https://www.canva.com/newsroom/news/canva-create-2026-ai/) as product lead in April 2026. I left the following month. Three roles and three org shapes in three years, all pointed at the same problem: **how fast good judgment can reach the work.** When the person with the clearest picture of the product decides something, how long until the thing being built reflects it? I'll come back to that, because it's about to be everyone's problem.

## It should not have worked

None of it makes sense without the origin story, which you've probably read: Perth, [the most isolated city in the world](https://techcrunch.com/2022/09/13/canva-moves-beyond-graphic-design-to-launch-a-visual-worksuite/); [more than a hundred investor rejections](https://www.lennysnewsletter.com/p/the-making-of-canva); Mel [learning to kitesurf](https://www.npr.org/2019/01/24/688299882/canva-melanie-perkins) to get in front of an investor. Two things came out of it. Profitability, because when capital is hard to get you build something that doesn't need it: Canva has been [profitable every year since 2017](https://sacra.com/c/canva/), and it once spent [two years rewriting its entire codebase](https://www.lennysnewsletter.com/p/the-making-of-canva) while shipping almost no new features, which you can only do if nobody is running out of runway. And a habit of deriving things from scratch, half a world away from whatever San Francisco considers normal.

People at Canva are cheerful in a way that might take an American a while to trust, and underneath the cheerfulness is the hardest-working group I've been around. I started calling it laid-back intensity, and I still don't have a better phrase. Nobody is stressed for show. Everybody is moving extremely fast.

## "Canvas Chef" becomes Canva AI

Canva is the only place I've worked where a document written before the company existed still functions as a spec. When thousands of people can predict what the founder would say, they stop needing to ask, and she gets to choose where to be involved rather than being the bottleneck everywhere.

In 2011, before there was a company, Mel made a deck for something called [Canvas Chef](https://nbt.substack.com/p/canva-original-deck). The pitch was that you could describe an idea and have it appear, designed, without knowing anything about design. Fifteen years later she stood on stage at Canva Create and [quoted her own deck back to the room](https://www.forbes.com.au/news/innovation/canva-create-2026-melanie-perkins-unveils-canva-ai-2-0-and-claude-design-deal/) while launching an AI that does exactly that.

![A slide from the original 2011 Canvas Chef pitch deck: an iPad mockup asking "What do you want to chef up?"](/images/posts/canvas-chef-2011.jpg)

*From the original 2011 Canvas Chef deck, via [NBT's archive of the pitch](https://nbt.substack.com/p/canva-original-deck).*

A spec like that never lets you feel finished. We shipped Canva AI, and within months the conversation was already about an agent that does the whole job, which is roughly what we announced a year later as Canva AI 2.0. **The target never stood still, because the ambition is genuine.** If the objective is to empower the world to design, then the world is large and design is most things, and there is no version of the job where you're done. Mel holds ambition at that size without ever letting it curdle into fantasy. I haven't seen anyone else manage it.

## The blank design

Mel is in all the details, and so is her cofounder Cliff Obrecht. Paul Graham named the pattern [founder mode](https://paulgraham.com/foundermode.html) in 2024, eleven years after Canva started running it, and the debate that followed gets stuck on whether a founder should be that involved. That's the boring half. **What's worth studying is what the involvement produces.**

On Canva AI 2.0 we were designing memory for the agent. What we brought to the review was a strong version of the pattern every assistant had converged on: remembered facts, stated back as a list. Mel's objection wasn't that it was wrong. Her word was techie: memory the way engineers understand memory.

So she opened a blank Canva design and started drawing.

What she prototyped in the room was a library. Not a list of remembered facts, but a shelf of books organized by category: the big events in your life, the campaigns you run, the things that are simply true about you. Then she pushed it into the onboarding, where a single button would read everything you had ever made in Canva and write an About Me document to seed the library on your first day. It shipped as the [Memory Library](https://www.canva.com/help/memory-library/), and the first book in it is called About Me. She didn't write a brief or ask for three options. She made the artifact herself, in the product, in front of the people who were going to build it.

The design we brought into that room was weeks of work, and it was good work. Ten minutes later it wasn't the plan anymore.

At most companies that pattern would be corrosive. The thing that keeps a team fast is believing that the work they're doing now is the work that ships, and every founder redraw takes a small bite out of that belief. At Canva the redraw gets celebrated instead, and the difference isn't luck. It's the expectation, set early and reinforced constantly, that the best idea can arrive at any moment and that a redraw is in service of the outcome, never anyone's ego. It still lands hardest on the layers between her and the team, and carrying the reasoning intact to the people who need it is their whole job.

## The harness

**Ambition that size doesn't run on inspiration. It needs machinery.** I think of the whole apparatus as a harness, a word borrowed from working with LLMs: the model (at Canva, Mel) makes the call, and the harness is everything around it, the context it's fed, the tools it can reach, the loops that let it see what happened and try again. Canva has been running that architecture on a person since long before anyone had a word for it. The 2011 deck is the context. The product itself is the tool. The reviews are the loop.

Reviews are structured so Mel is looking at the real artifact rather than a description of it, and teams are shaped so the surface she touches is where her judgment adds the most. None of it runs itself: people decide every week what reaches her and own everything that doesn't, and for three years that was a large part of my job. When the latency between her judgment and the work gets too high, Canva reorganizes: the org changes shape and the person doesn't. I never once thought the reorgs were arbitrary.

The bar the harness protects is hers: before Canva AI 2.0 shipped, Mel reviewed the product as its biggest power user and arrived with twenty slides of issues, down to the hover animation on a sidebar logo, and those twenty slides became a polish team for the final months. There's no fear in it, because nobody believes the standard is about them. She's hardest on her own work.

None of it holds without a second voice, and Cliff is that voice. He and Mel are married, they built a [$42 billion company](https://sacra.com/c/canva/) together, and he is one of the best operators I've ever seen. He'll say the thing he actually thinks in front of anyone, and on the occasions he and Mel read a decision differently, it gets worked through in the open rather than sanded down before the room. That's how a team learns how decisions really get made.

Canva's plan has two steps: become one of the most valuable companies in the world, then do the most good it can. Mel and Cliff have committed [more than 80% of their wealth](https://www.forbes.com.au/news/leadership/inside-billionaire-canva-cofounders-plan-to-give-away-their-fortune/), including 30% of the company, much of it to [handing unconditional cash to people in extreme poverty](https://www.canva.com/newsroom/news/give-directly-update-2025/), about the least self-flattering way to give money away that exists. It's the ambition pointed outward.

## Everyone's problem

For most of software history, the bottleneck was building. That constraint is dissolving, and when a working version of an idea takes an afternoon instead of a quarter, **the bottleneck moves to how fast good judgment can reach the work.** That's the problem I said I'd come back to, and it's the one Canva has been solving, without meaning to, since 2013.

I know because the loop eventually outran me. I was in California, everyone I worked with was in Sydney, and a move to Australia wasn't in the cards for our family. Coding agents compressed the distance between an idea and a working version far enough that a seventeen-hour gap became a place where decisions happened without me. It's the strongest evidence I have that everything I've described here is real.

A lot of companies are about to reach for founder mode and get the visible half, the boring part: the founder in the details, the reviews, the redrawn designs. That half is easy, and by itself it mostly makes a mess. The harness is the work, and nobody writes about it because it isn't a personality. There's no way to install a Melanie Perkins, but the harness can be copied, and so can deciding what the money is for before you have any of it.

Mel would say we're one percent of the way there. For a long time, I heard it as a way of keeping people hungry. I don't hear it that way anymore. It's just the truth.
