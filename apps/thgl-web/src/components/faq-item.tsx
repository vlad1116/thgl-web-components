import { Card, CardContent } from "@repo/ui/controls";
import { type ReactNode } from "react";

interface FAQItemProps {
  question: string;
  answer: string | ReactNode;
}

export function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-2">
        <h3 className="font-semibold text-lg">{question}</h3>
        {typeof answer === "string" ? (
          <p className="text-sm text-muted-foreground">{answer}</p>
        ) : (
          <div className="text-sm text-muted-foreground">{answer}</div>
        )}
      </CardContent>
    </Card>
  );
}
