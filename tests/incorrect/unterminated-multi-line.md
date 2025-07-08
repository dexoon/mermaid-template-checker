# Unterminated Multi-line Node

```mermaid
flowchart TD
%% Node Definitions
START("Welcome to our
service
MESSAGE["This message is missing closing bracket"]

%% Connections
START == "User begins" ==> MESSAGE
```

This flowchart has an unterminated multi-line node definition that should be flagged as an error. 