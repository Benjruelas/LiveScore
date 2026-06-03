import { RoundApp } from "@/components/round/round-app";
import { ToastProvider } from "@/components/notifications/toast-provider";

export default async function RoundPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <ToastProvider>
      <RoundApp slug={slug} />
    </ToastProvider>
  );
}
