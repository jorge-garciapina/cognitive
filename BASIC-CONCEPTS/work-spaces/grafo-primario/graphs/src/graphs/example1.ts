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
      style: { "background-color": "red" },
    },

    {
      data: { id: "ext1", label: "ext1", type: "primario" },
      position: { x: 270, y: 120 },
    },
    {
      data: { id: "ext2", label: "ext2", type: "primario" },
      position: { x: 270, y: 160 },
    },
    {
      data: { id: "ext3", label: "ext3", type: "primario" },
      position: { x: 270, y: 200 },
    },
    // ----- Nodos dependientes de base -----
    {
      data: { id: "a", label: "a", type: "primario" },
      position: { x: 210, y: 120 },
      style: { "background-color": "pink" },
    },
    {
      data: { id: "b", label: "b", type: "primario" },
      position: { x: 210, y: 160 },
      style: { "background-color": "pink" },
    },
    {
      data: { id: "c", label: "c", type: "primario" },
      position: { x: 210, y: 200 },
      style: { "background-color": "pink" },
    },
    // Layer 1
    {
      data: { id: "n1", label: "n1", type: "primario" },
      position: { x: 40, y: 130 },
      style: { "background-color": "green" },
    },
    {
      data: { id: "n2", label: "n2", type: "primario" },
      position: { x: 40, y: 170 },
      style: { "background-color": "green" },
    },
    {
      data: { id: "n3", label: "n3", type: "primario" },
      position: { x: 40, y: 210 },
      style: { "background-color": "green" },
    },
    // Layer 2
    {
      data: { id: "n4", label: "n4", type: "primario" },
      position: { x: 10, y: 300 },
      style: { "background-color": "green" },
    },
    {
      data: { id: "n5", label: "n5", type: "primario" },
      position: { x: 45, y: 300 },
      style: { "background-color": "green" },
    },
    {
      data: { id: "n6", label: "n6", type: "primario" },
      position: { x: 80, y: 300 },
      style: { "background-color": "green" },
    },
    // Layer 3
    {
      data: { id: "n7", label: "n7", type: "primario" },
      position: { x: 60, y: 350 },
      style: { "background-color": "green" },
    },
    {
      data: { id: "n8", label: "n8", type: "primario" },
      position: { x: 100, y: 350 },
      style: { "background-color": "green" },
    },
    // Layer 4
    {
      data: { id: "n9", label: "n9", type: "primario" },
      position: { x: 60, y: 450 },
      style: { "background-color": "green" },
    },
    {
      data: { id: "n10", label: "n10", type: "primario" },
      position: { x: 100, y: 450 },
      style: { "background-color": "green" },
    },
    {
      data: { id: "n11", label: "n11", type: "primario" },
      position: { x: 150, y: 450 },
      style: { "background-color": "green" },
    },
  ],

  edges: [
    // ----- Conexiones desde base_roja hacia a, b y c (dirigidas) -----
    {
      data: { id: "base-a", source: "base_roja", target: "a" },
    },
    {
      data: { id: "base-b", source: "base_roja", target: "b" },
    },
    {
      data: { id: "base-c", source: "base_roja", target: "c" },
    },

    // ----- Conexiones desde n1, n2, n3 hacia base_roja -----
    {
      data: { id: "n1-base", source: "n1", target: "base_roja" },
      classes: "undirected",
    },
    {
      data: { id: "n2-base", source: "n2", target: "base_roja" },
      classes: "undirected",
    },
    {
      data: { id: "n3-base", source: "n3", target: "base_roja" },
      classes: "undirected",
    },

    // ----- Conexiones desde a n3 -----
    {
      data: { id: "n4-n3", source: "n4", target: "n3" },
      classes: "undirected",
    },
    {
      data: { id: "n5-n3", source: "n5", target: "n3" },
      classes: "undirected",
    },
    {
      data: { id: "n6-n3", source: "n6", target: "n3" },
      classes: "undirected",
    },

    // ----- Conexiones desde a n6 -----
    {
      data: { id: "n7-n3", source: "n7", target: "n6" },
      classes: "undirected",
    },
    {
      data: { id: "n8-n3", source: "n8", target: "n6" },
      classes: "undirected",
    },

    // ----- Conexiones desde a n8 -----
    {
      data: { id: "n9-n8", source: "n9", target: "n8" },
      classes: "undirected",
    },
    {
      data: { id: "n10-n8", source: "n10", target: "n8" },
      classes: "undirected",
    },
    {
      data: { id: "n11-n8", source: "n11", target: "n8" },
      classes: "undirected",
    },

    // ----- external -----
    {
      data: { id: "ext1-a", source: "ext1", target: "a" },
      classes: "undirected",
    },
    {
      data: { id: "ext2-b", source: "ext2", target: "b" },
      classes: "undirected",
    },
    {
      data: { id: "ext3-b", source: "ext3", target: "c" },
      classes: "undirected",
    },
  ],
};
