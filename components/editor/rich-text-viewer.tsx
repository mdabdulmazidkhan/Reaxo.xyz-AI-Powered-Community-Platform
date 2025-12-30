"use client"

import { cn } from "@/lib/utils"

interface RichTextViewerProps {
  content: string
  className?: string
}

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
        "prose-p:leading-7",
        "prose-a:text-primary prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
        "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-4",
        "prose-img:rounded-lg prose-img:my-4",
        "prose-ul:list-disc prose-ol:list-decimal",
        "[&_iframe]:rounded-lg [&_iframe]:my-4 [&_iframe]:w-full [&_iframe]:aspect-video",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
