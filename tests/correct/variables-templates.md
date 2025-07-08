# Variables and Templates

```mermaid
flowchart TD
  %% Node Definitions
  START("/Welcome/")
  GREETING["/Hello {$user_name}! How can I help you?/"]
  PROCESS["/Processing with {template_name}/"]
  CHOICE{"What would you like to do?"}
  TEMPLATE["/((main-menu))/"]
  END["/Thank you for using our service/"]
  
  %% Connections
  START == "User starts" ==> GREETING
  GREETING == "User responds" ==> PROCESS
  CHOICE == "Show menu" ==> TEMPLATE
  TEMPLATE == "Process" ==> END
```

This flowchart demonstrates variables {$variables} and templates ((templates)) in node definitions. 