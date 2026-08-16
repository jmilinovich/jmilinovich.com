---
title: "Design isn't verifiable"
date: "2026-08-14"
---

In fifth grade, in 1999, I made a picture of myself leaning against a Lamborghini.

I did it in MS Paint, pixel by pixel, cutting myself out of one photo and setting myself against another, because I didn't know there was another way to do it. It's the first thing I made that I was proud of. That summer I learned Photoshop and FrontPage, then Flash, which was the first time I understood that the thing I made could include what happened after someone clicked it. By seventh grade I was laying out yearbook pages in Illustrator and InDesign. I got into architecture school on a photography portfolio and spent most of it in AutoCAD and Rhino. I learned Figma in 2018. I've made almost everything in Canva for the last three years.

Every one of those tools took the part that had been hard and made it not hard, and I don't remember mourning any of it. Photoshop's magic wand did in a click what I'd spent a weekend doing by hand.

I've been thinking about that sequence because of a hat. The hat says DESIGN IS DEAD. It's real merch, from a pop-up in Brooklyn earlier this year, and the people buying it are people who design for a living. The joke lands because there's something real underneath it.

But design is two things wearing one name. There's the artifact, which is the file, the comp, the deliverable, the part everyone can see and therefore the part everyone measures. And there's the judgment that produced it. **Three separate things are happening to the artifact right now, and not one of them is happening to the judgment.**

## The checkable parts go first

A machine can take over any part of the work where we can check the answer, which is not the same as the part that's easy or the part that's boring.

At the bottom are the things with a number behind them. Contrast has a number, [4.5 to 1](https://webaim.org/projects/million/) for normal text. Spacing on a grid has a number. Whether a color is in the palette is a lookup, and whether the built thing matches the file is a diff. That layer is gone: contrast checking now happens [inside CSS itself](https://www.smashingmagazine.com/2026/05/building-self-correcting-color-systems-contrast-color/), and design systems ship with [token drift detection](https://techglock.com/blog/ai-in-design-what-actually-ships-in-mid-2026-and-what-still-falls-apart) that catches a hardcoded hex before it reaches an engineer. Above that sit the things you check against a rubric instead of a formula, like platform conventions, voice across forty screens, whether every state in a flow can be reached and escaped. No equation, but a written standard and a patient reader, and a model is a very patient reader. Above that is the empirical layer, does it convert and can people finish the task, always verifiable in principle and always too slow in practice, and there's now [a research literature on using models as synthetic users](https://arxiv.org/pdf/2606.05697) to run it before a human sees anything.

<figure style="margin:3.2rem 0;">
<svg viewBox="0 0 575 244" role="img" aria-labelledby="stack-t stack-d" style="width:100%;height:auto;">
<title id="stack-t">The verifiability stack</title>
<desc id="stack-d">Four layers of design work stacked vertically. The three lower layers have measures behind them and are hatched to show how thoroughly each has been automated, densest at the bottom. The top layer, which has no measure, is empty. A line marks the frontier between them, and an arrow shows it climbing.</desc>
<defs>
<pattern id="vs-hatch-dense" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="var(--ink)" stroke-width="1"/></pattern>
<pattern id="vs-hatch-mid" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="var(--ink)" stroke-width="1"/></pattern>
<pattern id="vs-hatch-sparse" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="20" stroke="var(--ink)" stroke-width="1"/></pattern>
</defs>
<g font-family="'Berkeley Mono', ui-monospace, monospace" font-size="11" fill="var(--muted)" text-anchor="end">
<text x="155" y="44">no measure yet</text>
<text x="155" y="108">empirical</text>
<text x="155" y="156">rule-checkable</text>
<text x="155" y="204">measurable</text>
</g>
<g stroke="var(--hairline)" fill="none" stroke-width="1">
<path d="M168,14 V72 H540 V14"/>
<rect x="168" y="88" width="372" height="40"/>
<rect x="168" y="136" width="372" height="40"/>
<rect x="168" y="184" width="372" height="40"/>
</g>
<g fill="url(#vs-hatch-sparse)" stroke="none"><rect x="168" y="88" width="372" height="40"/></g>
<g fill="url(#vs-hatch-mid)" stroke="none"><rect x="168" y="136" width="372" height="40"/></g>
<g fill="url(#vs-hatch-dense)" stroke="none"><rect x="168" y="184" width="372" height="40"/></g>
<path d="M348,20 L354,10 L360,20" stroke="var(--muted)" stroke-width="1" fill="none"/>
<line x1="168" y1="80" x2="540" y2="80" stroke="var(--sig)" stroke-width="1.5"/>
<text x="532" y="64" font-family="'Berkeley Mono', ui-monospace, monospace" font-size="10" fill="var(--sig)" text-anchor="end">the frontier</text>
<path d="M558,214 V34" stroke="var(--sig)" stroke-width="1" fill="none"/>
<path d="M553,42 L558,32 L563,42" stroke="var(--sig)" stroke-width="1" fill="none"/>
</svg>
<figcaption style="font-family:'Berkeley Mono',ui-monospace,monospace;font-size:1.15rem;color:var(--muted);letter-spacing:0.02em;margin-top:1rem;">Hatching is how thoroughly a layer has been automated. The frontier climbs, and the band above it has no ceiling.</figcaption>
</figure>

So the frontier climbs. But look at what it's climbing on. **Every measure was authored by somebody with taste, and then frozen.**

4.5 to 1 isn't a fact about human vision. It's a judgment somebody made and wrote down, and the only reason a machine can enforce it is that the judgment already happened. The eight-point grid is a decision. A design system is crystallized taste, shipped as a constraint so nobody has to have the taste again. Before Canva AI 2.0 shipped, [Mel Perkins arrived at a review with twenty slides of issues](https://mili.dev/writing/canva-is-one-percent-of-the-way-there/), down to the hover animation on a sidebar logo. Timing and spacing are measurable in principle, but nobody had written that particular measure, so no linter caught it and it took a person with a standard in her head to see it. Then it became a rule, and now it's beneath anyone's attention.

## Then the style goes

The same thing happens to whole visual languages, and much faster than it used to.

Skeuomorphism ran the better part of two decades before [flat design arrived at scale in 2013](https://www.nngroup.com/articles/skeuomorphism/); six years after that somebody coined [neumorphism](https://en.wikipedia.org/wiki/Neumorphism), a portmanteau of *neo* and *skeuomorphism*, which rose and fell inside about two years. I've said this out loud enough times that I should write it down: every style gives birth to its successor while it's still peaking. A style converges, its rules become writable, writable becomes checkable, checkable becomes cheap, and once anyone can produce a thing it stops distinguishing anything. The style dies of its own legibility, and the next one is born in the wings out of that exhaustion.

<figure style="margin:3.2rem 0;">
<svg viewBox="0 0 575 172" role="img" aria-labelledby="loop-t loop-d" style="width:100%;height:auto;">
<title id="loop-t">How a style dies of its own legibility</title>
<desc id="loop-d">A closed loop of six stages. A style converges, its rules become writable, writable becomes checkable, checkable becomes cheap, cheap means it stops distinguishing anything, and the next style is born in the wings, which converges in turn.</desc>
<g font-family="'Berkeley Mono', ui-monospace, monospace" font-size="11" fill="var(--ink)" text-anchor="middle">
<text x="70" y="52">converges</text>
<text x="200" y="52">writable</text>
<text x="335" y="52">checkable</text>
<text x="460" y="52">cheap</text>
<text x="400" y="132">stops distinguishing</text>
<text x="140" y="132">born in the wings</text>
</g>
<g stroke="var(--ink)" stroke-width="1" fill="none">
<path d="M106,48 H161"/><path d="M156,44 L162,48 L156,52"/>
<path d="M233,48 H293"/><path d="M288,44 L294,48 L288,52"/>
<path d="M371,48 H431"/><path d="M426,44 L432,48 L426,52"/>
<path d="M483,48 H528 V128 H472"/><path d="M478,124 L471,128 L478,132"/>
<path d="M328,128 H208"/><path d="M214,124 L207,128 L214,132"/>
<path d="M78,128 H22 V48 H26"/><path d="M21,44 L27,48 L21,52"/>
</g>
</svg>
<figcaption style="font-family:'Berkeley Mono',ui-monospace,monospace;font-size:1.15rem;color:var(--muted);letter-spacing:0.02em;margin-top:1rem;">The loop has no exit. Nothing outside it drives the next style; the exhaustion of the last one is the whole cause.</figcaption>
</figure>

[Paul Graham described the same convergence in March](https://paulgraham.com/brandage.html): branding is centrifugal, design is centripetal, because good design seeks the right answer and right answers converge. The stack says why. Design converges because its lower layers have measures, and brand is centrifugal because it lives where there is nothing to measure.

What's new is that a style no longer has to be written down to become free. A model doesn't need the rule for flat design, it needs ten million examples of flat design, and the regularity gets induced straight out of the distribution without a line of it ever being made explicit. Which inverts what popularity does. Popularity used to buy a style a long and profitable life. Now popularity is the input to the machine that commoditizes it, because a style has to be nearly everywhere before it can be absorbed. The only thing standing between distinctive and free is training lag, and I don't know what continual learning does to that number, but there's only one direction it can move it.

Which explains something everyone has noticed. A model's default aesthetic is the average of whatever was peaking when it was trained, so the thing you get when you accept the first answer is, by construction, the converged style sitting at the top of a curve that's already dying. When people say something looks AI-generated, what they're recognizing is that average, the mean of the last peak. A person who accepted the same default would produce the same look.

## And maybe the artifact itself

The first two are cycles, and I expect to watch both of them run again. The third isn't a cycle, because it depends on the cost of building the thing itself, and that cost keeps falling.

I majored in architecture, and the thing about an architectural model is that it never becomes the building. It's made of different material. You can iterate on it for a year and somebody still has to pour concrete, and the concrete costs a thousand times more than the model and cannot be undone. That gap isn't a convention anyone chose. It's physics, and it's why architectural drawing has survived every tool that arrived to replace it, including the two I learned.

Software has no such gap. A prototype and a product are made of the same material. The only reason we ever built a separate representation is that writing the code was expensive, so it was cheaper to push a rectangle around a canvas than to build the thing and look at it. Every design tool I've used was born into a world where that ratio was enormous, and it isn't enormous now. I wrote in 2025 about [the sequence collapsing](https://mili.dev/writing/creative-compression-2/), spec to wireframe to prototype to build. I framed that as a story about speed, and I'd frame it now as a story about what the stages were ever for. I learned to code in 2011, and in the last year I've shipped more of it than in the thirteen years before, most of it described to a model rather than typed.

So the real question isn't the one printed on the hat. It isn't whether a machine can do design. **It's whether the design artifact survives when the prototype can just be the product.** Any discipline organized around producing a representation of a thing should be nervous when the thing itself gets cheap.

## What none of it touched

Set the three side by side and they turn out to be one event. **In every case what got automated was a judgment somebody already made, and never a judgment being made now.** The contrast rule was somebody's decision before it was a linter. Flat design was somebody's rebellion before it was a training distribution. And the mockup was never valuable because it was cheaper than the product; it was valuable because it was a place to hold something still and argue about it, lossy on purpose, leaving out everything you aren't deciding so you can decide one thing.

That need doesn't go away when building gets cheap. It gets sharper, because now you can commit to six versions before lunch, and six running versions is not the same as knowing which one is right.

Which is the position Mel was in on that same product. We brought her a memory design matching the pattern every assistant had converged on, a list of remembered facts stated back to you. Her objection was one word. *Techie.* Then she opened a blank Canva design and drew a library instead. No test would have caught the original; it passed every check we had. It was the wrong idea, and it took a person to know that.

That's the sense in which design isn't verifiable. The artifact increasingly is. The judgment can't be, because verifying something means checking it against a known good, and judgment is the thing that decides what the known good is.

## Where this goes

Judgment is only automatable in the past tense, so the value of being able to produce an artifact is falling toward zero while the value of being able to judge one doesn't move. That isn't a stable position to occupy, because judgment has to attach to a specific open question, and the open questions keep moving. The work is wherever nobody has decided yet, and nobody has settled how affordances work when the interface is [assembled fresh at runtime](https://www.eleken.co/blog-posts/generative-ui), or how you show which agent is acting and when in a system where [several work at once](https://uxmag.com/articles/secrets-of-agentic-ux-emerging-design-patterns-for-human-interaction-with-ai-agents), or what a correction looks like when the system already acted on your behalf while you weren't watching.

There's a hole in this argument that I can't close, and if you're early in this career it's the thing to be asking about. Judgment isn't innate. It comes from reps, from making the artifact badly, watching it fail in front of someone, and adjusting. That apprenticeship is exactly what's being automated. **So the mechanism that produces the taste machines can't replace is itself the thing getting removed.** I don't know what replaces it, and I notice that most of us saying designers will be fine are people who already got our reps.

What goes away is the handoff. An artifact gets made, frozen, and passed to somebody else to rebuild from scratch, and that ritual was a workaround for code being expensive. What replaces it is a bigger job. Something still has to hold a running thing still, put versions beside each other, and give people somewhere to argue, and doing that to live software is harder than doing it to a picture of software. Which leaves the question I find more interesting than anything else happening right now, and which nobody has answered: what is a design tool for, when the prototype is the product?

## The picture in your head

The Lamborghini picture was bad. The edges were rough, the lighting didn't match, and I was clearly standing in a different room than the car. What I learned that year wasn't MS Paint. It was that you could have a picture in your head and get it out, and that getting it out was worth doing badly for a while.

Every tool since has been a faster way to do that. Not one of them has told me what the picture should be, and I'm not sure I'd know either if I hadn't spent 1999 doing it one pixel at a time.
