import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Andrew Li Resume",
};

export default function ResumePage() {
  return (
    <main className="h-screen bg-void">
      <iframe
        src="/Andrew_Li_Resume.pdf"
        title="Andrew Li Resume"
        className="h-full w-full border-0"
      />
    </main>
  );
}
