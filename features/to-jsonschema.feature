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

Scenario: String
  When mapping to JSON schema "string"
  Then the resulting schema is
    """
    {
      "type": "string"
    }
    """

Scenario: Null
  When mapping to JSON schema "null"
  Then the resulting schema is
    """
    {
      "type": "null"
    }
    """

Scenario: String and null union
  When mapping to JSON schema "string|null"
  Then the resulting schema is
    """
    {
      "anyOf": [
        { "type": "string" },
        { "type": "null" }
      ]
    }
    """

Scenario: Regular expression
  When mapping to JSON schema /^\d+$/
  Then the resulting schema is
    """
    {
      "pattern": "^\\d+$",
      "type": "string"
    }
    """

# JSON Schema doesn't support regular expression flags
Scenario: Regular expression with flags
  When mapping to JSON schema /^[A-Z]+$/i
  Then the resulting schema is
    """
    {
      "pattern": "^[A-Z]+$",
      "type": "string"
    }
    """
