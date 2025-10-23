'use client';

import Workbench from '@/components/Workbench';
import AppLayout from '@/components/layout/AppLayout';
import ConfigPanel from '@/components/panels/ConfigPanel';
import { WorkbenchProvider, useWorkbench } from '@/components/WorkbenchProvider';

export default function Home() {
  return (
    <WorkbenchProvider>
      <AppLayout showSidebar={true} sidebarContent={<WorkbenchSidebar />}>
        <Workbench />
      </AppLayout>
    </WorkbenchProvider>
  );
}

// Sidebar content for workbench
function WorkbenchSidebar() {
  const { config, updateConfig, updateRAGConfig, updateMemoryConfig } = useWorkbench();

  return (
    <div className="h-full">
      <ConfigPanel
        config={config}
        onConfigChange={updateConfig as (updates: unknown) => void}
        onRAGConfigChange={updateRAGConfig as (updates: unknown) => void}
        onMemoryConfigChange={updateMemoryConfig as (updates: unknown) => void}
      />
    </div>
  );
}
