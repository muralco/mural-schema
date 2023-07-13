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
      "required": ["a"],
      "additionalProperties": false
    }
    """

Scenario: Object array
  When mapping to JSON schema
    """
    [
      {
        "a": "number",
        "b?": "boolean",
        "c": "string?"
      }
    ]
    """
  Then the resulting schema is
    """
    {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "a": { "type": "number" },
          "b": { "type": "boolean" },
          "c": { "type": "string" }
        },
        "required": ["a"],
        "additionalProperties": false
      }
    }
    """

Scenario: Object with `$strict: false`
  When mapping to JSON schema
    """
    {
      "a": "number",
      "b?": "boolean",
      "c": "string?",
      "$strict": false
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

Scenario: Object with `$any` key
  When mapping to JSON schema
    """
    {
      "$any": "number"
    }
    """
  Then the resulting schema is
    """
    {
      "type": "object",
      "properties": {},
      "required": [],
      "additionalProperties": {
        "type": "number"
      }
    }
    """

Scenario: Nested object with `$any` key
  When mapping to JSON schema
    """
    {
      "a": "string",
      "b?": {
        "$any": "number"
      }
    }
    """
  Then the resulting schema is
    """
    {
      "type": "object",
      "properties": {
        "a": { "type": "string" },
        "b": {
          "type": "object",
          "properties": {},
          "required": [],
          "additionalProperties": {
            "type": "number"
          }
        }
      },
      "required": ["a"],
      "additionalProperties": false
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
