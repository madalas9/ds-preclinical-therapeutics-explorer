import { ChatContainer } from "./components/chat-container";

export const metadata = {
  title: "Ask | DS Preclinical Therapeutics Explorer",
  description:
    "Ask natural-language questions about Down syndrome preclinical research and get evidence-grounded answers with citations.",
};

export default function AskPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
      <ChatContainer />
    </main>
  );
}
