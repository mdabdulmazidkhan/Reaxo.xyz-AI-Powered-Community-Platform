import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { SearchResults } from "@/components/search-results"

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <SearchResults />
        </Suspense>
      </main>
    </div>
  )
}
