import { cn } from "@/lib/utils";
import { MatrixBoard } from "./ui/matrix-board";
import { GithubRepo } from "./github-repo";
import { MadeInArgy } from "./made-in-argy";
import { AWSServices } from "./aws-services";
import { VercelDeploy } from "./vercel-deploy";
import s from "./footer.module.css";

export default function FooterContent() {
  return (
    <div className={cn("md:mx-auto mb-12 m-2 max-w-4xl sm:px-3", s.container)}>
      <GithubRepo />
      <MadeInArgy />
      <MatrixBoard
        className="p-2 sm:p-4 sm:mx-auto w-full"
        text="Front."
        title="Software Engineer"
        finalTitle="Frontend Engineer"
        description="Guy from Argentina 🇦🇷 doing software and AI stuff"
      />
      <AWSServices />
      <VercelDeploy />
    </div>
  );
}
