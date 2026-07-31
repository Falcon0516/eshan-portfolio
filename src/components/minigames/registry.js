import QuizPopup from "./QuizPopup";
import DecryptPuzzle from "./DecryptPuzzle";
import RhythmTap from "./RhythmTap";
import Holocron from "./Holocron";
import CircuitSplice2D from "./circuitSplice/CircuitSplice2D";
import CircuitSplice3D from "./circuitSplice/CircuitSplice3D";
import MemoryLattice2D from "./memoryLattice/MemoryLattice2D";
import MemoryLattice3D from "./memoryLattice/MemoryLattice3D";
import SignalLock from "./signalLock/SignalLock";
import TerminalBreach from "./terminalBreach/TerminalBreach";

export const MINIGAME_REGISTRY = {
  quiz:      { view2d: QuizPopup,       view3d: QuizPopup },
  decrypt:   { view2d: TerminalBreach,  view3d: TerminalBreach },
  rhythm:    { view2d: SignalLock,      view3d: SignalLock },
  holocron:  { view2d: Holocron,        view3d: Holocron },
  circuit:   { view2d: CircuitSplice2D, view3d: CircuitSplice3D },
  lattice:   { view2d: MemoryLattice2D, view3d: MemoryLattice3D },
};
