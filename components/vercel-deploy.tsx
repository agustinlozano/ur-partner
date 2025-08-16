import { cn } from "@/lib/utils";
import { NextJsIcon, VercelIcon, ServerlessIcon } from "./icons";
import s from "./footer.module.css";

export function VercelDeploy() {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-300",
        s.vercelDeploy
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          <div
            className={cn(
              "rounded-full p-2 flex items-center justify-center",
              s.vercelIcon
            )}
          >
            <a
              href="https://nextjs.org/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Next.js website"
              className={cn("inline-flex", s.iconLink)}
            >
              <NextJsIcon className="h-5 w-5" />
            </a>
          </div>
          <div
            className={cn(
              "rounded-full p-2 flex items-center justify-center",
              s.vercelIcon
            )}
          >
            <a
              href="https://vercel.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Vercel website"
              className={cn("inline-flex", s.iconLink)}
            >
              <VercelIcon className="h-5 w-5" />
            </a>
          </div>
          <div
            className={cn(
              "rounded-full p-2 flex items-center justify-center",
              s.vercelIcon
            )}
          >
            <a
              href="https://serverless.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Serverless Framework"
              className={cn("inline-flex", s.iconLink)}
            >
              <ServerlessIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
