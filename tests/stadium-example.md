# Stadium Shaped Node Example

This file demonstrates the new stadium shaped node type for transitions to other FSM modules.

```mermaid
flowchart TD
%% Node Definitions
START("/Welcome to our service/")
MENU["/Please select an option/ [Settings] [Help] [[Back]]"]
SETTINGS(["Go to Settings Module"])
HELP(["Go to Help Module"])
END["/Thank you for using our service/"]

%% Connections
START == "User starts" ==> MENU
MENU == "[Settings]" ==> SETTINGS
MENU == "[Help]" ==> HELP
MENU == "[[Back]]" ==> END
SETTINGS == "User returns" ==> MENU
HELP == "User returns" ==> MENU
```

The stadium shaped nodes (SETTINGS and HELP) represent transitions to other FSM modules. 