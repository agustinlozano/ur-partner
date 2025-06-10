"use client";
// https://cruip-tutorials.vercel.app/cards-hover-effect/
import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

export function HoverCard() {
  return (
    <>
      <section className="grid md:grid-cols-3 gap-3 max-md:max-w-xs mx-auto ">
        <div
          className={cn(
            "group relative rounded-2xl border transition-all duration-500 ease-in-out",
            "bg-gradient-to-t from-amber-400/50 to-amber-200/50 dark:bg-gradient-to-t dark:from-amber-950/75 dark:to-amber-800/75",
            "hover:bg-amber-300/60 dark:hover:from-[#182135] dark:hover:to-[#080808]",
            "border-amber-400 dark:border-border",
            "before:absolute before:inset-0 before:bg-[url('/noise.gif')] before:opacity-5"
          )}
        >
          <div className="relative">
            <div className="px-6 py-5">
              <div
                className={cn(
                  "w-fit px-3 rounded-full text-sm py-1 mb-1 transition-all duration-500 ease-in-out",
                  "bg-background border text-foreground group-hover:bg-background/75 group-hover:text-primary"
                )}
              >
                online
              </div>
              <span className="text-lg group-hover:hidden inline-block font-semibold pt-2 text-foreground mb-1 transition-all duration-500 ease-in-out">
                Join a room
              </span>
              <span className="text-lg group-hover:inline-block hidden font-semibold pt-2 text-foreground mb-1 transition-all duration-500 ease-in-out">
                Make it online
              </span>
              <p className="text-sm text-muted-foreground">
                Create or join a room and play online with your partner
              </p>
            </div>
            <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-in-out ">
              <Image
                className="group-hover:opacity-0 transition-opacity duration-500  object-cover h-full m-0 p-0"
                src="/simplechartt.webp"
                width={350}
                height={240}
                alt="Card image 01"
              />
              <Image
                className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity  object-cover duration-300  h-full  m-0 p-0"
                src="/chartt.webp"
                width={350}
                height={240}
                alt="Card image 01 displaying on hover"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "group relative rounded-2xl border transition-all duration-500 ease-in-out",
            "bg-gradient-to-t from-purple-400/50 to-purple-200/50 dark:bg-gradient-to-t dark:from-[#171c35] dark:to-[#000000]",
            "hover:bg-purple-300/60 dark:hover:from-[#2b131e] dark:hover:to-[#141414]",
            "border-purple-400 dark:border-border",
            "before:absolute before:inset-0 before:bg-[url('/noise.gif')] before:opacity-5"
          )}
        >
          <div className="relative">
            <div className="px-6 py-5">
              <div
                className={cn(
                  "w-fit px-3 rounded-full text-sm py-1 mb-1 transition-all duration-500 ease-in-out",
                  "bg-blue-500 text-primary-foreground group-hover:bg-red-500 group-hover:text-primary-foreground"
                )}
              >
                fun
              </div>
              <span className="text-lg group-hover:hidden inline-block font-semibold pt-2 text-foreground mb-1 transition-all duration-500 ease-in-out">
                Have a good time
              </span>
              <span className="text-lg group-hover:inline-block hidden font-semibold pt-2 text-foreground mb-1 transition-all duration-500 ease-in-out">
                All together
              </span>
              <p className="text-sm text-muted-foreground">
                Have a good time with your special someone
              </p>
            </div>
            <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-in-out">
              <Image
                className="group-hover:opacity-0 transition-opacity duration-500"
                src="/chat_zinhdw.webp"
                width={350}
                height={240}
                alt="Card image 01"
              />
              <Image
                className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                src="/hide_chat_egk7h4.webp"
                width={350}
                height={240}
                alt="Card image 01 displaying on hover"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "group relative rounded-2xl border transition-all duration-500 ease-in-out",
            "bg-gradient-to-t from-green-400/50 to-green-200/50 dark:bg-gradient-to-t dark:from-[#050a0a] dark:to-[#051818]",
            "hover:bg-green-300/60 dark:hover:from-[#05070a] dark:hover:to-[#0b1a3b]",
            "border-green-400 dark:border-border",
            "before:absolute before:inset-0 before:bg-[url('/noise.gif')] before:opacity-5"
          )}
        >
          <div className="relative">
            <div className="px-6 py-5">
              <div
                className={cn(
                  "w-fit px-3 rounded-full text-sm py-1 mb-1 transition-all duration-500 ease-in-out",
                  "bg-emerald-800 text-primary border border-emerald-300"
                )}
              >
                discover
              </div>
              <span className="text-lg group-hover:hidden inline-block font-semibold pt-2 text-foreground mb-1 transition-all duration-500 ease-in-out">
                Your partner
              </span>
              <span className="text-lg group-hover:inline-block hidden font-semibold pt-2 text-foreground mb-1 transition-all duration-500 ease-in-out">
                As never before
              </span>
              <p className="text-sm text-muted-foreground">
                Find how your partner see you
              </p>
            </div>
            <div className="relative group-hover:-translate-y-2 transition-transform duration-500 ease-in-out">
              <Image
                className="group-hover:opacity-0 transition-opacity duration-500"
                src="/fullverificationtwo_fpi9eo.webp"
                width={350}
                height={240}
                alt="Card image 01"
              />
              <Image
                className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                src="/verification_iwnfmj.webp"
                width={350}
                height={240}
                alt="Card image 01 displaying on hover"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
