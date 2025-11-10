// src/App.tsx
// Purpose: Minimal Cytoscape "Hello, World" in React + TypeScript.
// Comment style: written as if I were submitting to my professor.

import { useEffect, useRef } from "react";
import cytoscape, { type Core } from "cytoscape";
import { ejemplo1Elements } from "./graphs/example1";

export default function App() {
  // The DIV ref where Cytoscape will render the graph
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Cytoscape instance with the smallest possible graph
    const cy = cytoscape({
      container: containerRef.current,
      elements: ejemplo1Elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(id)",
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
  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: 700, backgroundColor: "red" }}
    />
  );
}

// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import "./App.css";

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   );
// }

// export default App;
