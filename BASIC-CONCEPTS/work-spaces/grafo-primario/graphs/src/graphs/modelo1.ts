// Definición de nodos y aristas del "Ejemplo 1" del cuaderno.
// Este objeto se puede pasar directamente a cytoscape({ elements }).

import { type ElementsDefinition } from "cytoscape";

export const model1Elements: ElementsDefinition = {
  nodes: [
    // ----- Nodo base (centro) -----
    {
      // Nodo base_roja: nodo central desde el cual salen o llegan las aristas dirigidas
      data: {
        id: "base_model",
        label: "Modelo de creación raíz",
        type: "primario",
      },
      position: { x: 120, y: 150 },
      style: { "background-color": "red" },
    },
    {
      // Nodo base_roja: nodo central desde el cual salen o llegan las aristas dirigidas
      data: { id: "a", label: "a", type: "primario" },
      position: { x: 900, y: 150 },
      style: {
        "background-color": "red",
      },
    },
  ],

  edges: [
    // // ----- Conexiones desde base_roja hacia a, b y c (dirigidas) -----
    // {
    //   data: { id: "base-a", source: "base_roja", target: "a" },
    // },
  ],
};
