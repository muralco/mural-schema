Feature: JSON Schema

Scenario: String array
  When mapping to JSON schema ["string"]
  Then the resulting schema is
    """
    {
      "type": "array",
      "items": { "type": "string" }
    }
    """

Scenario: Object
  When mapping to JSON schema
    """
    {
      "a": "number",
      "b?": "boolean",
      "c": "string?"
    }
    """
  Then the resulting schema is
    """
    {
      "type": "object",
      "properties": {
        "a": { "type": "number" },
        "b": { "type": "boolean" },
        "c": { "type": "string" }
      },
      "required": ["a"]
    }
    """

Scenario: Literal union
  When mapping to JSON schema "'a'|#b|`c`|\"d\""
  Then the resulting schema is { "enum": ["a", "b", "c", "d"] }
