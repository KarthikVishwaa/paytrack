"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A once-a-day welcome. The first time the app opens on a given date it shows a
 * personal greeting and a motivational note tied to keeping the project's money
 * honest, then steps aside. The message rotates by the day of the year, so it
 * stays the same all day but feels fresh tomorrow.
 */

const MESSAGES = [
  "There's a particular kind of confidence that comes from knowing your numbers, and it has nothing to do with how much money you have — it comes from not being surprised. Teams rarely fail because a single expense was too big; they fail because a hundred small ones went unnoticed until the runway was gone. PayTrack is your early-warning system against that slow drift. Each time you record what the project bought, you trade a moment of mild inconvenience now for the enormous relief of never having to ask, later, where did it all go. Think of the budget not as a cage but as a map: it tells you how far you can travel before you need to refuel, and it lets you choose the route instead of stumbling onto it. Spend on the things that move the app forward — the server that keeps it online, the tool that makes the team faster, the campaign that brings the first real users — and be honest about the things that don't. That honesty is a gift to your future self. Today, add your entries, glance at what remains, and notice how much calmer the whole thing feels when it is written down. Clarity is a competitive advantage that costs nothing but attention, and you already have the attention. Point it here for a minute, then go build.",
  "Building an app is a long game, and long games are won by people who keep score. That is really all PayTrack asks of you: keep score, honestly, one entry at a time. It is tempting to think tracking money is the boring part, the chore you will get to later — but later is exactly where budgets go to die. The teams that thrive are not the ones with the most cash; they are the ones who always know how much they have and where it is going. When every member can see the same numbers, trust replaces suspicion and decisions get faster. Nobody has to wonder whether the project can afford the next step, because the answer is right there, updated and shared. So treat each expense you log as a message to the whole team: here is what we chose, here is what it cost, here is what is left. That transparency is what turns a group of people into a team that can be trusted with real money. Before you start, remember why you are doing this — not to restrict the work, but to protect it, to make sure a good idea does not run out of road before it gets its chance. Log today's spending, check the runway, and give your future self one less thing to worry about. Small acts of discipline, repeated, are how ambitious things actually get finished.",
  "Money is just stored decisions — every amount in this budget is something the team chose to value, and PayTrack simply makes those choices visible so you can tell the deliberate ones from the accidental ones. The goal was never to spend nothing; it is to spend on purpose. A dashboard full of honest numbers is worth more than any forecast built on hope, because it tells you the truth about the project you actually have, not the one you wish you had. When you know your real burn rate you can plan like an adult: extend the runway when things are tight, invest boldly when momentum is real, and never be blindsided by a bill you could have seen coming. That is the quiet power of tracking — it turns anxiety into information. Today, take a minute to record what was spent and why. Give each entry a clear name, put it in the right category, and let the totals do their work. You will be surprised how a few seconds of honesty compound into weeks of peace of mind. The best-run projects are not the ones that never spend; they are the ones that never lose track. You are building that habit right now, and it will outlast this app and serve every project you touch after it. Go on — the numbers are waiting, and they are firmly on your side.",
  "You cannot manage what you refuse to measure, and PayTrack is your measuring tape for the one resource this project cannot manufacture more of on demand — its money, and through it, its time. Every entry you make sharpens the picture of how much runway stands between today and the day the app has to stand on its own. That picture is not something to fear; it is something to use. When the numbers are clear, tough calls get easier and easy calls get faster. You can say yes to the tool that genuinely speeds the team up and no to the one that just looked nice in a demo, and you can do it without a knot in your stomach, because you will know exactly what each choice costs. Discipline here is not glamorous — it is a couple of honest entries and a glance at the totals. But stacked over a project's lifetime, those small acts are the difference between a team that runs out of road and one that reaches its destination with fuel to spare. So take the minute. Record what happened, name it plainly, and trust the totals. Then close this screen and go do the creative, difficult, wonderful work of building something people will use. The budget has your back now — that is the whole point of keeping it.",
  "Great products are built at the intersection of ambition and restraint, and this app is where your team practices the restraint. It is easy to dream big; PayTrack helps you fund the dream without bankrupting it. Every rupee logged here is a rupee that stops being a mystery, and mysteries are exactly what turn a healthy budget into a nasty surprise. The habit is simple and the payoff is huge: write down what you spent, put it where it belongs, and let the totals tell you the truth. Do that consistently and you will always know your runway, your monthly burn, and whether the next big idea is affordable or merely tempting. That knowledge is quietly heroic — it means no one on the team has to guess, no one has to worry in silence, and no decision gets made in the dark. Money handled in the open builds trust; money handled in the shadows erodes it, and you are choosing the open way one entry at a time. So before the day pulls you in a dozen directions, spend one minute here. Log the spending, check what is left, and notice the calm that comes from simply knowing. Then go build the thing you are actually here to build. The numbers will keep watch while you do — steady, honest, and always ready the moment you need them.",
  "Consistency is an unglamorous superpower, and you are using it right now just by showing up to check the numbers. Anyone can make a budget once; almost no one keeps it. The teams that do are the ones still standing when the exciting money runs out and only the disciplined money is left. PayTrack rewards that consistency by turning your steady little entries into something powerful — a live, honest picture of exactly where this project stands. No spreadsheets forgotten in a downloads folder, no arguments about what was spent, just shared and current truth. When the whole team can see the same runway, planning stops being a fight and starts being a conversation. You can decide together what is worth the money and what is not, and you can move fast because you are all looking at the same facts. That is what good financial hygiene really buys you: speed, trust, and the freedom to be bold when it counts. So take your minute. Record what was spent, name it clearly, and let the totals settle. It is a small ritual, but small rituals are how big things stay on track. The app you are building deserves a team that knows its numbers cold — and today, that team is you. Now close this, glance at your dashboard, and go make something worth every rupee it costs.",
  "Every rupee this project spends is a small vote for the future you are building, and today you get to cast a few more of them with intention. PayTrack exists for one quiet reason: money that is watched behaves better than money that is ignored. When you can see where the budget goes you stop guessing and start deciding. A subscription you forgot about, a service that quietly renews, a tool nobody uses anymore — these are the leaks that sink good ideas, and they only surface when someone bothers to look. That someone is you. The habit you are keeping here is not about being cheap; it is about being deliberate. A team that knows its runway sleeps better, argues less, and ships more, because the numbers stop being a source of fear and become a source of clarity. So before you dive in, take a breath. Look at what has been spent, look at what is left, and let the truth of it guide the next call you make. Small, honest entries add up to a project that can survive its own ambition. You do not need a perfect budget — you need an awake one. Log what you spent, name it plainly, and move on. The discipline is boring on any single day and decisive over a hundred of them. Let us make today one of the hundred.",
];

function messageForToday(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return MESSAGES[dayOfYear % MESSAGES.length];
}

export default function WelcomeSplash({ name }: { name: string }) {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [message, setMessage] = useState("");

  const firstName = name.split(" ")[0] || name;

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `paytrack-welcome-${today}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      return; // private mode — skip rather than nag
    }
    setMessage(messageForToday());
    setShow(true);
  }, []);

  function close() {
    setLeaving(true);
    setTimeout(() => setShow(false), 420);
  }

  if (!show) return null;

  return (
    <div
      className="bg-background fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 py-10"
      style={{ animation: leaving ? "fade 400ms ease forwards reverse" : "fade 500ms ease both" }}
      onClick={close}
      role="dialog"
      aria-label="Daily welcome"
    >
      {/* soft glow behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 30%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%)",
        }}
      />

      <div
        className="relative flex w-full max-w-md flex-col items-center text-center"
        style={{ animation: leaving ? undefined : "page-swap 560ms cubic-bezier(0.22,1,0.36,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="bg-primary text-primary-foreground animate-pop grid size-16 place-items-center rounded-2xl text-2xl font-bold shadow-lg">
          ₹
        </span>

        <p className="text-primary mt-6 flex items-center gap-1.5 text-sm font-semibold tracking-wide uppercase">
          <Sparkles className="size-4" /> PayTrack
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back, {firstName}
        </h1>

        <p className="text-muted-foreground mt-5 max-h-[38vh] overflow-y-auto text-[15px] leading-relaxed">
          {message}
        </p>

        <Button size="lg" className="mt-7 w-full" onClick={close}>
          Open PayTrack <ArrowRight />
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
