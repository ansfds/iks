import { motion, useReducedMotion } from "framer-motion";

const transferLines = [
  { from: "right-[16%] top-[28%]", to: "left-[24%] top-[38%]", delay: 0 },
  { from: "right-[28%] top-[58%]", to: "left-[18%] top-[56%]", delay: 0.35 },
  { from: "right-[42%] top-[22%]", to: "left-[35%] top-[72%]", delay: 0.7 },
];

const currencies = ["USD", "EUR", "USDT", "CNY"];

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-[360px] w-full overflow-hidden lg:min-h-[520px]">
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_42%,rgba(68,148,255,0.30),rgba(3,24,56,0)_55%)]" />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.36),rgba(34,122,255,0.10)_36%,rgba(4,27,63,0.75)_72%)] shadow-[0_0_80px_rgba(59,130,246,0.32)] sm:h-[360px] sm:w-[360px]"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 54, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-[18%] rounded-full border border-sky-200/20" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-sky-200/20" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-sky-200/20" />
        <div className="absolute left-[8%] top-[32%] h-px w-[84%] rotate-12 bg-sky-200/20" />
        <div className="absolute left-[8%] top-[62%] h-px w-[84%] -rotate-12 bg-sky-200/20" />
      </motion.div>

      {transferLines.map((line, index) => (
        <div key={index} className={`absolute ${line.from} h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_20px_rgba(125,211,252,0.9)]`}>
          <motion.span
            className="absolute h-px w-36 origin-right bg-gradient-to-l from-cyan-200 to-transparent"
            animate={
              reduceMotion
                ? undefined
                : { scaleX: [0.2, 1, 0.2], opacity: [0.25, 0.9, 0.25] }
            }
            transition={{
              duration: 2.8,
              delay: line.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.span
            className={`absolute ${line.to} h-1.5 w-1.5 rounded-full bg-white`}
            animate={reduceMotion ? undefined : { opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 2.8, delay: line.delay, repeat: Infinity }}
          />
        </div>
      ))}

      {currencies.map((currency, index) => (
        <motion.div
          key={currency}
          className="absolute rounded-md border border-white/15 bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-md"
          style={{
            left: `${14 + index * 21}%`,
            top: `${index % 2 === 0 ? 18 : 72}%`,
          }}
          animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
          transition={{
            duration: 4 + index * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {currency}
        </motion.div>
      ))}

      <div className="absolute bottom-5 left-1/2 w-[78%] -translate-x-1/2 rounded-lg border border-white/10 bg-white/[0.08] p-4 text-white backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 text-xs text-sky-100/80">
          <span>مسارات تحويل عالمية</span>
          <span>تحديثات مباشرة من لوحة الإدارة</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-cyan-300 via-blue-400 to-white"
            animate={reduceMotion ? undefined : { x: ["100%", "-100%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
