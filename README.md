# HackerLake

HackerLake is a graphical knowledge-map learning product for CTF and security study.

This repository currently contains the first SIer-style design package:

- `docs/design/*.xlsx`: basic design, detailed design, screen design, data design, API design, auth design, and test design.
- `docs/uml/*.puml`: PlantUML source files used as the diagram source of truth.
- `tools/build-design-docs.ps1`: deterministic Excel workbook generator.
- `tools/validate-design-docs.ps1`: lightweight local validation for generated artifacts.

The v1 product scope is guest access, an interactive knowledge map, and deep Web-domain learning nodes. Authentication is documented as a future extension for design learning, not as v1 implementation scope.
