Diagram Rules (Plain English)

    Blocks Structure

        Each diagram is split into two sections:

            Node Definitions (%% Node Definitions)

            Connections (%% Connections)

        These sections must be in this order.

    Node Definitions

        Each node (state) is defined on its own line.

        Node types and their appearance:

            Rectangled-circle: For initial node.
            Syntax: NODE_ID("Label")

            Rectangle: For user messages, buttons, or text.
            Syntax: NODE_ID["Label"]

            Diamond: For conditions or branching.
            Syntax: NODE_ID{"Label"}

            Circle: For transitions to other FSM modules.
            Syntax: NODE_ID(("Label"))

            Hexagon: For explicit branching/choice points.
            Syntax: NODE_ID{{"Label"}}

            Parallelogram: For function calls.
            Syntax: NODE_ID[/"Label"/]

        Labels must always be inside double quotes, even if they span multiple lines (the opening " is the first character inside the brackets, the closing " is the last thing before the bracket closes).

        No \n inside labels. Use real line breaks in the diagram code for multi-line text.

        Node definition lines must begin with the appropriate syntax and end with the corresponding closing bracket and quote.

        Rectangle Node definition Rules

            These nodes are message templates

            They consist of 3 parts (some are optional). first or second parts can be ommited, but not both. They should be ordered like this:

                - Text of a message or caption to media, which goes in slashes like /my verbose text/ or /my smart caption/. They can contain {$variables} and ((templates)). Like /((main-menu))/ or /Hello {$user}/. This can be multi line

                - Media description, which goes in double slashes like //photo of me//

                - Buttons, which are either [inline] or [[reply]]. Node can contain both types, but it can contain many buttons of the same type


    Connections

        Each connection represents a possible user action or bot transition, on its own line.

        Syntax:
        FROM_NODE == "User action" ==> TO_NODE

        There are two kinds of arrows:

            == (thick arrow): Represents sending a new message.

            -- (thin arrow): Represents editing the previous message.

        Arrow comments (the text in double quotes) describe the user interaction that triggers the transition:

            Button: [Button Text] (inside square brackets)

            Media: //photo//, //video// (inside double slashes)

            Text: Plain text in double quotes

        No mixing arrow types: For a given user action between two nodes, you cannot use both == and -- arrows for the same comment.

    Formatting and Labeling

        All node labels and arrow comments must be in double quotes.

        Multi-line labels are supported.

    General

        Only flowcharts are validated.

        Any deviation from the above formats will be considered an error.