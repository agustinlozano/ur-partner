import { cn } from "@/lib/utils";

export const UnsplashIcon = ({ className }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("size-4", className)}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 11h5v4h6v-4h5v9h-16zm5 -7h6v4h-6z" />
  </svg>
);

export const AWSIcon = ({ className }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("size-4", className)}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M17 18.5a15.198 15.198 0 0 1 -7.37 1.44a14.62 14.62 0 0 1 -6.63 -2.94" />
    <path d="M19.5 21c.907 -1.411 1.451 -3.323 1.5 -5c-1.197 -.773 -2.577 -.935 -4 -1" />
    <path d="M3 11v-4.5a1.5 1.5 0 0 1 3 0v4.5" />
    <path d="M3 9h3" />
    <path d="M9 5l1.2 6l1.8 -4l1.8 4l1.2 -6" />
    <path d="M18 10.25c0 .414 .336 .75 .75 .75h1.25a1 1 0 0 0 1 -1v-1a1 1 0 0 0 -1 -1h-1a1 1 0 0 1 -1 -1v-1a1 1 0 0 1 1 -1h1.25a.75 .75 0 0 1 .75 .75" />
  </svg>
);

export const NextJsIcon = ({ className }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("size-4", className)}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 15v-6l7.745 10.65a9 9 0 1 1 2.255 -1.993" />
    <path d="M15 12v-3" />
  </svg>
);

export const VercelIcon = ({ className }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("size-4", className)}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M11.143 3.486a1 1 0 0 1 1.714 0l9 15a1 1 0 0 1 -.857 1.514h-18a1 1 0 0 1 -.857 -1.514z" />
  </svg>
);

export const ServerlessIcon = ({
  className,
}: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="800"
    height="800"
    viewBox="0 0 32 32"
    className={cn("size-4", className)}
  >
    <path
      d="M2 22.419h4.956L5.42 27H2Zm0-8.709h7.875L8.34 18.29H2ZM2 5h10.794l-1.535 4.581H2Zm15.679 0H30v4.581H16.143Zm-4.455 13.291 1.536-4.581H30v4.581Zm-1.383 4.128H30V27H10.305Z"
      fill="currentColor"
      // style="fill:#fd5750;fill-rule:evenodd"
    />
  </svg>
);
