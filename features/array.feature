Feature: array

Scenario: success number
  Given a schema ["number"]
  When validating [1, 2, 3]
  Then the validation passes

Scenario: success number, string or object
  Given a schema ["number", "string", { "a": "boolean" }]
  When validating [1, "two", 3, { "a": true }]
  Then the validation passes

Scenario: error invalid type
  Given a schema ["number"]
  When validating 1
  Then the validation error is "Expected array"

Scenario: error invalid array type
  Given a schema ["number"]
  When validating [0, true]
  Then the validation error is
    """
    {
      "message": "Expected number",
      "key": "body.1",
      "expected": "number"
    }
    """

Scenario: error invalid array object type
  Given a schema [{ "a": "string" }]
  When validating [{ "a": 123 }]
  Then the validation error is
    """
    {
      "message": "Expected string",
      "key": "body.0.a",
      "expected": "string"
    }
    """

# Scenario: error string
#   When validating "yeah"
#   Then the validation error is "Expected boolean"

# Scenario: error object
#   When validating { "a": 1 }
#   Then the validation error is "Expected boolean"

# Scenario: error array
#   When validating []
#   Then the validation error is "Expected boolean"
