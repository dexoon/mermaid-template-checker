# Mixed Button Types

```mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
GREETING["/Hello! How can I help you?/"]
CHOICE{"/text/What would you like to do?"}
PROCESS[/text/Processing your request/]
END["/text/Thank you for using our service"]

%% Connections
START == "User starts" ==> GREETING
GREETING == "User responds" ==> CHOICE
CHOICE == "[Continue] [[Reply]]" ==> START
PROCESS == "Request processed" ==> END
```

This flowchart has nodes with mixed button types which is not allowed. 