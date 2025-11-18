'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export interface SEOContentSectionProps {
  title: string
  content: string
  categorySlug?: string
}

export function SEOContentSection({ title, content }: SEOContentSectionProps) {
  return (
    <div className="py-8 border-t border-platinum-300">
      <div className="mx-auto max-w-[800px]">
        <Accordion type="single" collapsible defaultValue="">
          <AccordionItem value="seo-content" className="border-none">
            <AccordionTrigger className="flex justify-between items-center w-full py-4 text-lg font-semibold hover:no-underline">
              {title}
            </AccordionTrigger>
            <AccordionContent>
              <div
                className="prose prose-sm md:prose-base max-w-none"
                style={{
                  lineHeight: '1.8'
                }}
              >
                {/* Render HTML content safely */}
                <div
                  dangerouslySetInnerHTML={{ __html: content }}
                  className="space-y-4"
                />

                {/* Styled content */}
                <style jsx>{`
                  .prose :global(h2) {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--anthracite-700);
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                  }
                  .prose :global(h3) {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--anthracite-700);
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                  }
                  .prose :global(p) {
                    color: var(--nuanced-600);
                    margin-bottom: 1rem;
                  }
                  .prose :global(a) {
                    color: var(--orange-500);
                    text-decoration: none;
                  }
                  .prose :global(a:hover) {
                    text-decoration: underline;
                  }
                  .prose :global(ul),
                  .prose :global(ol) {
                    color: var(--nuanced-600);
                    margin-left: 1.5rem;
                    margin-bottom: 1rem;
                  }
                  .prose :global(li) {
                    margin-bottom: 0.5rem;
                  }
                `}</style>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
