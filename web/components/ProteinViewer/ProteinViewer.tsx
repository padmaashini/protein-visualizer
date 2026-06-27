"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import styles from "./ProteinViewer.module.css";

type HexColor = `#${string}`;

type ProteinViewerProps = {
  pdbId?: string;
  /** Raw structure text (e.g. PDB from a folding model). Takes priority over pdbId. */
  structureData?: string;
  structureFormat?: "pdb" | "mmcif";
  backgroundColor?: HexColor;
  /** Multiplier for the structure's fitted radius; smaller values zoom in. */
  zoom?: number;
};

type MolstarViewer = {
  dispose: () => void;
};

export default function ProteinViewer({
  pdbId = "4INS",
  structureData,
  structureFormat = "pdb",
  backgroundColor = "#0a1524",
  zoom = 0.9,
}: ProteinViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading structure...");

  useEffect(() => {
    let viewer: MolstarViewer | undefined;
    let disposed = false;

    async function mountViewer() {
      if (!hostRef.current) return;

      setStatus("Loading structure...");

      try {
        const [
          { createPluginUI },
          { renderReact18 },
          { DefaultPluginUISpec },
          { PluginConfig },
          { Color },
          { StructureSelectionQueries },
          { StructureQuery, StructureSelection },
        ] = await Promise.all([
          import("molstar/lib/mol-plugin-ui"),
          import("molstar/lib/mol-plugin-ui/react18"),
          import("molstar/lib/mol-plugin-ui/spec"),
          import("molstar/lib/mol-plugin/config"),
          import("molstar/lib/mol-util/color"),
          import("molstar/lib/mol-plugin-state/helpers/structure-selection-query"),
          import("molstar/lib/mol-model/structure/query"),
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
            backgroundColor: Color(Number.parseInt(backgroundColor.slice(1), 16)),
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

        const data = structureData
          ? await plugin.builders.data.rawData(
              { data: structureData, label: "Folded structure" },
              { state: { isGhost: true } },
            )
          : await plugin.builders.data.download(
              {
                url: `https://files.rcsb.org/download/${pdbId.toUpperCase()}.cif`,
                isBinary: false,
                label: `Structure ${pdbId.toUpperCase()}`,
              },
              { state: { isGhost: true } },
            );

        const trajectory = await plugin.builders.structure.parseTrajectory(
          data,
          structureData ? structureFormat : "mmcif",
        );

        await plugin.builders.structure.hierarchy.applyPreset(
          trajectory,
          "default",
        );

        // Frame the camera on the polymer fold only. Using the full visible
        // bounding sphere lets scattered solvent/heteroatoms inflate the radius
        // inconsistently between structures, so a shared zoom never aligns them.
        const structure =
          plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj
            ?.data;

        const polymer = structure
          ? StructureSelection.unionStructure(
              StructureQuery.run(
                StructureSelectionQueries.polymer.query,
                structure,
              ),
            )
          : undefined;

        if (plugin.canvas3d) {
          plugin.canvas3d.requestCameraReset({
            durationMs: 0,
            snapshot: (scene, camera) => {
              const sphere =
                polymer && polymer.elementCount > 0
                  ? polymer.boundary.sphere
                  : scene.boundingSphereVisible;
              return camera.getFocus(sphere.center, sphere.radius * zoom);
            },
          });
        }

        if (!disposed) setStatus("");
      } catch {
        if (!disposed) setStatus("Unable to load the protein structure.");
      }
    }

    mountViewer();

    return () => {
      disposed = true;
      viewer?.dispose();
    };
  }, [backgroundColor, pdbId, structureData, structureFormat, zoom]);

  return (
    <div
      className={styles.shell}
      style={{ "--viewer-background": backgroundColor } as CSSProperties}
    >
      {status ? <div className={styles.status}>{status}</div> : null}
      <div
        ref={hostRef}
        className={styles.host}
        aria-label={`Protein structure viewer for ${pdbId.toUpperCase()}`}
      />
    </div>
  );
}
