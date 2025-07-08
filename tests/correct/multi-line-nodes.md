# Multi-line Node Definitions

```mermaid
flowchart TD
  %% Node Definitions
  START("/Welcome/")
  MESSAGE["/This is a message that spans
  multiple lines/"]
  CHOICE{{"Please choose
  an option"}}
  END["/Thank you for
  using our service/"]
  
  %% Connections
  START == "Continue" ==> MESSAGE
  MESSAGE == "Next" ==> CHOICE
  CHOICE == "Option 1" ==> END
  CHOICE == "Option 2" ==> END
```

This flowchart demonstrates multi-line node definitions as specified in the template rules. 