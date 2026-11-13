import type { JSX } from "react";
import { Icon, type IconName } from "./Icons";
import { Sheet } from "./Sheet";

const STEPS: readonly { readonly icon: IconName; readonly title: string; readonly text: string }[] = [
  { icon: "swipe", title: "Swipe anywhere", text: "Flick any direction, even in the middle of a turn. Pac-Man never stops by himself." },
  { icon: "check", title: "Eat every dot", text: "Clear all 244 to finish the round. Fruit appears twice for bonus points." },
  { icon: "heart", title: "Gold orbs bite back", text: "Four big orbs turn ghosts blue. Eat them for 200, 400, 800, 1600." },
  { icon: "ghost", title: "Learn the ghosts", text: "Each one hunts differently. Open the Ghosts tab to see how." }
];

export function HowToSheet({ onClose }: { readonly onClose: () => void }): JSX.Element {
  return (
    <Sheet label="How to play" onClose={onClose}>
      <h2 className="sheet-title">How to play</h2>
      <ul className="howto">
        {STEPS.map(step => (
          <li key={step.title}>
            <span className="howto-icon"><Icon name={step.icon} size={22} /></span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-primary btn-block btn-large" onClick={onClose} autoFocus>Got it</button>
    </Sheet>
  );
}
