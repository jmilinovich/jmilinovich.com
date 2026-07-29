import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
    // page still builds and is reachable by URL, just kept off every listing
    unlisted: z.boolean().optional(),
    // Override the computed onward picks (src/lib/kinship.js) for this essay.
    // Absent on almost every post by design — only set where the contact sheet
    // showed computation genuinely losing. Unknown slugs fail the build.
    related: z.array(z.string()).optional(),
  }),
});

export const collections = { writing };
