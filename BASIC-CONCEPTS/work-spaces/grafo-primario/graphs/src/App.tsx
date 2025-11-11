// src/App.tsx
// Purpose: Minimal Cytoscape "Hello, World" in React + TypeScript.
// Comment style: written as if I were submitting to my professor.

import { useEffect, useRef } from "react";
import cytoscape, { type Core } from "cytoscape";
// import { ejemplo1Elements } from "./graphs/example1";
import { model1Elements } from "./graphs/modelo1";

export default function App() {
  // The DIV ref where Cytoscape will render the graph
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Cytoscape instance using the preset layout
    // so that node positions are taken from the elements definition.
    const cy = cytoscape({
      container: containerRef.current,
      elements: model1Elements,
      // elements: ejemplo1Elements,
      layout: { name: "preset" }, // <- CLAVE: respeta position.x / position.y
      style: [
        {
          // Generic node style: show node id as label
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            shape: "rectangle",
          },
        },
        {
          // Edge style: draw directed edges with an arrow
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-fill": "filled",
          },
        },
      ],
    });

    cyRef.current = cy;

    // Cleanup to prevent memory leaks when the component unmounts
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Fixed height so the canvas is visible; no styling beyond this
  return <div ref={containerRef} style={{ width: "100%", height: 700 }} />;
}
