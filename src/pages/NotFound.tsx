import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <h1 className="text-4xl font-bold">404</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">الصفحة غير موجودة</p>
          <Button asChild className="w-full">
            <Link to="/">العودة إلى الرئيسية</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
