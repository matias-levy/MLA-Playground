import { Snapshot } from "@/components/Snapshots";

export function createSafeAudioNode<T extends AudioNode>(
  ctx: AudioContext | null,
  factory: (ctx: AudioContext) => T
): T | null {
  if (!ctx) return null; // If no context, return null (e.g., during SSR)
  return factory(ctx);
}

export interface DummyModule {
  id: string;
  module: string;
  chain?: DummyModule[];
  chain1?: DummyModule[];
  chain2?: DummyModule[];
}

function findModuleInChain(
  chain: DummyModule[] | undefined,
  moduleId: string
): boolean {
  if (!chain) return false;

  return chain.some((module) => {
    if (module.id === moduleId) return true;

    const nestedChains = [module.chain, module.chain1, module.chain2].filter(
      (c): c is DummyModule[] => Array.isArray(c)
    );

    return nestedChains.some((nested) => findModuleInChain(nested, moduleId));
  });
}

export function isModuleUsedInSnapshots(
  moduleId: string,
  snapshots: Snapshot[]
): boolean {
  return snapshots.some((snapshot) =>
    findModuleInChain(snapshot.content?.chain, moduleId)
  );
}

export function getModulesUsedInChain(chain: DummyModule[]): DummyModule[] {
  const modulesUsedInChain: DummyModule[] = [];
  for (const module of chain) {
    if (module.id) {
      modulesUsedInChain.push(module);
      modulesUsedInChain.push(...getModulesUsedInChain(module.chain ?? []));
      modulesUsedInChain.push(...getModulesUsedInChain(module.chain1 ?? []));
      modulesUsedInChain.push(...getModulesUsedInChain(module.chain2 ?? []));
    }
  }

  // Remove duplicates
  return modulesUsedInChain.filter(
    (module, index, self) => index === self.findIndex((t) => t.id === module.id)
  );
}
