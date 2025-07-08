# Reply Buttons

```mermaid
flowchart TD
  %% Node Definitions
  WELCOME("/Welcome/")
  GREETING["/Hello! How can I help you?/"]
  CHOICE{{"What would you like to do?"}}
  PROCESS["/Processing your request/"]
  END["/Thank you for using our service/"]
  
  %% Connections
  WELCOME == "Start" ==> GREETING
  GREETING == "Continue" ==> CHOICE
  CHOICE == "[Continue]" ==> PROCESS
  PROCESS == "Complete" ==> END
```

This flowchart demonstrates reply buttons [[reply]] in node definitions. 