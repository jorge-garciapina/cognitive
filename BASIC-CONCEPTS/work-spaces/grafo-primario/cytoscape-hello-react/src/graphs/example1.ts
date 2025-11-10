// Definición de nodos y aristas del "Ejemplo 1" del cuaderno.
// Este objeto se puede pasar directamente a cytoscape({ elements }).

import { type ElementsDefinition } from "cytoscape";

export const ejemplo1Elements: ElementsDefinition = {
  nodes: [
    // ----- Nodo base (centro) -----
    {
      // Nodo base_roja: nodo central desde el cual salen o llegan las aristas dirigidas
      data: { id: "base_roja", label: "base_roja", type: "primario" },
      position: { x: 120, y: 150 },
    },

    // ----- Nodos a la derecha de base_roja -----
    {
      // Nodo a: situado a la derecha y ligeramente abajo de base_roja
      data: { id: "a", label: "a", type: "primario" },
      position: { x: 210, y: 130 },
    },
    {
      // Nodo b: situado a la derecha y más abajo
      data: { id: "b", label: "b", type: "primario" },
      position: { x: 210, y: 160 },
    },
    {
      // Nodo c: situado a la derecha y un poco más abajo
      data: { id: "c", label: "c", type: "primario" },
      position: { x: 210, y: 190 },
    },

    // ----- Nodos a la izquierda de base_roja -----
    {
      // Nodo n1: arriba-izquierda
      data: { id: "n1", label: "n1", type: "primario" },
      position: { x: 40, y: 130 },
    },
    {
      // Nodo n2: abajo-izquierda
      data: { id: "n2", label: "n2", type: "primario" },
      position: { x: 40, y: 190 },
    },
    {
      // Nodo n3: centro-izquierda
      data: { id: "n3", label: "n3", type: "primario" },
      position: { x: 40, y: 160 },
    },
  ],

  edges: [
    // ----- Conexiones desde base_roja hacia a, b y c (dirigidas) -----
    {
      // Arista dirigida base_roja -> a
      data: { id: "base-a", source: "base_roja", target: "a" },
    },
    {
      // Arista dirigida base_roja -> b
      data: { id: "base-b", source: "base_roja", target: "b" },
    },
    {
      // Arista dirigida base_roja -> c
      data: { id: "base-c", source: "base_roja", target: "c" },
    },

    // ----- Conexiones desde n1, n2, n3 hacia base_roja (dirigidas) -----
    {
      // Arista dirigida n1 -> base_roja
      data: { id: "n1-base", source: "n1", target: "base_roja" },
    },
    {
      // Arista dirigida n2 -> base_roja
      data: { id: "n2-base", source: "n2", target: "base_roja" },
    },
    {
      // Arista dirigida n3 -> base_roja
      data: { id: "n3-base", source: "n3", target: "base_roja" },
    },
  ],
};
