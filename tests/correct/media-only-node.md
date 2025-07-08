# Media Only Node

```mermaid
flowchart TD
  %% Node Definitions
  START("/Welcome/")
  PHOTO["//photo of me//"]
  VIDEO["//video tutorial//
  [Watch]"]
  END["/Thank you for using our service/"]
  
  %% Connections
  START == "Show photo" ==> PHOTO
  PHOTO == "Show video" ==> VIDEO
  VIDEO == "Complete" ==> END
```

This flowchart demonstrates Rectangle nodes with only media content (no text). 