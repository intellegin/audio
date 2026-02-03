import Link from "next/link";

import { siteConfig } from "@/config/site";
import { getFooterDetails } from "@/lib/music-api";
import { Icons } from "../icons";

export async function SiteFooter() {
  const footerDetails = await getFooterDetails();
  const { artist = [], actor = [], album = [], playlist = [] } = footerDetails;

  const footerLinks = [
    { title: "Top Artist", data: artist },
    { title: "Top Actors", data: actor },
    { title: "New Releases", data: album },
    { title: "Top Playlists", data: playlist },
  ];

  return (
    <footer className="border-t py-6 md:py-10">
      <div className="mx-auto w-full max-w-none px-5 text-sm sm:max-w-[90%] sm:px-0 2xl:max-w-7xl">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] items-stretch justify-between gap-y-10 sm:gap-x-6 md:flex md:flex-wrap">
          <div className="col-span-full flex justify-between md:flex-col md:justify-normal">
            <Link href="/" className="flex items-start">
              <Icons.Logo className="mr-1 h-5" />
              <span className="font-heading tracking-wide drop-shadow-md">
                {siteConfig.name}
              </span>
            </Link>
          </div>

          {footerLinks.map(({ title, data }) => (
            <div key={title} className="flex flex-col gap-2.5">
              <p className="text-sm font-semibold lg:text-sm">{title}</p>

              {data.length > 0 ? (
                <ul className="w-fit space-y-1">
                  {data.map(({ id, title, action }) => (
                    <li
                      key={id}
                      className="w-full text-xs text-muted-foreground hover:text-secondary-foreground"
                    >
                      <Link href={action.replace("featured", "playlist")}>
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No data available</p>
              )}
            </div>
          ))}
        </div>
      </div>

    </footer>
  );
}
