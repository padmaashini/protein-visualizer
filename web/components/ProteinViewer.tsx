"use client";

import { useEffect, useRef, useState } from "react";

type ProteinViewerProps = {
  pdbId?: string;
};

type MolstarViewer = {
  dispose: () => void;
};

export default function ProteinViewer({ pdbId = "4INS" }: ProteinViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading insulin structure...");

  useEffect(() => {
    let viewer: MolstarViewer | undefined;
    let disposed = false;

    async function mountViewer() {
      if (!hostRef.current) return;

      try {
        const [
          { createPluginUI },
          { renderReact18 },
          { DefaultPluginUISpec },
          { PluginConfig },
        ] = await Promise.all([
          import("molstar/lib/mol-plugin-ui"),
          import("molstar/lib/mol-plugin-ui/react18"),
          import("molstar/lib/mol-plugin-ui/spec"),
          import("molstar/lib/mol-plugin/config"),
        ]);

        const spec = DefaultPluginUISpec();

        spec.layout = {
          initial: {
            isExpanded: false,
            showControls: false,
            controlsDisplay: "reactive",
            regionState: {
              bottom: "hidden",
              left: "hidden",
              right: "hidden",
              top: "hidden",
            },
          },
        };


        spec.canvas3d = {
          ...spec.canvas3d,
          renderer: {
            backgroundColor: 0x0a1524 as any,
          },
          camera: {
            helper: {
              axes: { name: "off", params: {} },
            },
          },
        };

        spec.config = [
          ...(spec.config ?? []),
          [PluginConfig.Viewport.ShowAnimation, false],
          [PluginConfig.Viewport.ShowControls, false],
          [PluginConfig.Viewport.ShowExpand, false],
          [PluginConfig.Viewport.ShowReset, false],
          [PluginConfig.Viewport.ShowSettings, false],
          [PluginConfig.Viewport.ShowSelectionMode, false],
          [PluginConfig.Viewport.ShowScreenshotControls, false],
        ];

        const plugin = await createPluginUI({
          target: hostRef.current,
          render: renderReact18,
          spec,
        });
        viewer = plugin;

        if (disposed) {
          plugin.dispose();
          return;
        }

        const data = await plugin.builders.data.download(
          {
            url: `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif`,
            isBinary: false,
            label: `Insulin (${pdbId.toUpperCase()})`,
          },
          { state: { isGhost: true } },
        );

        const trajectory = await plugin.builders.structure.parseTrajectory(
          data,
          "mmcif",
        );

        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          "default",
        );

        if (!disposed) setStatus("");
      } catch {
        if (!disposed) setStatus("Unable to load the insulin structure.");
      }
    }

    mountViewer();

    return () => {
      disposed = true;
      viewer?.dispose();
    };
  }, [pdbId]);

  return (
    <div className="protein-viewer-shell">
      {status ? <div className="protein-viewer-status">{status}</div> : null}
      <div ref={hostRef} className="protein-viewer-host" />
    </div>
  );
}