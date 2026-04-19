import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p className="text-slate-500">Page not found</p>
      <Link href="/"><a><Button>Go Home</Button></a></Link>
    </div>
  );
}
