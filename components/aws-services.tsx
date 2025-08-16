import { cn } from "@/lib/utils";
import { AWSIcon } from "./icons";
import s from "./footer.module.css";

export function AWSServices() {
  const services = ["API Gateway", "Lambdas", "DynamoDB", "S3"];

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-300",
        s.awsServices
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-full p-2 mt-1", s.awsIcon)}>
          <AWSIcon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className={cn("font-medium text-sm mb-2", s.awsTitle)}>
            AWS Services
          </span>
          <ul className="grid grid-cols-2 gap-1">
            {services.map((service, index) => {
              const urls: Record<string, string> = {
                "API Gateway": "https://aws.amazon.com/api-gateway/",
                Lambdas: "https://aws.amazon.com/lambda/",
                DynamoDB: "https://aws.amazon.com/dynamodb/",
                S3: "https://aws.amazon.com/s3/",
              };

              return (
                <li
                  key={index}
                  className={cn(
                    "text-xs px-2 py-0 bg-muted border rounded-sm truncate text-center",
                    s.awsService
                  )}
                  title={service}
                >
                  <a
                    href={urls[service] ?? "https://aws.amazon.com/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("block w-full h-full", s.link)}
                  >
                    {service}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
