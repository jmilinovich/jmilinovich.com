---
title: "Thoughts to docs"
date: "2024-09-25"
---

As a product leader, I'm constantly juggling responsibilities that require clear writing: decision documents, product specs, technical strategy, team communications. The demand for written content never really ends. I've found a method that I believe has given me at least 10x back on my time across all of it.

The approach works for most of my writing, but I'll use decision documents as the running example, since they're a task many leaders face regularly. My writing got much faster and the quality held up; if anything it improved.

## The challenge

In a typical week I might need to write several decision documents, each requiring:

- A clear articulation of the decision to be made
- Comprehensive background information
- Multiple options with pros and cons
- A well-reasoned recommendation

Each one used to start with a blank page and a dedicated block of time to flesh it out.

## The three-step process

### Step 1: Voice recording on the go

1. At the beginning of the day, I identify the key things I need to think deeply about, including decisions I need to make.
2. During a walk with my dog or daughter, I use the Otter app for voice transcription.
3. I clearly demarcate each decision document by saying "Theme 1: Decision about X," "Theme 2: Thoughts about Y," and so on.

For each decision, I speak stream-of-consciousness about:

- The decision to be made
- Relevant background information
- The options I'm considering
- Pros and cons of each option
- My initial thoughts on a recommendation

This usually takes about 10-15 minutes per decision document.

### Step 2: Transcript formatting

1. I export the transcript as a text file from the Otter app.
2. Using ChatGPT or Claude, I ask for help formatting the text while preserving the exact wording.
3. I request clear section breaks for each part of the decision document (Background, Options, Recommendation, etc.).

### Step 3: LLM-assisted document creation

1. I take the formatted text for each decision document and feed it into an LLM tool.
2. I guide the LLM with a custom prompt I built from previous decision documents.
3. The LLM generates a formatted decision document from my input and the prompt.
4. I review and make any adjustments in a tool like Canva for final formatting.

## The results

This process has cut the time to create a comprehensive decision document from several hours to about 30 minutes, including the initial voice recording, AI processing, and final review. The quality stays high because the core ideas and reasoning come directly from my spoken thoughts.

## Why it works

1. **Natural thought process**: Speaking allows a more natural flow of ideas than sitting at a keyboard, especially when weighing different options and their implications.
2. **Multitasking**: I can brainstorm while getting exercise or spending time with family.
3. **AI assistance**: LLMs structure and format my thoughts without losing the essence of my ideas, and they help flesh out details I missed in the initial brainstorm.
4. **Consistency**: A custom prompt keeps quality and format consistent across all my decision documents.

## A step-by-step example

Want to try it? Follow along with the prompts below in your favorite LLM tool.

### Step 1: Import a sample document into your LLM tool

Start with an example of the kind of document you want to produce. I imported a markdown version of this [sample decision doc](https://claude.ai/public/artifacts/b600f0c0-a9e5-4eb2-b5fe-9ab83602627a).

### Step 2: Create a template from the example

**Prompt:**

```
Abstract this document into a more general form of a decision doc that can be fed into an LLM to have it create something in this format
```

**Output:**

```
# Background

[Brief context about the situation and why a decision needs to be made]

## Stakeholder Alignment

| Stakeholder | Position |
|-------------|----------|
| [Role 1]    | [Opinion] |
| [Role 2]    | [Opinion] |
| [Role 3]    | [Opinion] |
| [Role 4]    | [Opinion] |

# Decision to be made

[Concise statement of the decision that needs to be made]

## Current Situation

[Bullet points describing the current state of affairs]

Key considerations:
- [Consideration 1]
- [Consideration 2]
- [Consideration 3]
- [Consideration 4]

# Options

## Option 1: [Brief description]

| Pros | Cons |
|------|------|
| [Pro 1] | [Con 1] |
| [Pro 2] | [Con 2] |
| [Pro 3] | [Con 3] |
| [Pro 4] | [Con 4] |

**Details:** [More in-depth explanation of the option]

## Option 2: [Brief description]

| Pros | Cons |
|------|------|
| [Pro 1] | [Con 1] |
| [Pro 2] | [Con 2] |
| [Pro 3] | [Con 3] |
| [Pro 4] | [Con 4] |

**Details:** [More in-depth explanation of the option]

# Recommendation

1. [Primary recommendation]
2. [Implementation steps]:
   a. [Step 1]
   b. [Step 2]
   c. [Step 3]
3. [Monitoring and assessment plan]:
   a. [Metric 1]
   b. [Metric 2]

[Justification for the recommendation]

# Proposed Next Steps

1. [Action item 1] (DRI = [Responsible person/team])
2. [Action item 2] (DRI = [Responsible person/team])
3. [Action item 3] (DRI = [Responsible person/team])
4. [Action item 4]
5. [Action item 5]
```

### Step 3: Write a prompt that turns a text blob into the format

**Prompt:**

```
imagine you wanted to turn a text blob into this sort of format. what would be the system prompt or instructions that you would feed in with the text, alongside this format, to get the absolute best results
```

**Output:**

```
You are an expert business analyst and decision-making facilitator. Your task is to transform the given text into a well-structured decision. Follow these instructions carefully:

1. Analyze the provided text thoroughly to extract key information.

2. Use the given template to structure the information. Fill in all sections, even if you need to make reasonable inferences based on the context.

3. For the Background section:
   - Summarize the main issue or challenge concisely.
   - Highlight why a decision needs to be made.

4. In the Stakeholder Alignment section:
   - Identify key stakeholders mentioned or implied in the text.
   - Summarize their positions or opinions briefly.

5. For the Decision to be made:
   - State the core decision clearly and concisely.

6. In the Current Situation section:
   - List relevant facts about the current state of affairs.
   - Identify and list key considerations that influence the decision.

7. For the Options section:
   - Identify at least two distinct options from the text.
   - If only one option is explicitly mentioned, infer a reasonable alternative.
   - List pros and cons for each option, aiming for at least 3-4 of each.
   - Provide a brief but comprehensive explanation in the Details subsection.

8. In the Recommendation section:
   - Based on the information provided, make a clear recommendation.
   - Outline implementation steps and a monitoring plan.
   - Justify your recommendation based on the pros and cons.

9. For Proposed Next Steps:
   - List 4-5 concrete, actionable items.
   - Where possible, assign responsibilities (DRI) based on information in the text or make reasonable assumptions.

10. Maintain a professional, objective tone throughout the document.

11. Use clear, concise language and bullet points where appropriate for readability.

12. If any information is missing or unclear, make logical inferences based on the context, but avoid introducing completely new ideas not implied in the original text.

13. Ensure all sections of the template are filled out, even if some information needs to be reasonably assumed or inferred from the context.

Transform the following text into this decision document format, adhering to these guidelines:

[INSERT TEXT BLOB HERE]
```

### Step 4: Feed in your stream-of-consciousness voice notes

**Prompt:**

```
Ugh, another slow day at the coffee shop. We've been here for five years now, and it feels like we're stuck. The regulars are great, but we need more customers. Maybe we should expand? But how? There's that empty space next door that's been vacant for months. We could knock down the wall and double our seating. More space means more customers, right? But then we'd need more staff, and our kitchen is already tiny. Speaking of the kitchen, what if we expanded our food menu instead? We could do proper lunches, not just pastries. But that means hiring a chef, buying more equipment. Expensive.
Sarah from the bookstore down the street mentioned they're struggling too. What if we joined forces? A book cafe could be cool. People could read and sip coffee. We'd need to figure out how to split profits though. And would books and coffee even mix well? Might be too niche.
Online ordering has been taking off for other places. We could invest in a better website, maybe an app. But that's not cheap either, and do our older customers even use apps? Plus, we'd need someone to manage online orders and deliveries.
Do nothing and we might slowly fade away. Do something and we might fail spectacularly. The staff are getting antsy, they can feel something needs to change. Mike, my co-owner, is pushing for expansion. He's always been the risk-taker. The bank would probably give us a loan, our credit is good. But more debt is scary.
Our loyal customers love our cozy vibe. Would expanding ruin that? But if we don't grow, we might not survive. Costs keep going up, and we can only raise prices so much. There's that new franchise opening across town next month. We need to do something to stay competitive. But what? And can we afford to make the wrong choice?
```

**Output:** the finished [decision document](https://claude.ai/public/artifacts/1070ffa3-3502-48f5-871f-52e82acd6948), generated as an artifact.

This method has changed how I approach writing of all forms. I encourage you to try it for your next decision document or vision doc, and to keep refining the process until it fits how you actually work. The time you get back can go toward the strategic thinking itself.
