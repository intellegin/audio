import { SliderCard } from "@/components/slider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { siteConfig } from "@/config/site";
import { getHomeData } from "@/lib/music-api";
import { cn } from "@/lib/utils";

const title = `Online Songs on ${siteConfig.name}: Download & Play Latest Music for Free`;

const description = `Listen to Latest and Trending Bollywood Hindi songs online for free with ${siteConfig.name} anytime, anywhere. Download or listen to unlimited new & old Hindi songs online. Search from most trending, weekly top 15, Hindi movie songs, etc on ${siteConfig.name}`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,

    url: "/",
    images: {
      url: `/api/og?title=${title}&description=${description}&image=https://graph.org/file/16937ebb693470d804f31.png`,
      alt: `${siteConfig.name} Homepage`,
    },
  },
};

export default async function HomePage() {
  let homedata;
  try {
    homedata = await getHomeData();
  } catch (error) {
    console.error("Error fetching home data:", error);
    // Return empty state on error to prevent hydration mismatch
    return (
      <div className="flex h-[calc(100vh-14rem)] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-heading text-2xl drop-shadow dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
          Welcome to {siteConfig.name}
        </h1>
        <p className="max-w-md text-muted-foreground">
          Unable to load music at this time. Please check your configuration.
        </p>
      </div>
    );
  }
  
  // Check if we have any data
  const entries = Object.entries(homedata || {});
  if (entries.length === 0) {
    return (
      <div className="flex h-[calc(100vh-14rem)] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-heading text-2xl drop-shadow dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl">
          Welcome to {siteConfig.name}
        </h1>
        <p className="max-w-md text-muted-foreground">
          The UI is ready! Connect your API to see content here.
        </p>
      </div>
    );
  }

  return entries.map(([key, section]) => {
    if ("random_songs_listid" in section || key === "discover") return null;
    
    // Skip sections with no data
    if (!section.data || section.data.length === 0) return null;

    return (
      <div key={key} className="mb-4 space-y-4">
        <header className="border-b pb-2">
          <h1 className="sr-only">{siteConfig.name} Homepage</h1>
          {/* 
          <h2 className="pl-2 font-heading text-2xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl lg:pl-0">
            {section.title}
          </h2> */}

          {section.subtitle && (
            <p className="pl-2 font-medium text-muted-foreground lg:pl-0">
              {section.subtitle}
            </p>
          )}
        </header>

        <ScrollArea>
          <div
            className={cn("flex sm:gap-2 xl:pb-6", {
              "grid grid-flow-col grid-rows-2 place-content-start": [
                "trending",
                "albums",
                "charts",
              ].includes(key),
            })}
          >
            {section.data.map(
              ({ id, name, url, subtitle, type, image, explicit }) => (
                <SliderCard
                  key={id}
                  name={name}
                  url={url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                  explicit={explicit}
                />
              )
            )}
          </div>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  });
}
