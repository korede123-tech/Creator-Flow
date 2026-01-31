import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-[#1a1a1a] border-white/[0.08] text-white shadow-lg",
          title: "text-white text-sm font-medium",
          description: "text-slate-400 text-sm",
          success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          error: "bg-red-500/10 border-red-500/20 text-red-400",
          warning: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          info: "bg-sky-500/10 border-sky-500/20 text-sky-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
