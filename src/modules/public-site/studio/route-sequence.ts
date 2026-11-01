export type RoutePhase = "idle" | "covering" | "covered" | "revealing";

/** Navigation is committed only after the outgoing view is fully covered. */
export class RouteSequence {
  phase: RoutePhase = "idle";
  begin(): boolean {
    if (this.phase !== "idle") return false;
    this.phase = "covering";
    return true;
  }
  covered(navigate: () => void): void {
    if (this.phase !== "covering") return;
    this.phase = "covered";
    navigate();
  }
  reveal(): boolean {
    if (this.phase !== "covered") return false;
    this.phase = "revealing";
    return true;
  }
  finish(): void {
    this.phase = "idle";
  }
}
