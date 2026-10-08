import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <span className="text-lg font-bold text-primary">FlashFlip</span>
      </header>
      <h1 className="text-2xl font-bold">เก่งขึ้นอีกนิดทุกวัน</h1>
      <Card>
        <CardHeader>
          <CardTitle>วันนี้มี 0 คำรอให้ฝึก</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="h-12 w-full text-base" disabled>
            เริ่มฝึกเลย
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
