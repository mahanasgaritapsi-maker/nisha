import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium text-neutral-500">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      </CardContent>
    </Card>
  );
}
