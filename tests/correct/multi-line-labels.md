# Multi-line Labels

```mermaid
flowchart TD
  %% Node Definitions
  START("/Welcome/")
  MESSAGE["/This is a multi-line message/"]
  CHOICE{{"Please choose an option"}}
  END["/Thank you for using our service/"]
  
  %% Connections
  START == "Continue" ==> MESSAGE
  MESSAGE == "Next" ==> CHOICE
  CHOICE == "Option 1" ==> END
  CHOICE == "Option 2" ==> END
```

This flowchart demonstrates proper node and connection syntax as specified in the template rules. 