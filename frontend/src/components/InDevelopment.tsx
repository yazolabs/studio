import { Card } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";

interface InDevelopmentProps {
  message?: string;
}

const InDevelopment = ({ message = "Esta página ainda está em desenvolvimento." }: InDevelopmentProps) => {
  return (
    <div className="p-6">
      <Card className="p-6">
        <h1 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <TriangleAlert className="w-7 h-7" />
          Atenção!
        </h1>
        <p className="text-muted-foreground">{message}</p>
      </Card>
    </div>
  );
};

export default InDevelopment;
