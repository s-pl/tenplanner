import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>TenPlanner</CardTitle>
          <CardDescription>
            Plan your goals, track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Get Started</Button>
        </CardContent>
      </Card>
    </main>
  );
}
