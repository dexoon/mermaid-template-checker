# Wrong Connection Syntax

```mermaid
flowchart TD
%% Node Definitions
START("Start")
END["End"]

%% Connections
START --> END
START == "Action" --> END
START -- "Action" ==> END
```

This flowchart uses incorrect connection syntax that doesn't match the template rules. 