# Chat Bot Flow

```mermaid
flowchart TD
  %% Node Definitions
  START("/Welcome/")
  PHOTO["//photo// [View]"]
  CHOICE{"What type of content did you send?"}
  END["/Thank you/"]
  
  %% Connections
  START == "User starts" ==> PHOTO
  PHOTO == "[View]" ==> CHOICE
  CHOICE == "Text" ==> END
  CHOICE == "Photo" ==> END
```

This flowchart demonstrates all node types and connection patterns from the template rules. 