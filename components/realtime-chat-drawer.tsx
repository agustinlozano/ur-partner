"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MessageCircle, Send } from "lucide-react";
import { sleep } from "@/lib/utils";
import { useGameStore } from "@/stores/realtime-store";

interface ChatMessage {
  slot: "a" | "b";
  message: string;
  timestamp: number;
}

interface ChatDrawerProps {
  partner: { name: string; avatar: string };
  messages: ChatMessage[];
  mySlot: "a" | "b";
  onSendMessage: (message: string) => void;
}

export function ChatDrawer({
  partner,
  messages,
  mySlot,
  onSendMessage,
}: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { unreadMessagesCount, markMessagesAsRead } = useGameStore();
  console.log({ unreadMessagesCount });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      // Mark messages as read when chat opens
      markMessagesAsRead();
      sleep(300).then(() => {
        scrollToBottom();
      });
    }
  }, [isOpen, markMessagesAsRead]);

  useEffect(() => {
    console.log({ messages: messages.length });
    if (isOpen) {
      scrollToBottom();
      markMessagesAsRead();
    }
  }, [markMessagesAsRead, messages, isOpen]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <MessageCircle className="h-4 w-4" />
          Chat
          {unreadMessagesCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </div>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader className="max-w-xl w-full mx-auto flex gap-x-2">
          <SheetTitle>
            <div className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2" />
            <span className="font-medium font-mono">
              {partner.avatar} {partner.name}
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col max-w-xl w-full h-full mx-auto">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3 h-[250px]">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.slot === mySlot ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      msg.slot === mySlot
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs opacity-70">
                        User {msg.slot.toUpperCase()}
                      </span>
                      <span className="text-xs opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {msg.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="flex gap-2 py-4 z-10">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSend} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
