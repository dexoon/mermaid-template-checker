# Multi-line Labels

```mermaid
flowchart TD
  %% Node Definitions
  START("/Welcome/")
  MESSAGE["/This is a multi-line message/"]
  CHOICE{"Please choose an option"}
  END["/Thank you/"]
  
  %% Connections
  START == "Begin" ==> CHOICE
  CHOICE == "Option 1" ==> END
  CHOICE == "Option 2" ==> START
```

This flowchart demonstrates proper node and connection syntax as specified in the template rules. 