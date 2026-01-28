"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { CopyIcon, GlobeIcon, RefreshCcwIcon } from "lucide-react";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { Image } from "@/components/ai-elements/image";
import { Weather, type WeatherAtLocation } from "@/components/weather";

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) {
    return null;
  }
  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};

const models = [
  {
    name: "xAI: Grok 4.1 Fast",
    value: "x-ai/grok-4.1-fast",
  },
  {
    name: "Google: Gemini 2.5 Flash",
    value: "google/gemini-2.5-flash",
  },
  {
    name: "Google: Gemini 2.5 Flash Image (Nano Banana)",
    value: "google/gemini-2.5-flash-image",
  },
  {
    name: "DeepSeek: DeepSeek V3.2",
    value: "deepseek/deepseek-v3.2",
  },
];

export default function ChatBotDemo() {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message, index) => (
              <div key={message.id} className="flex flex-col gap-2">
                {message.role === "assistant" &&
                  message.parts.filter((part) => part.type === "source-url")
                    .length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === "source-url",
                          ).length
                        }
                      />
                      {message.parts
                        .filter((part) => part.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source
                              key={`${message.id}-${i}`}
                              href={part.url}
                              title={part.url}
                            />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>{part.text}</MessageResponse>
                          </MessageContent>
                        </Message>
                      );
                    case "reasoning":
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === "streaming" &&
                            i === message.parts.length - 1 &&
                            message.id === messages.at(-1)?.id
                          }
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    case "file":
                      if (part.mediaType?.startsWith("image/")) {
                        const base64 = part.url.split(";base64,")[1];
                        return (
                          <Message
                            key={`${message.id}-${i}`}
                            from={message.role}
                          >
                            <MessageContent>
                              <Image
                                base64={base64}
                                mediaType={part.mediaType}
                                uint8Array={new Uint8Array([])}
                                alt="Generated image"
                              />
                            </MessageContent>
                          </Message>
                        );
                      }
                      return null;
                    case "tool-getWeather":
                      const { toolCallId, state } = part;
                      const widthClass = "w-[min(100%,450px)]";
                      if (state === "output-available") {
                        return (
                          <div
                            className={`${widthClass} mb-4`}
                            key={toolCallId}
                          >
                            <Weather
                              weatherAtLocation={
                                part.output as WeatherAtLocation
                              }
                            />
                          </div>
                        );
                      }
                      return null;
                    default:
                      return null;
                  }
                })}
                {message.role === "assistant" &&
                  index === messages.length - 1 && (
                    <Message from={message.role}>
                      <MessageActions>
                        <MessageAction
                          onClick={() => regenerate()}
                          label="Retry"
                        >
                          <RefreshCcwIcon className="size-3" />
                        </MessageAction>
                        <MessageAction
                          onClick={() =>
                            navigator.clipboard.writeText(
                              message.parts
                                .filter((part) => part.type === "text")
                                .map((part) => part.text)
                                .join(""),
                            )
                          }
                          label="Copy"
                        >
                          <CopyIcon className="size-3" />
                        </MessageAction>
                      </MessageActions>
                    </Message>
                  )}
              </div>
            ))}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4"
          globalDrop
          multiple
        >
          <PromptInputHeader>
            <PromptInputAttachmentsDisplay />
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent className="w-50">
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? "default" : "ghost"}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem
                      key={model.value}
                      value={model.value}
                    >
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
