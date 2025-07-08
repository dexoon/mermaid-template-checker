# Simple Flowchart

```mermaid
flowchart TD
  %% Node Definitions
  START("/Start/")
  DECISION{"Should we proceed?"}
  END["/End/"]
  
  %% Connections
  START == "Begin" ==> DECISION
  DECISION == "Yes" ==> END
  DECISION == "No" ==> START
```

This flowchart follows the template rules with proper node definitions and connections. 